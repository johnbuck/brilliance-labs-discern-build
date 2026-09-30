#!/usr/bin/env python
"""Retrieve BSB Scripture from the bundled Smart JSON source.

This helper builds a local SQLite FTS index from bsb_smart.json and provides
reference lookup plus keyword retrieval for Scripture, footnotes, alternate
readings, and headings. No network access or third-party packages are required.
"""
from __future__ import annotations

import argparse
import json
from contextlib import closing
import os
import re
import sqlite3
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

SKILL_DIR = Path(__file__).resolve().parents[1]
SOURCE_PATH = SKILL_DIR / "assets" / "bsb_smart.json"
CACHE_ROOT = Path(os.environ.get("LOCALAPPDATA") or os.environ.get("XDG_CACHE_HOME") or Path.home() / ".cache")
DB_PATH = CACHE_ROOT / "brilliance-labs" / "bsb-scripture-retrieval" / "bsb_fts.sqlite"


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def norm_alias(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def flatten_content(obj: Any) -> str:
    """Flatten USJ content to human-readable text, skipping structural markers."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, list):
        return "".join(flatten_content(item) for item in obj)
    if isinstance(obj, dict):
        obj_type = obj.get("type")
        if obj_type in {"book", "chapter", "verse"}:
            return ""
        if obj_type == "ref":
            text = flatten_content(obj.get("content"))
            return text or obj.get("loc", "")
        return flatten_content(obj.get("content"))
    return str(obj)


def note_ref_from_flat_note(book_name: str, flat_note: str) -> str | None:
    """Footnotes begin with an fr marker like '1:3 '. Use that when present."""
    match = re.match(r"^\s*(\d+)\s*:\s*(\d+)\b", flat_note)
    if not match:
        return None
    chapter, verse = match.groups()
    return f"{book_name} {int(chapter)}:{int(verse)}"


def walk_usj_for_notes_and_headings(book: dict[str, Any]) -> tuple[dict[str, list[str]], dict[str, str]]:
    notes_by_ref: dict[str, list[str]] = defaultdict(list)
    heading_by_ref: dict[str, str] = {}
    current: dict[str, Any] = {"chapter": None, "verse": None, "heading": ""}
    book_name = book["name"]

    heading_markers = {"s", "s1", "s2", "s3", "s4", "ms", "ms1", "ms2", "ms3"}

    def current_ref() -> str | None:
        if current["chapter"] is None or current["verse"] is None:
            return None
        return f"{book_name} {int(current['chapter'])}:{int(current['verse'])}"

    def walk(node: Any) -> None:
        if isinstance(node, list):
            for child in node:
                walk(child)
            return
        if not isinstance(node, dict):
            return

        node_type = node.get("type")
        marker = node.get("marker")

        if node_type == "chapter":
            raw_number = node.get("number")
            try:
                current["chapter"] = int(str(raw_number).split("-")[0])
            except (TypeError, ValueError):
                current["chapter"] = None
            current["verse"] = None
            return

        if node_type == "verse":
            raw_number = node.get("number")
            try:
                current["verse"] = int(str(raw_number).split("-")[0])
            except (TypeError, ValueError):
                current["verse"] = None
            ref = current_ref()
            if ref and current.get("heading"):
                heading_by_ref[ref] = current["heading"]
            return

        if node_type == "note":
            flat = clean_text(flatten_content(node.get("content")))
            if flat:
                ref = note_ref_from_flat_note(book_name, flat) or current_ref()
                if ref:
                    notes_by_ref[ref].append(flat)
            return

        if node_type == "para" and marker in heading_markers:
            heading = clean_text(flatten_content(node.get("content")))
            if heading:
                current["heading"] = heading
            # Still walk in case a source ever nests verse markers in a heading.

        if "content" in node:
            walk(node["content"])

    walk(book.get("usj", {}).get("content", []))
    return notes_by_ref, heading_by_ref


def book_aliases(book: dict[str, Any]) -> set[str]:
    aliases = {
        book.get("id", ""),
        book.get("osis", ""),
        book.get("name", ""),
        book.get("canonical_name", ""),
    }
    aliases.update(book.get("abbreviations", []))
    if book.get("id") == "PSA":
        aliases.update({"Psalm", "Psalms", "Ps", "Psa"})
    if book.get("id") == "SNG":
        aliases.update({"Song of Solomon", "Song of Songs", "Canticles", "SOS", "Song"})
    return {alias for alias in aliases if alias}


def source_signature() -> dict[str, str]:
    stat = SOURCE_PATH.stat()
    return {
        "source_path": str(SOURCE_PATH),
        "source_size": str(stat.st_size),
        "source_mtime_ns": str(stat.st_mtime_ns),
    }


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def needs_rebuild(con: sqlite3.Connection) -> bool:
    if not DB_PATH.exists():
        return True
    try:
        meta = dict(con.execute("SELECT key, value FROM meta").fetchall())
    except sqlite3.Error:
        return True
    sig = source_signature()
    return any(meta.get(k) != v for k, v in sig.items())


def build_index(force: bool = False) -> None:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"BSB Smart JSON not found: {SOURCE_PATH}")

    with closing(connect()) as con:
        if not force and not needs_rebuild(con):
            return

        started = time.time()
        with SOURCE_PATH.open("r", encoding="utf-8-sig") as handle:
            data = json.load(handle)

        con.executescript(
            """
            DROP TABLE IF EXISTS meta;
            DROP TABLE IF EXISTS aliases;
            DROP TABLE IF EXISTS books;
            DROP TABLE IF EXISTS verses;
            DROP TABLE IF EXISTS verse_fts;

            CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE books(
                id TEXT PRIMARY KEY,
                order_num INTEGER NOT NULL,
                name TEXT NOT NULL,
                canonical_name TEXT NOT NULL,
                osis TEXT NOT NULL,
                aliases TEXT NOT NULL
            );
            CREATE TABLE aliases(
                alias_norm TEXT PRIMARY KEY,
                book_id TEXT NOT NULL REFERENCES books(id)
            );
            CREATE TABLE verses(
                id TEXT PRIMARY KEY,
                ordinal INTEGER NOT NULL,
                book_id TEXT NOT NULL REFERENCES books(id),
                book_order INTEGER NOT NULL,
                book_name TEXT NOT NULL,
                chapter INTEGER NOT NULL,
                verse INTEGER NOT NULL,
                reference TEXT NOT NULL UNIQUE,
                text TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                headings TEXT NOT NULL DEFAULT ''
            );
            CREATE VIRTUAL TABLE verse_fts USING fts5(
                reference,
                book_name,
                text,
                notes,
                headings
            );

            CREATE INDEX idx_verses_book_ordinal
                ON verses(book_id, ordinal);
            CREATE INDEX idx_verses_book_chapter_verse
                ON verses(book_id, chapter, verse);
            CREATE INDEX idx_verses_book_chapter_ordinal
                ON verses(book_id, chapter, ordinal);
            CREATE INDEX idx_verses_ordinal
                ON verses(ordinal);
            CREATE INDEX idx_verses_reference
                ON verses(reference);
            """
        )

        verse_rows: list[tuple[Any, ...]] = []
        alias_rows: dict[str, str] = {}
        book_rows: list[tuple[Any, ...]] = []

        for book in data["books"]:
            aliases = sorted(book_aliases(book), key=str.lower)
            book_rows.append(
                (
                    book["id"],
                    int(book["order"]),
                    book["name"],
                    book.get("canonical_name", book["name"]),
                    book.get("osis", book["id"]),
                    json.dumps(aliases, ensure_ascii=False),
                )
            )
            for alias in aliases:
                alias_rows.setdefault(norm_alias(alias), book["id"])

            notes_by_ref, heading_by_ref = walk_usj_for_notes_and_headings(book)
            for chapter in book["chapters"]:
                chapter_num = int(chapter["number"])
                for verse in chapter["verses"]:
                    verse_num = int(verse["number"])
                    ref = verse["reference"]
                    verse_rows.append(
                        (
                            verse["id"],
                            int(verse["ordinal"]),
                            book["id"],
                            int(book["order"]),
                            book["name"],
                            chapter_num,
                            verse_num,
                            ref,
                            verse.get("text", ""),
                            "\n".join(notes_by_ref.get(ref, [])),
                            heading_by_ref.get(ref, ""),
                        )
                    )

        con.executemany("INSERT INTO books VALUES (?, ?, ?, ?, ?, ?)", book_rows)
        con.executemany("INSERT INTO aliases VALUES (?, ?)", sorted(alias_rows.items()))
        con.executemany(
            """
            INSERT INTO verses(
                id, ordinal, book_id, book_order, book_name, chapter, verse,
                reference, text, notes, headings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            verse_rows,
        )
        con.execute(
            """
            INSERT INTO verse_fts(rowid, reference, book_name, text, notes, headings)
            SELECT rowid, reference, book_name, text, notes, headings FROM verses
            """
        )
        meta = source_signature()
        meta.update(
            {
                "translation": data.get("translation", {}).get("abbreviation", "BSB"),
                "book_count": str(len(data.get("books", []))),
                "verse_count": str(len(verse_rows)),
                "built_at_unix": str(int(time.time())),
                "build_seconds": f"{time.time() - started:.2f}",
            }
        )
        con.executemany("INSERT INTO meta(key, value) VALUES (?, ?)", sorted(meta.items()))
        con.commit()


def ensure_index() -> None:
    with closing(connect()) as con:
        rebuild = needs_rebuild(con)
    if rebuild:
        build_index(force=True)


def maybe_book_id(con: sqlite3.Connection, book_name: str) -> str | None:
    alias = norm_alias(book_name)
    row = con.execute("SELECT book_id FROM aliases WHERE alias_norm = ?", (alias,)).fetchone()
    return row["book_id"] if row else None


def load_book_id(con: sqlite3.Connection, book_name: str) -> str:
    book_id = maybe_book_id(con, book_name)
    if book_id:
        return book_id
    all_books = con.execute("SELECT name, aliases FROM books ORDER BY order_num").fetchall()
    names = ", ".join(row["name"] for row in all_books)
    raise ValueError(f"Unknown book '{book_name}'. Known canonical books: {names}")


def parse_reference(con: sqlite3.Connection, ref: str) -> dict[str, Any]:
    cleaned = ref.strip().replace("–", "-").replace("—", "-")

    whole_book_id = maybe_book_id(con, cleaned)
    if whole_book_id:
        return {
            "book_id": whole_book_id,
            "chapter": None,
            "start_verse": None,
            "end_chapter": None,
            "end_verse": None,
        }

    chapter_range = re.match(r"^(.+?)\s+(\d+)\s*-\s*(\d+)\s*$", cleaned)
    if chapter_range:
        book_name, start_chapter, end_chapter = chapter_range.groups()
        return {
            "book_id": load_book_id(con, book_name),
            "chapter": int(start_chapter),
            "start_verse": None,
            "end_chapter": int(end_chapter),
            "end_verse": None,
        }

    match = re.match(
        r"^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?)?\s*$",
        cleaned,
    )
    if not match:
        raise ValueError(
            "Reference must look like 'John', 'Genesis 1', 'Genesis 1:1', "
            "'Genesis 1:1-3', 'John 3:16-4:2', or 'John 3-4'."
        )
    book_name, chapter, start_verse, end_chapter, end_verse = match.groups()
    book_id = load_book_id(con, book_name)
    return {
        "book_id": book_id,
        "chapter": int(chapter),
        "start_verse": int(start_verse) if start_verse else None,
        "end_chapter": int(end_chapter) if end_chapter else None,
        "end_verse": int(end_verse) if end_verse else None,
    }


def rows_for_reference(con: sqlite3.Connection, ref: str) -> list[sqlite3.Row]:
    parsed = parse_reference(con, ref)
    book_id = parsed["book_id"]
    chapter = parsed["chapter"]
    start_verse = parsed["start_verse"]
    end_chapter = parsed["end_chapter"]
    end_verse = parsed["end_verse"]

    # Reject invalid endpoints instead of silently returning a truncated passage.
    if chapter is not None:
        final_chapter = end_chapter if end_chapter is not None else chapter
        if final_chapter < chapter:
            raise ValueError(f"Reversed chapter range: {ref}")
        for ch in (chapter, final_chapter):
            if not con.execute("SELECT 1 FROM verses WHERE book_id = ? AND chapter = ? LIMIT 1", (book_id, ch)).fetchone():
                raise ValueError(f"Chapter not found: {ref}")
        if start_verse is not None:
            final_verse = end_verse if end_verse is not None else start_verse
            if (final_chapter, final_verse) < (chapter, start_verse):
                raise ValueError(f"Reversed verse range: {ref}")
            for ch, vs in ((chapter, start_verse), (final_chapter, final_verse)):
                if not con.execute("SELECT 1 FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?", (book_id, ch, vs)).fetchone():
                    raise ValueError(f"Verse not found: {ref}")

    if chapter is None:
        return con.execute(
            """
            SELECT * FROM verses
            WHERE book_id = ?
            ORDER BY ordinal
            """,
            (book_id,),
        ).fetchall()

    if start_verse is None and end_chapter is not None:
        return con.execute(
            """
            SELECT * FROM verses
            WHERE book_id = ? AND chapter BETWEEN ? AND ?
            ORDER BY ordinal
            """,
            (book_id, chapter, end_chapter),
        ).fetchall()

    if start_verse is None:
        return con.execute(
            """
            SELECT * FROM verses
            WHERE book_id = ? AND chapter = ?
            ORDER BY ordinal
            """,
            (book_id, chapter),
        ).fetchall()

    if end_verse is None:
        return con.execute(
            """
            SELECT * FROM verses
            WHERE book_id = ? AND chapter = ? AND verse = ?
            ORDER BY ordinal
            """,
            (book_id, chapter, start_verse),
        ).fetchall()

    if end_chapter is None or end_chapter == chapter:
        return con.execute(
            """
            SELECT * FROM verses
            WHERE book_id = ? AND chapter = ? AND verse BETWEEN ? AND ?
            ORDER BY ordinal
            """,
            (book_id, chapter, start_verse, end_verse),
        ).fetchall()

    start = con.execute(
        "SELECT ordinal FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?",
        (book_id, chapter, start_verse),
    ).fetchone()
    end = con.execute(
        "SELECT ordinal FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?",
        (book_id, end_chapter, end_verse),
    ).fetchone()
    if not start or not end:
        return []
    return con.execute(
        "SELECT * FROM verses WHERE ordinal BETWEEN ? AND ? ORDER BY ordinal",
        (start["ordinal"], end["ordinal"]),
    ).fetchall()


def fts_query(raw: str) -> str:
    # Preserve explicit FTS syntax if the caller supplies quotes/operators.
    if any(ch in raw for ch in '"*^():'):
        return raw
    tokens = re.findall(r"[A-Za-z0-9']+", raw)
    return " ".join(f'"{token}"' if "'" in token else token for token in tokens) if tokens else raw


def search_rows(con: sqlite3.Connection, query: str, limit: int) -> list[sqlite3.Row]:
    q = fts_query(query)
    sql = """
        SELECT v.*, bm25(verse_fts) AS rank
        FROM verse_fts
        JOIN verses v ON v.rowid = verse_fts.rowid
        WHERE verse_fts MATCH ?
        ORDER BY rank
        LIMIT ?
    """
    try:
        return con.execute(sql, (q, limit)).fetchall()
    except sqlite3.OperationalError:
        tokens = re.findall(r"[A-Za-z0-9']+", query)
        safe = " ".join(f'"{token}"' for token in tokens)
        if not safe:
            raise
        return con.execute(sql, (safe, limit)).fetchall()


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "reference": row["reference"],
        "text": row["text"],
        "notes": [note for note in row["notes"].split("\n") if note],
        "headings": row["headings"],
    }


def print_markdown(rows: Iterable[sqlite3.Row], include_notes: bool = True) -> None:
    last_heading = None
    any_rows = False
    for row in rows:
        any_rows = True
        heading = row["headings"]
        if heading and heading != last_heading:
            print(f"\n### {heading}")
            last_heading = heading
        print(f"**{row['reference']}** {row['text']}")
        if include_notes and row["notes"]:
            for note in row["notes"].split("\n"):
                if note:
                    print(f"  - Note: {note}")
    if not any_rows:
        print("No matching BSB verses found.")


def print_compact(rows: Iterable[sqlite3.Row], include_notes: bool = True) -> None:
    """Dense one-line output for low-token agent context."""
    any_rows = False
    for row in rows:
        any_rows = True
        line = f"{row['reference']} {row['text']}"
        if include_notes and row["notes"]:
            notes = "; ".join(note for note in row["notes"].split("\n") if note)
            if notes:
                line += f" [Note: {notes}]"
        print(line)
    if not any_rows:
        print("No matching BSB verses found.")


def print_json(rows: Iterable[sqlite3.Row]) -> None:
    print(json.dumps([row_to_dict(row) for row in rows], ensure_ascii=False, indent=2))


def print_stats(con: sqlite3.Connection) -> None:
    meta = dict(con.execute("SELECT key, value FROM meta ORDER BY key").fetchall())
    verse_count = con.execute("SELECT COUNT(*) AS c FROM verses").fetchone()["c"]
    book_count = con.execute("SELECT COUNT(*) AS c FROM books").fetchone()["c"]
    noted_count = con.execute("SELECT COUNT(*) AS c FROM verses WHERE notes <> ''").fetchone()["c"]
    note_total = con.execute(
        "SELECT COALESCE(SUM(1 + LENGTH(notes) - LENGTH(REPLACE(notes, char(10), ''))), 0) AS c FROM verses WHERE notes <> ''"
    ).fetchone()["c"]
    print("BSB retrieval source is ready.")
    print(f"Source: {SOURCE_PATH}")
    print(f"Index:  {DB_PATH}")
    print(f"Books: {book_count}")
    print(f"Addressable verses: {verse_count}")
    print(f"Verses with notes: {noted_count}")
    print(f"Total parsed notes: {note_total}")
    print(f"Index build seconds: {meta.get('build_seconds', 'unknown')}")


def main(argv: list[str] | None = None) -> int:
    global DB_PATH
    # Keep redirected output portable on Windows as well as UTF-8 terminals.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Retrieve BSB Scripture from the Smart JSON source.")
    parser.add_argument("--db", type=Path, help="Writable SQLite cache path (default: user cache directory).")
    parser.add_argument(
        "--ref",
        action="append",
        help=(
            "Reference, e.g. 'John', 'Genesis 1', 'John 3:16-18', 'John 3:16-4:2'. "
            "May be supplied multiple times for batch retrieval."
        ),
    )
    parser.add_argument("--refs", help="Semicolon- or newline-separated references for batch retrieval.")
    parser.add_argument("--search", help="Keyword/FTS search across verse text, notes, and headings.")
    parser.add_argument("--limit", type=int, default=10, help="Maximum search results (default: 10).")
    parser.add_argument("--format", choices=["markdown", "json", "compact"], default="markdown")
    parser.add_argument("--no-notes", action="store_true", help="Suppress notes in markdown/compact output.")
    parser.add_argument("--stats", action="store_true", help="Show index/source statistics.")
    parser.add_argument("--build-index", action="store_true", help="Build or refresh the SQLite FTS index.")
    parser.add_argument("--rebuild", action="store_true", help="Force rebuild the SQLite FTS index.")
    args = parser.parse_args(argv)
    if args.db:
        DB_PATH = args.db.expanduser().resolve()

    try:
        if args.rebuild:
            build_index(force=True)
        else:
            ensure_index()

        ref_values = list(args.ref or [])
        if args.refs:
            ref_values.extend(part.strip() for part in re.split(r"[;\n]+", args.refs) if part.strip())

        with closing(connect()) as con:
            if args.build_index or args.stats:
                print_stats(con)
                if not ref_values and not args.search:
                    return 0

            rows: list[sqlite3.Row] = []
            for ref in ref_values:
                rows.extend(rows_for_reference(con, ref))
            if args.search:
                rows.extend(search_rows(con, args.search, max(1, args.limit)))

            if not ref_values and not args.search:
                if not args.stats and not args.build_index:
                    parser.print_help()
                return 0

            if args.format == "json":
                print_json(rows)
            elif args.format == "compact":
                print_compact(rows, include_notes=not args.no_notes)
            else:
                print_markdown(rows, include_notes=not args.no_notes)
            return 0
    except Exception as exc:  # Keep CLI failures clear for future agent sessions.
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
