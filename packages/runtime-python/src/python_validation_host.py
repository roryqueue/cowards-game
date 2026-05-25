#!/usr/bin/env python3
import ast
import json
import sys


FORBIDDEN_CALLS = {
    "__import__",
    "compile",
    "eval",
    "exec",
    "getattr",
    "globals",
    "locals",
    "open",
    "setattr",
}

FORBIDDEN_NAMES = {
    "builtins",
    "ctypes",
    "importlib",
    "os",
    "pathlib",
    "site",
    "socket",
    "subprocess",
    "sys",
}


def issue(code, message, pattern=None, line=None, column=None):
    value = {"code": code, "message": message}
    if pattern:
        value["pattern"] = pattern
    if line:
        value["line"] = line
    if column is not None:
        value["column"] = column
    return value


def call_name(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def root_name(node):
    current = node
    while isinstance(current, ast.Attribute):
        current = current.value
    return current.id if isinstance(current, ast.Name) else None


class StrategyValidationVisitor(ast.NodeVisitor):
    def __init__(self):
        self.issues = []
        self.functions = set()
        self.async_functions = set()
        self.forbidden_patterns = set()

    def add_forbidden(self, node, pattern, code="FORBIDDEN_PATTERN"):
        self.forbidden_patterns.add(pattern)
        self.issues.append(
            issue(
                code,
                "Python Strategy source uses a forbidden capability.",
                pattern,
                getattr(node, "lineno", None),
                max(getattr(node, "col_offset", 0), 0),
            )
        )

    def visit_Import(self, node):
        self.add_forbidden(node, "import", "IMPORT_NOT_ALLOWED")

    def visit_ImportFrom(self, node):
        self.add_forbidden(node, "import", "IMPORT_NOT_ALLOWED")

    def visit_FunctionDef(self, node):
        self.functions.add(node.name)
        if "__" in node.name:
            self.add_forbidden(node, "__")
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.functions.add(node.name)
        self.async_functions.add(node.name)
        self.issues.append(
            issue(
                "ASYNC_METHOD_NOT_ALLOWED",
                "Python Strategy methods must be synchronous.",
                "async",
                node.lineno,
                node.col_offset,
            )
        )
        self.generic_visit(node)

    def visit_Call(self, node):
        name = call_name(node.func)
        root = root_name(node.func)
        if name in FORBIDDEN_CALLS:
            self.add_forbidden(node, name)
        if root in FORBIDDEN_NAMES:
            self.add_forbidden(node, root)
        self.generic_visit(node)

    def visit_Name(self, node):
        if "__" in node.id:
            self.add_forbidden(node, "__")
        if node.id in FORBIDDEN_NAMES:
            self.add_forbidden(node, node.id)

    def visit_Attribute(self, node):
        if "__" in node.attr:
            self.add_forbidden(node, "__")
        root = root_name(node)
        if root in FORBIDDEN_NAMES:
            self.add_forbidden(node, root)
        self.generic_visit(node)

    def visit_Constant(self, node):
        if isinstance(node.value, str):
            lowered = node.value.lower()
            for pattern in ["site-packages", "/users/", "/home/", "token", "database_url"]:
                if pattern in lowered:
                    self.add_forbidden(node, pattern)


def validate(source):
    try:
        tree = ast.parse(source, filename="<strategy>")
        compile(tree, "<strategy>", "exec")
    except SyntaxError as error:
        return {
            "ok": True,
            "issues": [
                issue(
                    "TRANSPILE_FAILED",
                    "Python source failed AST/compile checks.",
                    "syntax",
                    error.lineno,
                    max((error.offset or 1) - 1, 0),
                )
            ],
            "forbiddenPatterns": [],
        }
    except Exception:
        return {
            "ok": True,
            "issues": [
                issue(
                    "TRANSPILE_FAILED",
                    "Python source failed AST/compile checks.",
                    "compile",
                )
            ],
            "forbiddenPatterns": [],
        }

    visitor = StrategyValidationVisitor()
    visitor.visit(tree)
    if "select_activations" not in visitor.functions:
        visitor.issues.append(
            issue(
                "MISSING_SELECT_ACTIVATIONS",
                "Python Strategy must define select_activations(input).",
            )
        )
    if "soldier_brain" not in visitor.functions:
        visitor.issues.append(
            issue(
                "MISSING_SOLDIER_BRAIN",
                "Python Strategy must define soldier_brain(input).",
            )
        )
    return {
        "ok": True,
        "issues": visitor.issues,
        "forbiddenPatterns": sorted(visitor.forbidden_patterns),
        "functions": sorted(visitor.functions),
    }


def main():
    try:
        payload = json.loads(sys.stdin.read())
        source = payload.get("source", "")
        if not isinstance(source, str):
            raise ValueError("source must be a string")
        print(json.dumps(validate(source), separators=(",", ":")))
    except Exception:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "VALIDATION_HOST_FAILED",
                },
                separators=(",", ":"),
            )
        )


if __name__ == "__main__":
    main()
