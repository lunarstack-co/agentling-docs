"""Run one Markdown code block, read from stdin, as a program.

Top-level `await` is allowed, and `__name__` is "__main__" so a block that is
a whole program runs its `main()` the way it would from a file.
"""

import ast
import asyncio
import inspect
import sys


def main() -> None:
    source = sys.stdin.read()
    label = sys.argv[1] if len(sys.argv) > 1 else "<block>"
    code = compile(source, label, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    result = eval(code, {"__name__": "__main__"})
    if inspect.iscoroutine(result):
        asyncio.run(result)


if __name__ == "__main__":
    main()
