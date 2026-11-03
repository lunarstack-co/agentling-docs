"""Every URL the 0.2.0 rewrite moved still lands on a live page."""

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "next.config.ts"
DOCS = ROOT / "content" / "docs"

MOVED = {
    "core-concepts/agent-loop": "concepts/the-agent-loop",
    "core-concepts/memory": "reference/memory",
    "core-concepts/skills": "tutorial/skills",
    "core-concepts/streaming-events": "tutorial/stream-events",
    "core-concepts/tools": "reference/tools",
    "guides/dynamic-tools-and-mcp": "how-to/tools-from-a-schema-or-mcp",
    "guides/error-handling": "tutorial/handle-failures",
    "guides/interruption": "how-to/interrupt-from-a-ui",
    "guides/other-providers": "how-to/write-a-model-adapter",
    "guides/persistence-and-resuming": "how-to/persist-sessions",
    "guides/sessions-and-concurrency": "reference/agent-and-session",
    "reference/agent-api": "reference/agent-and-session",
    "reference/openai-model": "how-to/write-a-model-adapter",
}


def _configured() -> dict[str, str]:
    text = CONFIG.read_text(encoding="utf-8")
    return dict(re.findall(r'\["([a-z0-9/-]+)",\s*"([a-z0-9/-]+)"\]', text))


def _live_routes() -> set[str]:
    routes = set()
    for page in DOCS.glob("*/*.md"):
        if page.name == "_section.md":
            continue
        slug = re.search(r"^slug:\s*(\S+)", page.read_text(encoding="utf-8"), re.M)
        if slug:
            routes.add(f"{page.parent.name}/{slug.group(1)}")
    return routes


@pytest.mark.parametrize("old", sorted(MOVED))
def test_old_url_redirects_to_its_new_page(old: str) -> None:
    assert _configured().get(old) == MOVED[old]


def test_every_destination_is_a_live_page() -> None:
    live = _live_routes()
    missing = {to for to in _configured().values() if to not in live}
    assert not missing, f"redirects point at pages that don't exist: {missing}"


def test_old_pages_are_gone() -> None:
    live = _live_routes()
    assert not set(MOVED) & live
