#!/usr/bin/env python3
import json
import hashlib
import base64
import math
import signal
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


class OutputLimitExceeded(Exception):
    pass


class InvalidCanonicalOutput(Exception):
    pass


class GuestWallExceeded(BaseException):
    pass


class BoundedCanonicalJsonWriter:
    MAX_DEPTH = 64
    MAX_NODES = 262_144
    MAX_ARRAY_ENTRIES = 65_536
    MAX_OBJECT_ENTRIES = 65_536

    def __init__(self, output_limit):
        self.output_limit = output_limit
        self.output = bytearray()
        self.nodes = 0
        self.active_containers = set()

    def append(self, value):
        if len(self.output) + len(value) > self.output_limit:
            raise OutputLimitExceeded()
        self.output.extend(value)

    def write_string(self, value):
        self.append(b'"')
        for character in value:
            unit = ord(character)
            if 0xD800 <= unit <= 0xDFFF:
                raise InvalidCanonicalOutput()
            escape = {
                0x22: b'\\"',
                0x5C: b"\\\\",
                0x08: b"\\b",
                0x0C: b"\\f",
                0x0A: b"\\n",
                0x0D: b"\\r",
                0x09: b"\\t",
            }.get(unit)
            if escape is not None:
                self.append(escape)
            elif unit < 0x20:
                self.append(("\\u" + format(unit, "04x")).encode("ascii"))
            else:
                self.append(character.encode("utf-8"))
        self.append(b'"')

    def enter_container(self, value, depth, maximum_entries):
        if depth >= self.MAX_DEPTH or len(value) > maximum_entries:
            raise InvalidCanonicalOutput()
        identity = id(value)
        if identity in self.active_containers:
            raise InvalidCanonicalOutput()
        self.active_containers.add(identity)
        return identity

    def write(self, value, depth=0):
        self.nodes += 1
        if self.nodes > self.MAX_NODES:
            raise InvalidCanonicalOutput()
        if value is None:
            self.append(b"null")
        elif value is True:
            self.append(b"true")
        elif value is False:
            self.append(b"false")
        elif type(value) is int:
            if value < -9_007_199_254_740_991 or value > 9_007_199_254_740_991:
                raise InvalidCanonicalOutput()
            self.append(str(value).encode("ascii"))
        elif type(value) is float:
            self.append(canonical_float(value).encode("ascii"))
        elif type(value) is str:
            self.write_string(value)
        elif type(value) in (list, tuple):
            identity = self.enter_container(value, depth, self.MAX_ARRAY_ENTRIES)
            try:
                self.append(b"[")
                for index, item in enumerate(value):
                    if index:
                        self.append(b",")
                    self.write(item, depth + 1)
                self.append(b"]")
            finally:
                self.active_containers.remove(identity)
        elif type(value) is dict:
            identity = self.enter_container(value, depth, self.MAX_OBJECT_ENTRIES)
            try:
                entries = []
                for key, item in value.items():
                    if type(key) is not str:
                        raise InvalidCanonicalOutput()
                    try:
                        sort_key = key.encode("utf-8")
                    except UnicodeEncodeError:
                        raise InvalidCanonicalOutput()
                    entries.append((sort_key, key, item))
                entries.sort(key=lambda entry: entry[0])
                self.append(b"{")
                for index, (_sort_key, key, item) in enumerate(entries):
                    if index:
                        self.append(b",")
                    self.write_string(key)
                    self.append(b":")
                    self.write(item, depth + 1)
                self.append(b"}")
            finally:
                self.active_containers.remove(identity)
        else:
            raise InvalidCanonicalOutput()

    def bytes(self):
        return bytes(self.output)


def bounded_canonical_json_bytes(value, output_limit):
    writer = BoundedCanonicalJsonWriter(output_limit)
    writer.write(value)
    return writer.bytes()


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
    if set(envelope.keys()) != {
        "abiVersion",
        "hostProtocol",
        "methodName",
        "source",
        "input",
        "budget",
    }:
        sys.stdout.write('{"kind":"host_failure"}')
        return 0
    source_info = envelope.get("source", {})
    budget = envelope.get("budget", {})
    if (
        type(source_info) is not dict
        or set(source_info.keys()) != {"text", "hash", "bytes"}
        or type(budget) is not dict
        or set(budget.keys()) != {
            "wallMilliseconds",
            "outputBytes",
            "computeFuel",
            "memoryBytes",
            "computeEnforcement",
            "memoryEnforcement",
        }
        or type(budget.get("wallMilliseconds")) is not int
        or budget["wallMilliseconds"] <= 0
        or type(budget.get("outputBytes")) is not int
        or budget["outputBytes"] < 0
        or type(budget.get("computeFuel")) is not int
        or budget["computeFuel"] < 0
        or type(budget.get("memoryBytes")) is not int
        or budget["memoryBytes"] < 0
        or budget.get("computeEnforcement") != "unavailable"
        or budget.get("memoryEnforcement") != "unavailable"
        or envelope.get("methodName") not in ("selectActivations", "soldierBrain")
    ):
        sys.stdout.write('{"kind":"host_failure"}')
        return 0
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
    except Exception:
        sys.stdout.write('{"kind":"host_failure"}')
        return 0

    guest_wall_exceeded = False

    def guest_wall_handler(_signal_number, _frame):
        nonlocal guest_wall_exceeded
        guest_wall_exceeded = True
        raise GuestWallExceeded()

    previous_handler = signal.signal(signal.SIGALRM, guest_wall_handler)
    signal.setitimer(signal.ITIMER_REAL, budget["wallMilliseconds"] / 1000)
    try:
        result = namespace[function_name](envelope.get("input"))
    except GuestWallExceeded:
        sys.stdout.write('{"kind":"strategy_timeout"}')
        return 0
    except Exception:
        sys.stdout.write('{"kind":"strategy_exception"}')
        return 0
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous_handler)
    if guest_wall_exceeded:
        sys.stdout.write('{"kind":"strategy_timeout"}')
        return 0
    try:
        payload = bounded_canonical_json_bytes(result, budget["outputBytes"])
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
    except OutputLimitExceeded:
        sys.stdout.write('{"kind":"oversized_output"}')
    except Exception:
        sys.stdout.write('{"kind":"invalid_output"}')
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
