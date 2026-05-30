#!/usr/bin/env python3
"""
List blog posts sorted by publishedAt date.

Usage (from the project root):
    python scripts/list-posts.py
    python scripts/list-posts.py --all      # include future/undated posts too
"""

import argparse
import re
from datetime import date
from pathlib import Path

POSTS_DIR = Path(__file__).parent.parent / "src" / "lib" / "posts"
TODAY = date.today()

RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
GREEN  = "\033[32m"
YELLOW = "\033[33m"
CYAN   = "\033[36m"
RED    = "\033[31m"


def parse_frontmatter(path: Path) -> dict:
    """Extract key/value pairs from the YAML frontmatter block."""
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return {}

    fm: dict = {}
    for line in match.group(1).splitlines():
        kv = re.match(r"^(\w+)\s*:\s*(.+)$", line.strip())
        if kv:
            key, value = kv.group(1), kv.group(2).strip().strip("'\"")
            fm[key] = value
    return fm


def status(published_at_str: str | None) -> tuple[str, str]:
    """Return (label, colour) for a publishedAt value."""
    if not published_at_str:
        return "no date ", DIM
    try:
        d = date.fromisoformat(published_at_str)
    except ValueError:
        return "bad date", RED
    if d > TODAY:
        return "future  ", YELLOW   # scheduled
    return "live    ", GREEN        # published


def main() -> None:
    parser = argparse.ArgumentParser(description="List posts by publishedAt date.")
    parser.add_argument(
        "--all", action="store_true",
        help="Include posts with no date or a future date (drafts/scheduled)"
    )
    args = parser.parse_args()

    posts = []
    for md in sorted(POSTS_DIR.glob("*.md")):
        fm = parse_frontmatter(md)
        date_str  = fm.get("publishedAt")
        title     = fm.get("title", "(no title)")
        cefr      = fm.get("cefr", "—")
        post_type = fm.get("type", "word")

        try:
            d = date.fromisoformat(date_str) if date_str else None
        except ValueError:
            d = None

        posts.append((d, date_str, md.name, title, cefr, post_type))

    # Newest-first; undated posts sink to the bottom
    posts.sort(key=lambda p: (p[0] is None, -(p[0].toordinal() if p[0] else 0)))

    today     = TODAY.isoformat()
    published = [p for p in posts if p[0] and p[0] <= TODAY]
    scheduled = [p for p in posts if p[0] and p[0] > TODAY]
    undated   = [p for p in posts if not p[0]]

    def print_section(header: str, rows: list) -> None:
        if not rows:
            return
        print(f"\n{BOLD}{header}{RESET}")
        print("─" * 76)
        for (d, date_str, fname, title, cefr, post_type) in rows:
            label, colour = status(date_str)
            date_col = date_str or "—         "
            type_tag = f"  {DIM}[guide]{RESET}" if post_type == "guide" else ""
            print(
                f"  {colour}{date_col}{RESET}  "
                f"{CYAN}{fname:<40}{RESET}  "
                f"{title}{type_tag}"
            )

    print(
        f"\n{BOLD}Blog posts — sorted by publishedAt{RESET}  "
        f"{DIM}(today: {today}){RESET}"
    )

    print_section(f"✓  Published ({len(published)})", published)

    if args.all or scheduled:
        print_section(f"◷  Scheduled ({len(scheduled)})", scheduled)

    if args.all or undated:
        print_section(f"?  No date   ({len(undated)})", undated)

    print()
    if not args.all and (scheduled or undated):
        hidden = len(scheduled) + len(undated)
        print(
            f"{DIM}  {hidden} draft/scheduled post(s) hidden "
            f"— run with --all to show them{RESET}\n"
        )


if __name__ == "__main__":
    main()
