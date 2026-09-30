#!/usr/bin/env python3
"""Split a small text library into cited passages and search it by keyword.

A teaching tool for the searchable-library skill. It shows the first parts of a
local search index: passages tied to their source (title, date, speaker,
paragraph numbers, Bible references), keyword search (BM25 ranking), and rank
fusion, which merges the keyword ranking with a meaning-search ranking produced
elsewhere (for example by a local embedding model).

It uses only the Python standard library, reads local files only, and makes no
network calls. It does not create embeddings and does not call any AI service.

Commands:
  chunk   FOLDER --out passages.jsonl     split .md and .txt files into passages
  search  passages.jsonl "question"       keyword search with cited excerpts
          [--passage "Luke 10"]           only passages that cite this reference
          [--meaning-ranks ranks.json]    fuse with a meaning-search ranking
          [--top 5] [--json]

Run "python3 library.py chunk --help" or "python3 library.py search --help".
"""
import argparse
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

BOOKS = {
    "Genesis": ["Gen"], "Exodus": ["Exod", "Ex"], "Leviticus": ["Lev"],
    "Numbers": ["Num"], "Deuteronomy": ["Deut", "Dt"], "Joshua": ["Josh"],
    "Judges": ["Judg"], "Ruth": [], "1 Samuel": ["1 Sam"], "2 Samuel": ["2 Sam"],
    "1 Kings": ["1 Kgs"], "2 Kings": ["2 Kgs"], "1 Chronicles": ["1 Chr"],
    "2 Chronicles": ["2 Chr"], "Ezra": [], "Nehemiah": ["Neh"], "Esther": ["Esth"],
    "Job": [], "Psalm": ["Psalms", "Ps", "Pss"], "Proverbs": ["Prov"],
    "Ecclesiastes": ["Eccl"], "Song of Songs": ["Song of Solomon"],
    "Isaiah": ["Isa"], "Jeremiah": ["Jer"], "Lamentations": ["Lam"],
    "Ezekiel": ["Ezek"], "Daniel": ["Dan"], "Hosea": ["Hos"], "Joel": [],
    "Amos": [], "Obadiah": ["Obad"], "Jonah": [], "Micah": ["Mic"],
    "Nahum": ["Nah"], "Habakkuk": ["Hab"], "Zephaniah": ["Zeph"],
    "Haggai": ["Hag"], "Zechariah": ["Zech"], "Malachi": ["Mal"],
    "Matthew": ["Matt", "Mt"], "Mark": ["Mk"], "Luke": ["Lk"], "John": ["Jn"],
    "Acts": [], "Romans": ["Rom"], "1 Corinthians": ["1 Cor"],
    "2 Corinthians": ["2 Cor"], "Galatians": ["Gal"], "Ephesians": ["Eph"],
    "Philippians": ["Phil"], "Colossians": ["Col"],
    "1 Thessalonians": ["1 Thess"], "2 Thessalonians": ["2 Thess"],
    "1 Timothy": ["1 Tim"], "2 Timothy": ["2 Tim"], "Titus": [],
    "Philemon": ["Phlm"], "Hebrews": ["Heb"], "James": ["Jas"],
    "1 Peter": ["1 Pet"], "2 Peter": ["2 Pet"], "1 John": ["1 Jn"],
    "2 John": ["2 Jn"], "3 John": ["3 Jn"], "Jude": [], "Revelation": ["Rev"],
}
ORDINALS = {"First": "1", "Second": "2", "Third": "3"}
NAME_TO_BOOK = {}
for _book, _abbrs in BOOKS.items():
    for _name in [_book] + _abbrs:
        NAME_TO_BOOK[_name] = _book
        if _name[0] in "123":
            for _word, _num in ORDINALS.items():
                if _name[0] == _num:
                    NAME_TO_BOOK[_word + _name[1:]] = _book
# Longest names first so "1 John" wins over "John" and "Song of Songs" over "Song".
_NAMES = sorted(NAME_TO_BOOK, key=len, reverse=True)
REF_RE = re.compile(
    r"(?<![A-Za-z0-9])(" + "|".join(re.escape(n) for n in _NAMES) + r")\.?\s+"
    r"(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?(?![0-9])"
)
STOPWORDS = set("""a an and are as at be but by for from has have he her his i if in
into is it its me my no not of on or our she so that the their them then there
these they this to us was we were what when where which who why will with you
your do does did can could should would about all any been how just than too
very one out up said say says talk talked taught teach tell told""".split())
META_RE = re.compile(r"^[-*]\s*([A-Za-z ]+):\s*(.+)$")


def find_refs(text):
    """Return normalized Bible references found in text, in order, without duplicates."""
    refs = []
    for m in REF_RE.finditer(text):
        book, chapter, v1, v2 = NAME_TO_BOOK[m.group(1)], m.group(2), m.group(3), m.group(4)
        ref = f"{book} {chapter}" + (f":{v1}" if v1 else "") + (f"-{v2}" if v2 else "")
        if ref not in refs:
            refs.append(ref)
    return refs


def tokens(text):
    words = re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text.lower())
    out = []
    for w in words:
        w = w.replace("'s", "")
        if w in STOPWORDS:
            continue
        if len(w) > 4 and w.endswith("ies"):
            w = w[:-3] + "y"
        elif len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
            w = w[:-1]
        out.append(w)
    return out


def parse_document(path):
    """Read one file: title from '# ', metadata from '- Key: value' lines, then paragraphs."""
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"{path.name} is not UTF-8 text; save it as plain text (UTF-8) and try again") from exc
    meta = {"title": path.stem, "file": path.name}
    paragraphs = []
    for block in re.split(r"\n\s*\n", text):
        block = block.strip()
        if not block:
            continue
        lines = block.splitlines()
        if lines[0].startswith("# "):
            meta["title"] = lines[0][2:].strip()
            continue
        if all(META_RE.match(line.strip()) for line in lines):
            for line in lines:
                key, value = META_RE.match(line.strip()).groups()
                meta[key.strip().lower()] = value.strip()
            continue
        if block.lower().startswith("fictional sample data"):
            meta["label"] = "Fictional sample data"
            continue
        paragraphs.append(" ".join(line.strip() for line in lines))
    return meta, paragraphs


def chunk_folder(folder, max_words):
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in (".md", ".txt"))
    if not files:
        raise ValueError(f"No .md or .txt files found in {folder}")
    passages = []
    for path in files:
        meta, paragraphs = parse_document(path)
        if not paragraphs:
            print(f"Warning: no body text found in {path.name}; skipped", file=sys.stderr)
            continue
        doc_refs = find_refs(meta.get("passage", ""))
        start, buf = 1, []
        for i, para in enumerate(paragraphs, 1):
            buf.append(para)
            words = sum(len(p.split()) for p in buf)
            if words >= max_words or i == len(paragraphs):
                body = "\n\n".join(buf)
                passages.append({
                    "id": f"{path.stem}:p{start}-{i}",
                    "file": path.name,
                    "title": meta["title"],
                    "date": meta.get("date"),
                    "speaker": meta.get("speaker"),
                    "sermon_passage": meta.get("passage"),
                    "paragraphs": f"{start}-{i}",
                    "refs": doc_refs + [r for r in find_refs(body) if r not in doc_refs],
                    "label": meta.get("label"),
                    "text": body,
                })
                start, buf = i + 1, []
    if not passages:
        raise ValueError(f"No body text found in any file in {folder}; each file needs at least one paragraph after its heading")
    return passages


def load_passages(path):
    passages = []
    with path.open(encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                p = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path.name} line {n} is not valid JSON: {exc}") from exc
            for key in ("id", "text", "title"):
                if key not in p:
                    raise ValueError(f"{path.name} line {n} is missing '{key}'; re-run the chunk command")
            passages.append(p)
    if not passages:
        raise ValueError(f"{path.name} has no passages; re-run the chunk command")
    return passages


def bm25(passages, query, k1=1.5, b=0.75):
    """Rank passages by the BM25 keyword score. Returns [(id, score)] with score > 0."""
    docs = [tokens(p["title"] + " " + p["text"]) for p in passages]
    avg = sum(len(d) for d in docs) / len(docs)
    df = Counter(t for d in docs for t in set(d))
    n = len(docs)
    scored = []
    for p, d in zip(passages, docs):
        tf = Counter(d)
        score = 0.0
        for t in set(tokens(query)):
            if t not in tf:
                continue
            idf = math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5))
            score += idf * tf[t] * (k1 + 1) / (tf[t] + k1 * (1 - b + b * len(d) / avg))
        if score > 0:
            scored.append((p["id"], score))
    return sorted(scored, key=lambda x: -x[1])


def cites(passage, wanted):
    """True if any reference in the passage falls inside the wanted book and chapter (and verse)."""
    target = find_refs(wanted)
    if not target:
        raise ValueError(f"Could not read a Bible reference in --passage '{wanted}' (try 'Luke 10' or 'Romans 12:13')")
    t = re.match(r"(.+) (\d+)(?::(\d+))?", target[0])
    t_book, t_ch, t_v = t.group(1), t.group(2), t.group(3)
    for ref in passage.get("refs", []):
        m = re.match(r"(.+) (\d+)(?::(\d+)(?:-(\d+))?)?", ref)
        if not m or m.group(1) != t_book or m.group(2) != t_ch:
            continue
        if t_v is None or m.group(3) is None:
            return True
        lo, hi = int(m.group(3)), int(m.group(4) or m.group(3))
        if lo <= int(t_v) <= hi:
            return True
    return False


def load_meaning_ranks(path, known_ids):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path.name} is not valid JSON: {exc}") from exc
    ranked = data.get("ranked_ids") if isinstance(data, dict) else data
    if not isinstance(ranked, list) or not all(isinstance(x, str) for x in ranked):
        raise ValueError(f"{path.name} must be a JSON list of passage ids, or an object with 'ranked_ids'")
    unknown = [x for x in ranked if x not in known_ids]
    if unknown:
        raise ValueError(f"{path.name} lists ids not in the passages file: {', '.join(unknown[:3])}")
    return ranked


def fuse(rank_lists, k=60):
    """Reciprocal rank fusion: each list adds 1 / (k + rank) for every passage it ranks."""
    scores = Counter()
    for ranked in rank_lists:
        for rank, pid in enumerate(ranked, 1):
            scores[pid] += 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: -x[1])


def excerpt(text, query, width=260):
    words = set(tokens(query))
    flat = text.replace("\n\n", " ")
    start = 0
    for m in re.finditer(r"[A-Za-z']+", flat):
        if tokens(m.group(0)) and tokens(m.group(0))[0] in words:
            start = max(0, m.start() - 60)
            break
    piece = flat[start:start + width].strip()
    return ("..." if start else "") + piece + ("..." if start + width < len(flat) else "")


def cmd_chunk(args):
    folder = Path(args.folder)
    if not folder.is_dir():
        raise ValueError(f"Folder not found: {folder}")
    out = Path(args.out)
    if out.exists():
        raise ValueError(f"{out} already exists; choose a new file name so nothing is overwritten")
    passages = chunk_folder(folder, args.max_words)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("x", encoding="utf-8") as f:
        for p in passages:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")
    docs = len({p["file"] for p in passages})
    print(f"Wrote {len(passages)} passages from {docs} files to {out}")
    print("Each passage keeps its source file, title, date, speaker, paragraph numbers and Bible references.")


def cmd_search(args):
    passages = load_passages(Path(args.passages))
    by_id = {p["id"]: p for p in passages}
    pool = passages
    if args.passage:
        pool = [p for p in passages if cites(p, args.passage)]
        if not pool:
            print(f"No passages cite {args.passage}.")
            return
    pool_ids = {p["id"] for p in pool}
    keyword = [pid for pid, _ in bm25(pool, args.query)]
    lists = [keyword]
    meaning = []
    if args.meaning_ranks:
        meaning = [pid for pid in load_meaning_ranks(Path(args.meaning_ranks), set(by_id)) if pid in pool_ids]
        lists.append(meaning)
    results = fuse(lists)[: args.top]
    rows = []
    for rank, (pid, score) in enumerate(results, 1):
        p = by_id[pid]
        found_by = [name for name, lst in (("keyword", keyword), ("meaning", meaning)) if pid in lst]
        rows.append({
            "rank": rank, "id": pid, "fused_score": round(score, 5), "found_by": found_by,
            "title": p["title"], "date": p.get("date"), "speaker": p.get("speaker"),
            "paragraphs": p.get("paragraphs"), "refs": p.get("refs", []),
            "excerpt": excerpt(p["text"], args.query),
        })
    if args.json:
        print(json.dumps({"query": args.query, "results": rows}, ensure_ascii=False, indent=2))
        return
    mode = "keyword + meaning (rank fusion)" if args.meaning_ranks else "keyword only"
    print(f'Query: "{args.query}"   Mode: {mode}' + (f"   Filter: {args.passage}" if args.passage else ""))
    if not rows:
        print("No keyword matches. The words may differ from the question; a meaning search can help here.")
        return
    for r in rows:
        print(f"\n{r['rank']}. {r['title']} ({r['date']}, {r['speaker']}), paragraphs {r['paragraphs']}")
        print(f"   Found by: {', '.join(r['found_by'])}   Refs: {'; '.join(r['refs']) or 'none'}")
        print(f"   {r['excerpt']}")
    print("\nCite the title, date, speaker and paragraphs when answering. Answer only from these excerpts.")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command")
    c = sub.add_parser("chunk", help="split .md and .txt files into cited passages")
    c.add_argument("folder", help="folder of .md or .txt files (for example transcripts)")
    c.add_argument("--out", required=True, help="new .jsonl file to write (must not exist yet)")
    c.add_argument("--max-words", type=int, default=120, help="about how many words per passage (default 120)")
    s = sub.add_parser("search", help="keyword search, optionally fused with a meaning-search ranking")
    s.add_argument("passages", help="the .jsonl file made by the chunk command")
    s.add_argument("query", help="the question or words to search for")
    s.add_argument("--top", type=int, default=5, help="how many results to show (default 5)")
    s.add_argument("--passage", help="only passages citing this Bible reference, for example 'Luke 10'")
    s.add_argument("--meaning-ranks", help="JSON file of passage ids in meaning-search order, to fuse with keyword results")
    s.add_argument("--json", action="store_true", help="print results as JSON (for a connector or another tool)")
    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        return 2
    try:
        if args.command == "chunk":
            if args.max_words < 20:
                raise ValueError("--max-words should be at least 20")
            cmd_chunk(args)
        else:
            if args.top < 1:
                raise ValueError("--top must be 1 or more")
            if not args.query.strip():
                raise ValueError("The question is empty; put the words to search for in quotes")
            cmd_search(args)
    except (ValueError, OSError, UnicodeDecodeError) as exc:
        print(f"library.py: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
