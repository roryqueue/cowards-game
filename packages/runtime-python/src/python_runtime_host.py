#!/usr/bin/env python3
import json
import hashlib
import base64
import math
import sys

ABI_VERSION = "strategy-runtime-abi-v1.14"
CANDIDATE_ABI_VERSION = "strategy-runtime-abi-v1.17"
CANDIDATE_HOST_PROTOCOL = "python-runtime-host-v1.17"


def reject_duplicate_pairs(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError("duplicate JSON key")
        value[key] = item
    return value


def canonical_float(value):
    if not math.isfinite(value):
        raise ValueError("non-finite JSON number")
    if value == 0:
        return "0"
    lexical = repr(value).lower()
    if "e" not in lexical:
        return lexical[:-2] if lexical.endswith(".0") else lexical
    mantissa, raw_exponent = lexical.split("e", 1)
    exponent = int(raw_exponent)
    negative = mantissa.startswith("-")
    unsigned = mantissa[1:] if negative else mantissa
    digits = unsigned.replace(".", "")
    if -6 <= exponent < 21:
        decimal = 1 + exponent
        if decimal <= 0:
            rendered = "0." + ("0" * -decimal) + digits
        elif decimal >= len(digits):
            rendered = digits + ("0" * (decimal - len(digits)))
        else:
            rendered = digits[:decimal] + "." + digits[decimal:]
        return ("-" if negative else "") + rendered
    normalized_mantissa = unsigned[:-2] if unsigned.endswith(".0") else unsigned
    return ("-" if negative else "") + normalized_mantissa + "e" + str(exponent)


class CanonicalJsonEncoder(json.JSONEncoder):
    def iterencode(self, value, _one_shot=False):
        markers = {} if self.check_circular else None
        encoder = (
            json.encoder.encode_basestring_ascii
            if self.ensure_ascii
            else json.encoder.encode_basestring
        )
        iterator = json.encoder._make_iterencode(
            markers,
            self.default,
            encoder,
            self.indent,
            canonical_float,
            self.key_separator,
            self.item_separator,
            self.sort_keys,
            self.skipkeys,
            _one_shot,
        )
        return iterator(value, 0)


def canonical_json_bytes(value):
    return CanonicalJsonEncoder(
        allow_nan=False,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode(value).encode("utf-8")


def failure(kind, code, message, public_message):
    key = "violation" if kind == "runtimeViolation" else "systemFailure"
    return {
        "ok": False,
        "abiVersion": ABI_VERSION,
        "failureKind": kind,
        key: {
            "code": code,
            "message": message,
            "publicMessage": public_message,
        },
    }


def candidate_main(envelope):
    source_info = envelope.get("source", {})
    source = source_info.get("text")
    if not isinstance(source, str):
        sys.stdout.write(json.dumps({"kind": "host_failure"}, separators=(",", ":"), sort_keys=True))
        return 0
    source_bytes = source.encode("utf-8")
    if (
        hashlib.sha256(source_bytes).hexdigest() != source_info.get("hash")
        or len(source_bytes) != source_info.get("bytes")
    ):
        sys.stdout.write(json.dumps({"kind": "host_failure"}, separators=(",", ":"), sort_keys=True))
        return 0
    safe_builtins = {
        "abs": abs,
        "bool": bool,
        "dict": dict,
        "enumerate": enumerate,
        "int": int,
        "len": len,
        "list": list,
        "max": max,
        "min": min,
        "range": range,
        "round": round,
        "str": str,
        "sum": sum,
    }
    try:
        namespace = {"__builtins__": safe_builtins}
        exec(source, namespace, namespace)
        function_name = (
            "select_activations"
            if envelope.get("methodName") == "selectActivations"
            else "soldier_brain"
        )
        result = namespace[function_name](envelope.get("input"))
    except Exception:
        sys.stdout.write(
            json.dumps(
                {"kind": "strategy_exception"},
                separators=(",", ":"),
                sort_keys=True,
            )
        )
        return 0
    try:
        payload = canonical_json_bytes(result)
        sys.stdout.write(
            json.dumps(
                {
                    "kind": "payload",
                    "payloadBase64": base64.b64encode(payload).decode("ascii"),
                },
                separators=(",", ":"),
                sort_keys=True,
            )
        )
    except Exception:
        sys.stdout.write(
            json.dumps(
                {"kind": "invalid_output"},
                separators=(",", ":"),
                sort_keys=True,
            )
        )
    return 0


def main():
    try:
        raw = sys.stdin.buffer.read(8 * 1024 * 1024 + 1)
        if len(raw) > 8 * 1024 * 1024:
            raise ValueError("host request exceeds raw byte ceiling")
        envelope = json.loads(
            raw.decode("utf-8", errors="strict"),
            object_pairs_hook=reject_duplicate_pairs,
        )
    except (UnicodeDecodeError, ValueError, json.JSONDecodeError):
        sys.stdout.write(
            json.dumps(
                {"kind": "host_failure"},
                separators=(",", ":"),
                sort_keys=True,
            )
        )
        return 0
    if (
        envelope.get("abiVersion") == CANDIDATE_ABI_VERSION
        and envelope.get("hostProtocol") == CANDIDATE_HOST_PROTOCOL
    ):
        return candidate_main(envelope)
    if envelope.get("abiVersion") != ABI_VERSION:
        print(
            json.dumps(
                failure(
                    "systemFailure",
                    "MALFORMED_IPC",
                    "Unsupported Strategy runtime ABI version.",
                    "Runtime system failure.",
                )
            )
        )
        return 0

    source_info = envelope["source"]
    source = source_info["text"]
    actual_hash = hashlib.sha256(source.encode("utf-8")).hexdigest()
    if actual_hash != source_info["hash"] or len(source.encode("utf-8")) != source_info["bytes"]:
        print(
            json.dumps(
                failure(
                    "runtimeViolation",
                    "INVALID_OUTPUT",
                    "Python Strategy source identity mismatch.",
                    "Strategy returned an invalid result.",
                )
            )
        )
        return 0
    safe_builtins = {
        "abs": abs,
        "bool": bool,
        "dict": dict,
        "enumerate": enumerate,
        "int": int,
        "len": len,
        "list": list,
        "max": max,
        "min": min,
        "range": range,
        "round": round,
        "str": str,
        "sum": sum,
    }
    try:
        namespace = {"__builtins__": safe_builtins}
        exec(source, namespace, namespace)
        method_name = envelope["methodName"]
        function_name = (
            "select_activations"
            if method_name == "selectActivations"
            else "soldier_brain"
        )
        result = namespace[function_name](envelope["input"])
        print(
            json.dumps(
                {
                    "ok": True,
                    "abiVersion": ABI_VERSION,
                    "value": result,
                },
                separators=(",", ":"),
            )
        )
    except KeyError as error:
        print(
            json.dumps(
                failure(
                    "runtimeViolation",
                    "INVALID_OUTPUT",
                    f"Missing Python Strategy function: {error}",
                    "Strategy returned an invalid result.",
                )
            )
        )
    except Exception as error:
        print(
            json.dumps(
                failure(
                    "runtimeViolation",
                    "THROWN_EXCEPTION",
                    str(error),
                    "Strategy threw an exception.",
                )
            )
        )


if __name__ == "__main__":
    main()
