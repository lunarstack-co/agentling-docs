"""Every Python block under content/ runs, or says why it can't.

Each block runs in its own Python process from the repository root, so blocks
never share state. A block whose first line is `# not executed: <reason>` is
skipped with that reason.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
RUNNER = Path(__file__).with_name("run_block.py")
NOT_EXECUTED = "# not executed:"
TIMEOUT = 30

# Blocks that import `examples.providers` need the agentling source tree.
AGENTLING_SRC = Path(os.environ.get("AGENTLING_SRC", ROOT.parent / "agentling"))

_FENCE = re.compile(r"^```python[^\n]*\n(.*?)^```", re.S | re.M)


def _blocks() -> list[tuple[str, str]]:
    found = []
    for path in sorted(CONTENT.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        for match in _FENCE.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            found.append((f"{path.relative_to(ROOT)}:L{line}", match.group(1)))
    return found


_BLOCKS = _blocks()


def _environment() -> dict[str, str]:
    env = dict(os.environ)
    paths = [str(AGENTLING_SRC), env.get("PYTHONPATH", "")]
    env["PYTHONPATH"] = os.pathsep.join(p for p in paths if p)
    return env


@pytest.mark.parametrize(
    "source", [source for _, source in _BLOCKS], ids=[label for label, _ in _BLOCKS]
)
def test_block(source: str, request: pytest.FixtureRequest) -> None:
    label = request.node.callspec.id
    first = source.splitlines()[0] if source.strip() else ""
    if first.startswith(NOT_EXECUTED):
        reason = first.removeprefix(NOT_EXECUTED).strip()
        assert reason, f"block at {label} has an empty reason"
        pytest.skip(reason)

    result = subprocess.run(
        [sys.executable, str(RUNNER), label],
        input=source,
        capture_output=True,
        text=True,
        cwd=ROOT,
        env=_environment(),
        timeout=TIMEOUT,
    )

    assert result.returncode == 0, f"{label} failed:\n{result.stderr}"


def test_blocks_were_found() -> None:
    assert len(_BLOCKS) > 0
