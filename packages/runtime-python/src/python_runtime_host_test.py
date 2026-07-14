import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import unittest


HOST = Path(__file__).with_name("python_runtime_host.py")
SOURCE = (
    "def select_activations(input):\n"
    "    return {\"activationOrders\": [], \"strategyMemory\": None}\n\n"
    "def soldier_brain(input):\n"
    "    return {\"action\": {\"type\": \"TURN_TO_STONE\"}, \"soldierMemory\": None}\n"
)


def method_limit():
    return {
        "method": "selectActivations",
        "invocationCountMaximum": 20,
        "counters": {
            "wallMilliseconds": {"semantics": "counter", "maximum": 50},
            "computeFuel": {"semantics": "counter", "maximum": 10_000_000},
            "payloadBytes": {"semantics": "counter", "maximum": 262_144},
            "stdoutBytes": {"semantics": "counter", "maximum": 262_144},
            "stderrBytes": {"semantics": "counter", "maximum": 65_536},
        },
        "memory": {"semantics": "peak", "maximumBytes": 67_108_864},
        "process": {
            "semantics": "predicate",
            "processes": 1,
            "threads": 1,
            "children": 0,
        },
        "capabilities": {
            "semantics": "predicate",
            "filesystem": "none",
            "network": "disabled",
            "environment": "empty",
            "shell": "disabled",
        },
        "cancellation": {
            "semantics": "predicate",
            "terminationGraceMilliseconds": 100,
            "evidence": "adapter-termination-receipt-required",
        },
        "accountingEvidence": {"semantics": "predicate", "required": True},
    }


def candidate_envelope(budget, source=SOURCE):
    source_bytes = source.encode("utf-8")
    return {
        "abiVersion": "strategy-runtime-abi-v1.17",
        "hostProtocol": "python-runtime-host-v1.17",
        "methodName": "selectActivations",
        "source": {
            "text": source,
            "hash": hashlib.sha256(source_bytes).hexdigest(),
            "bytes": len(source_bytes),
        },
        "input": {},
        "budget": budget,
    }


def run_host(envelope):
    completed = subprocess.run(
        [sys.executable, "-I", str(HOST)],
        input=json.dumps(envelope, separators=(",", ":")).encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={},
        check=True,
        timeout=5,
    )
    return json.loads(completed.stdout.decode("utf-8"))


class PythonRuntimeHostV117Tests(unittest.TestCase):
    def test_accepts_exact_nested_method_limit(self):
        result = run_host(
            candidate_envelope(
                {
                    "methodLimit": method_limit(),
                    "meterStatus": {
                        "computeFuel": "unavailable",
                        "memoryBytes": "unavailable",
                    },
                }
            )
        )
        self.assertEqual(result["kind"], "payload")
        self.assertEqual(
            json.loads(base64.b64decode(result["payloadBase64"])),
            {"activationOrders": [], "strategyMemory": None},
        )

    def test_rejects_retired_flat_budget_aliases(self):
        result = run_host(
            candidate_envelope(
                {
                    "wallMilliseconds": 50,
                    "outputBytes": 262_144,
                    "computeFuel": 10_000_000,
                    "memoryBytes": 67_108_864,
                    "computeEnforcement": "unavailable",
                    "memoryEnforcement": "unavailable",
                }
            )
        )
        self.assertEqual(result, {"kind": "host_failure"})

    def test_preflight_watchdog_is_distinct_from_signed_method_timeout(self):
        source = (
            "while True:\n"
            "    pass\n\n"
            "def select_activations(input):\n"
            "    return {\"activationOrders\": [], \"strategyMemory\": None}\n"
        )
        started = time.monotonic()
        result = run_host(
            candidate_envelope(
                {
                    "methodLimit": method_limit(),
                    "meterStatus": {
                        "computeFuel": "unavailable",
                        "memoryBytes": "unavailable",
                    },
                },
                source,
            )
        )

        self.assertEqual(result, {"kind": "pre_method_host_failure"})
        self.assertLess(time.monotonic() - started, 2.5)

    def test_missing_method_is_a_pre_method_host_failure(self):
        source = (
            "def soldier_brain(input):\n"
            "    return {\"action\": {\"type\": \"TURN_TO_STONE\"}, \"soldierMemory\": None}\n"
        )
        result = run_host(
            candidate_envelope(
                {
                    "methodLimit": method_limit(),
                    "meterStatus": {
                        "computeFuel": "unavailable",
                        "memoryBytes": "unavailable",
                    },
                },
                source,
            )
        )

        self.assertEqual(result, {"kind": "pre_method_host_failure"})


if __name__ == "__main__":
    unittest.main()
