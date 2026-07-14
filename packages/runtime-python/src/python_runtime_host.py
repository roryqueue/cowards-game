#!/usr/bin/env python3
import json
import hashlib
import base64
import math
import os
import select
import sys
import time

ABI_VERSION = "strategy-runtime-abi-v1.14"
CANDIDATE_ABI_VERSION = "strategy-runtime-abi-v1.17"
CANDIDATE_HOST_PROTOCOL = "python-runtime-host-v1.17"
MAX_SAFE_INTEGER = 9_007_199_254_740_991


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
        try:
            encoded = value.encode("utf-8")
        except UnicodeEncodeError:
            raise InvalidCanonicalOutput()
        if (
            b'"' not in encoded
            and b"\\" not in encoded
            and not any(unit < 0x20 for unit in encoded)
        ):
            self.append(b'"' + encoded + b'"')
            return
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


def close_quietly(descriptor):
    try:
        os.close(descriptor)
    except OSError:
        pass


def write_all(descriptor, value):
    offset = 0
    while offset < len(value):
        written = os.write(descriptor, value[offset:])
        if written <= 0:
            raise OSError("short pipe write")
        offset += written


def candidate_envelope_bytes(kind, payload=None):
    value = {"kind": kind}
    if payload is not None:
        value["payloadBase64"] = base64.b64encode(payload).decode("ascii")
    return json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")


def kill_and_reap(child_pid):
    try:
        os.kill(child_pid, 9)
    except ProcessLookupError:
        pass
    try:
        os.waitpid(child_pid, 0)
    except ChildProcessError:
        pass


def run_candidate_guest(
    source,
    function_name,
    input_value,
    budget,
    safe_builtins,
):
    if not hasattr(os, "fork"):
        return {"kind": "host_failure"}
    ready_read, ready_write = os.pipe()
    go_read, go_write = os.pipe()
    result_read, result_write = os.pipe()
    try:
        child_pid = os.fork()
    except OSError:
        for descriptor in (
            ready_read,
            ready_write,
            go_read,
            go_write,
            result_read,
            result_write,
        ):
            close_quietly(descriptor)
        return {"kind": "host_failure"}

    if child_pid == 0:
        close_quietly(ready_read)
        close_quietly(go_write)
        close_quietly(result_read)
        try:
            write_all(ready_write, b"R")
            close_quietly(ready_write)
            if os.read(go_read, 1) != b"G":
                os._exit(2)
            close_quietly(go_read)
            try:
                namespace = {"__builtins__": safe_builtins}
                exec(source, namespace, namespace)
            except BaseException:
                write_all(
                    result_write,
                    candidate_envelope_bytes("strategy_exception"),
                )
            else:
                function = namespace.get(function_name)
                if not callable(function):
                    write_all(
                        result_write,
                        candidate_envelope_bytes("invalid_output"),
                    )
                else:
                    try:
                        result = function(input_value)
                    except BaseException:
                        write_all(
                            result_write,
                            candidate_envelope_bytes("strategy_exception"),
                        )
                    else:
                        try:
                            payload = bounded_canonical_json_bytes(
                                result,
                                budget["counters"]["payloadBytes"]["maximum"],
                            )
                            write_all(
                                result_write,
                                candidate_envelope_bytes("payload", payload),
                            )
                        except OutputLimitExceeded:
                            write_all(
                                result_write,
                                candidate_envelope_bytes("oversized_output"),
                            )
                        except BaseException:
                            write_all(
                                result_write,
                                candidate_envelope_bytes("invalid_output"),
                            )
        except BaseException:
            os._exit(3)
        finally:
            close_quietly(ready_write)
            close_quietly(go_read)
            close_quietly(result_write)
        os._exit(0)

    close_quietly(ready_write)
    close_quietly(go_read)
    close_quietly(result_write)
    try:
        ready, _, _ = select.select([ready_read], [], [], 5.0)
        if not ready or os.read(ready_read, 1) != b"R":
            kill_and_reap(child_pid)
            return {"kind": "host_failure"}
        close_quietly(ready_read)

        deadline = (
            time.monotonic()
            + budget["counters"]["wallMilliseconds"]["maximum"] / 1000
        )
        try:
            write_all(go_write, b"G")
        except OSError:
            kill_and_reap(child_pid)
            return {"kind": "host_failure"}
        finally:
            close_quietly(go_write)

        chunks = []
        observed_bytes = 0
        payload_limit = budget["counters"]["payloadBytes"]["maximum"]
        maximum_envelope_bytes = ((payload_limit + 2) // 3) * 4 + 128
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                kill_and_reap(child_pid)
                return {"kind": "strategy_timeout"}
            readable, _, _ = select.select([result_read], [], [], remaining)
            if not readable:
                kill_and_reap(child_pid)
                return {"kind": "strategy_timeout"}
            chunk = os.read(result_read, 65_536)
            if not chunk:
                if time.monotonic() > deadline:
                    kill_and_reap(child_pid)
                    return {"kind": "strategy_timeout"}
                break
            observed_bytes += len(chunk)
            if observed_bytes > maximum_envelope_bytes:
                kill_and_reap(child_pid)
                return {"kind": "host_failure"}
            chunks.append(chunk)

        _, status = os.waitpid(child_pid, 0)
        if os.waitstatus_to_exitcode(status) != 0:
            return {"kind": "host_failure"}
        envelope_bytes = b"".join(chunks)
        if not envelope_bytes:
            return {"kind": "host_failure"}
        return {"kind": "forward", "envelope": envelope_bytes}
    finally:
        close_quietly(ready_read)
        close_quietly(go_write)
        close_quietly(result_read)


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


def has_exact_keys(value, expected):
    return type(value) is dict and set(value.keys()) == set(expected)


def is_nonnegative_safe_integer(value):
    return type(value) is int and 0 <= value <= MAX_SAFE_INTEGER


def is_counter_limit(value):
    return (
        has_exact_keys(value, {"semantics", "maximum"})
        and value.get("semantics") == "counter"
        and is_nonnegative_safe_integer(value.get("maximum"))
    )


def valid_candidate_method_limit(method_limit, method_name):
    if not has_exact_keys(
        method_limit,
        {
            "method",
            "invocationCountMaximum",
            "counters",
            "memory",
            "process",
            "capabilities",
            "cancellation",
            "accountingEvidence",
        },
    ):
        return False
    counters = method_limit.get("counters")
    memory = method_limit.get("memory")
    process = method_limit.get("process")
    capabilities = method_limit.get("capabilities")
    cancellation = method_limit.get("cancellation")
    accounting_evidence = method_limit.get("accountingEvidence")
    counter_names = {
        "wallMilliseconds",
        "computeFuel",
        "payloadBytes",
        "stdoutBytes",
        "stderrBytes",
    }
    return (
        method_limit.get("method") == method_name
        and is_nonnegative_safe_integer(method_limit.get("invocationCountMaximum"))
        and has_exact_keys(counters, counter_names)
        and all(is_counter_limit(counters.get(name)) for name in counter_names)
        and counters["wallMilliseconds"]["maximum"] > 0
        and has_exact_keys(memory, {"semantics", "maximumBytes"})
        and memory.get("semantics") == "peak"
        and is_nonnegative_safe_integer(memory.get("maximumBytes"))
        and has_exact_keys(
            process,
            {"semantics", "processes", "threads", "children"},
        )
        and process.get("semantics") == "predicate"
        and is_nonnegative_safe_integer(process.get("processes"))
        and is_nonnegative_safe_integer(process.get("threads"))
        and is_nonnegative_safe_integer(process.get("children"))
        and has_exact_keys(
            capabilities,
            {"semantics", "filesystem", "network", "environment", "shell"},
        )
        and capabilities.get("semantics") == "predicate"
        and type(capabilities.get("filesystem")) is str
        and type(capabilities.get("network")) is str
        and type(capabilities.get("environment")) is str
        and type(capabilities.get("shell")) is str
        and has_exact_keys(
            cancellation,
            {"semantics", "terminationGraceMilliseconds", "evidence"},
        )
        and cancellation.get("semantics") == "predicate"
        and is_nonnegative_safe_integer(
            cancellation.get("terminationGraceMilliseconds")
        )
        and type(cancellation.get("evidence")) is str
        and has_exact_keys(accounting_evidence, {"semantics", "required"})
        and accounting_evidence.get("semantics") == "predicate"
        and accounting_evidence.get("required") is True
    )


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
    method_name = envelope.get("methodName")
    method_limit = budget.get("methodLimit", {}) if type(budget) is dict else {}
    meter_status = budget.get("meterStatus", {}) if type(budget) is dict else {}
    if (
        type(source_info) is not dict
        or set(source_info.keys()) != {"text", "hash", "bytes"}
        or not has_exact_keys(budget, {"methodLimit", "meterStatus"})
        or not has_exact_keys(meter_status, {"computeFuel", "memoryBytes"})
        or meter_status.get("computeFuel") != "unavailable"
        or meter_status.get("memoryBytes") != "unavailable"
        or method_name not in ("selectActivations", "soldierBrain")
        or not valid_candidate_method_limit(method_limit, method_name)
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
    function_name = (
        "select_activations"
        if envelope.get("methodName") == "selectActivations"
        else "soldier_brain"
    )
    guest = run_candidate_guest(
        source,
        function_name,
        envelope.get("input"),
        method_limit,
        safe_builtins,
    )
    if guest["kind"] == "forward":
        # The supervised child has already constructed and transferred the
        # complete exact envelope before its deadline. This parent seam only
        # forwards those observed bytes; it performs no output transformation.
        sys.stdout.buffer.write(guest["envelope"])
        sys.stdout.buffer.flush()
    elif guest["kind"] == "strategy_timeout":
        sys.stdout.write('{"kind":"strategy_timeout"}')
    else:
        sys.stdout.write('{"kind":"host_failure"}')
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
