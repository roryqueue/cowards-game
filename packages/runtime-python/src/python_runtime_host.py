#!/usr/bin/env python3
import json
import sys

ABI_VERSION = "strategy-runtime-abi-v1.14"


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


def main():
    envelope = json.loads(sys.stdin.read())
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

    source = envelope["source"]["text"]
    namespace = {}
    safe_builtins = {
        "dict": dict,
        "enumerate": enumerate,
        "len": len,
        "list": list,
        "range": range,
        "str": str,
        "sum": sum,
    }
    try:
        exec(source, {"__builtins__": safe_builtins}, namespace)
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
