#!/usr/bin/env python3
"""Check a draft journal-entry CSV and write a clean QuickBooks Online import file.

What it checks, for every journal entry (rows that share a Journal No):
  * the required columns exist: Journal No, Journal Date, Account, Debits, Credits
  * every date is a real date, and all lines of one entry share the same date
  * every line has an account and exactly one positive amount (a debit or a credit)
  * amounts are plain numbers with at most two decimal places
  * debits equal credits, to the cent
  * no review markers are left (any cell containing FLAG)
  * the Journal No is 21 characters or fewer
  * optionally, that every account (and class) appears in a list exported from
    QuickBooks Online, which catches the "Line Account invalid" import error early

If everything passes, it writes a clean CSV with the columns QuickBooks Online's
journal-entry import maps to (Journal No., Journal Date, Account Name, Debits,
Credits, Description, plus Name, Class and Location when used), and a summary
text file beside it. If anything fails, it writes nothing and lists the problems.
Beyond these checks it cannot know whether an account exists in QuickBooks unless
you pass --accounts, and it never judges whether an entry is the right one; the
reviewer does.

Lines that start with "#" are treated as comments and skipped, so a draft can
carry a note such as "# Fictional sample data".

This script only reads and writes local files. It makes no network calls and
cannot post anything to QuickBooks. A person imports the file after review.

Example:
  python3 scripts/je_check.py assets/demo-draft-journal-entries.csv \
      --out demo-output/2026-03-demo-JEs-Claude-FINAL-Upload.csv --period 2026-03
"""
import argparse
import csv
import datetime as dt
import io
import re
import sys
from collections import OrderedDict
from decimal import Decimal, InvalidOperation
from pathlib import Path

# Accepted spellings for each input column (compared lowercase, ignoring spaces,
# dots, underscores and slashes).
ALIASES = OrderedDict([
    ("journal_no", ["journalno", "journalnumber", "journal", "jeno", "entryno", "no"]),
    ("date", ["journaldate", "date", "entrydate"]),
    ("account", ["account", "accountname", "accountfullname", "fullname"]),
    ("debit", ["debits", "debit", "dr"]),
    ("credit", ["credits", "credit", "cr"]),
    ("description", ["description", "journaldescription", "memo", "linedescription"]),
    ("name", ["name", "payee", "customervendor", "vendor", "donor"]),
    ("class", ["class"]),
    ("location", ["location", "department"]),
])
REQUIRED = ["journal_no", "date", "account", "debit", "credit"]
OUTPUT_HEADERS = OrderedDict([
    ("journal_no", "Journal No."), ("date", "Journal Date"), ("account", "Account Name"),
    ("debit", "Debits"), ("credit", "Credits"), ("description", "Description"),
    ("name", "Name"), ("class", "Class"), ("location", "Location"),
])
ALWAYS_WRITE = ["journal_no", "date", "account", "debit", "credit", "description"]
DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%m-%d-%Y"]
MAX_JOURNAL_NO = 21


def norm(header):
    return "".join(ch for ch in header.lower() if ch not in " ._/-")


def map_columns(headers):
    found = {}
    for key, names in ALIASES.items():
        for i, h in enumerate(headers):
            if norm(h) in names and key not in found:
                found[key] = i
    return found


def parse_amount(text):
    raw = text.strip().replace(",", "").replace("$", "")
    if raw == "":
        return Decimal("0")
    if raw.startswith("(") and raw.endswith(")"):
        raise ValueError("a negative amount in parentheses; enter it as a positive amount in the other column")
    value = Decimal(raw)
    if value < 0:
        raise ValueError("a negative amount; enter it as a positive amount in the other column")
    if value != value.quantize(Decimal("0.01")):
        raise ValueError("more than two decimal places")
    return value.quantize(Decimal("0.01"))


def parse_date(text):
    for fmt in DATE_FORMATS:
        try:
            return dt.datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            pass
    raise ValueError("not a real date in YYYY-MM-DD or MM/DD/YYYY form")


def load_names(path):
    """Read an account or class list exported from QuickBooks Online.

    Accepts a CSV with a column named Account, Full name, Name or Class, or a
    plain file with one name per line.
    """
    text = Path(path).read_text(encoding="utf-8-sig")
    rows = [r for r in csv.reader(io.StringIO(text)) if r and not r[0].startswith("#")]
    if not rows:
        return set()
    header = [norm(h) for h in rows[0]]
    for wanted in ("account", "accountname", "fullname", "name", "class"):
        if wanted in header:
            col = header.index(wanted)
            return {r[col].strip() for r in rows[1:] if len(r) > col and r[col].strip()}
    return {r[0].strip() for r in rows if r[0].strip()}


def check(draft_path, period=None, accounts=None, classes=None):
    text = Path(draft_path).read_text(encoding="utf-8-sig")
    lines = [ln for ln in text.splitlines() if not ln.lstrip().startswith("#")]
    reader = list(csv.reader(io.StringIO("\n".join(lines))))
    reader = [r for r in reader if any(c.strip() for c in r)]
    if not reader:
        raise SystemExit("Cannot check: the file has no header row or data.")
    headers, rows = reader[0], reader[1:]
    cols = map_columns(headers)
    missing = [OUTPUT_HEADERS[k] for k in REQUIRED if k not in cols]
    if missing:
        raise SystemExit("Cannot check: missing required column(s): " + ", ".join(missing)
                         + ". Found: " + ", ".join(headers))
    errors, warnings, entries = [], [], OrderedDict()
    for n, row in enumerate(rows, start=2):
        cell = lambda k: (row[cols[k]].strip() if k in cols and cols[k] < len(row) else "")
        rec = {k: cell(k) for k in OUTPUT_HEADERS}
        where = f"Row {n}"
        for k, v in rec.items():
            if re.search(r"\bFLAG\b", v):
                errors.append(f"{where}: {OUTPUT_HEADERS[k]} still says '{v}'. Resolve the flag first.")
        if not rec["journal_no"]:
            errors.append(f"{where}: Journal No is empty.")
            continue
        if len(rec["journal_no"]) > MAX_JOURNAL_NO:
            errors.append(f"{where}: Journal No '{rec['journal_no']}' is longer than {MAX_JOURNAL_NO} characters.")
        if not rec["account"]:
            errors.append(f"{where}: Account is empty.")
        elif accounts is not None and rec["account"] not in accounts:
            errors.append(f"{where}: Account '{rec['account']}' is not in the QuickBooks account list.")
        if classes is not None and rec["class"] and rec["class"] not in classes:
            errors.append(f"{where}: Class '{rec['class']}' is not in the QuickBooks class list.")
        try:
            rec["date_value"] = parse_date(rec["date"])
        except ValueError as exc:
            errors.append(f"{where}: Journal Date '{rec['date']}' is {exc}.")
            rec["date_value"] = None
        amounts, bad_amount = {}, False
        for side in ("debit", "credit"):
            try:
                amounts[side] = parse_amount(rec[side])
            except (ValueError, InvalidOperation) as exc:
                msg = exc if isinstance(exc, ValueError) else "not a number"
                errors.append(f"{where}: {OUTPUT_HEADERS[side]} '{rec[side]}' is {msg}.")
                amounts[side] = Decimal("0")
                bad_amount = True
        if amounts["debit"] > 0 and amounts["credit"] > 0:
            errors.append(f"{where}: has both a debit and a credit. Use one line for each.")
        if amounts["debit"] == 0 and amounts["credit"] == 0 and not bad_amount:
            errors.append(f"{where}: has no amount. Remove the line or enter a debit or credit.")
        rec.update(amounts)
        if not rec["description"]:
            warnings.append(f"{where}: no description. A short memo naming the source statement helps the reviewer.")
        entries.setdefault(rec["journal_no"], []).append(rec)

    for jno, recs in entries.items():
        dates = {r["date_value"] for r in recs if r["date_value"]}
        if len(dates) > 1:
            errors.append(f"Entry '{jno}': lines have different dates ({', '.join(sorted(str(d) for d in dates))}). "
                          "One journal entry needs one date.")
        if len(recs) < 2:
            errors.append(f"Entry '{jno}': has only one line. A journal entry needs at least one debit and one credit.")
        dr = sum(r["debit"] for r in recs)
        cr = sum(r["credit"] for r in recs)
        if dr != cr:
            errors.append(f"Entry '{jno}': does not balance. Debits {dr:,.2f}, credits {cr:,.2f}, "
                          f"difference {abs(dr - cr):,.2f}.")
        if period and dates:
            for d in dates:
                if d.strftime("%Y-%m") != period:
                    warnings.append(f"Entry '{jno}': dated {d}, outside the closing month {period}.")
    return headers, entries, errors, warnings


def summary_text(draft, out, entries, warnings, date_style):
    date_label = "MM/DD/YYYY (US company settings)" if date_style == "mdy" else "YYYY-MM-DD"
    lines = ["Journal-entry check summary", "=" * 27, f"Source draft: {Path(draft).name}",
             f"Clean upload file: {Path(out).name}", f"Dates written as: {date_label}",
             f"Entries: {len(entries)}   Lines: {sum(len(v) for v in entries.values())}", "",
             "Entry totals (debits = credits):"]
    grand = Decimal("0")
    for jno, recs in entries.items():
        total = sum(r["debit"] for r in recs)
        grand += total
        lines.append(f"  {jno:<22} {recs[0]['date_value']}  {total:>14,.2f}  ({len(recs)} lines)")
    lines.append(f"  {'All entries':<22} {'':10}  {grand:>14,.2f}")
    lines += ["", "Net change by account (debits minus credits):"]
    net = OrderedDict()
    for recs in entries.values():
        for r in recs:
            net[r["account"]] = net.get(r["account"], Decimal("0")) + r["debit"] - r["credit"]
    for acct, value in net.items():
        lines.append(f"  {acct:<60} {value:>14,.2f}")
    lines += ["", "Warnings:"] + ([f"  - {w}" for w in warnings] or ["  none"])
    lines += ["", "Nothing was posted. Import this file into QuickBooks Online only after the",
              "reviewer named in your close guide has approved it."]
    return "\n".join(lines) + "\n"


def main():
    p = argparse.ArgumentParser(
        description="Check a draft journal-entry CSV (balanced entries, valid dates, required "
                    "columns, no FLAG markers) and write a clean QuickBooks Online import CSV "
                    "plus a summary. Local files only; nothing is posted.")
    p.add_argument("draft", help="draft journal-entry CSV to check")
    p.add_argument("--out", required=True, help="path for the clean upload CSV (a summary .txt is written beside it)")
    p.add_argument("--period", help="closing month as YYYY-MM; warns about entries dated outside it")
    p.add_argument("--accounts", help="account list exported from QuickBooks Online (CSV or one name per line)")
    p.add_argument("--classes", help="class list exported from QuickBooks Online (CSV or one name per line)")
    p.add_argument("--date-style", choices=["mdy", "iso"], default="mdy",
                   help="date format to write: mdy = MM/DD/YYYY (default, US company settings), iso = YYYY-MM-DD")
    p.add_argument("--overwrite", action="store_true", help="replace existing output files")
    args = p.parse_args()

    if args.period:
        try:
            dt.datetime.strptime(args.period, "%Y-%m")
        except ValueError:
            p.exit(2, "Cannot check: --period must look like 2026-03.\n")
    out = Path(args.out)
    summary_path = out.with_name(out.stem + "-summary.txt")
    if not args.overwrite and (out.exists() or summary_path.exists()):
        p.exit(2, f"Cannot write: {out.name} or its summary already exists. Choose a new name or add --overwrite.\n")
    try:
        accounts = load_names(args.accounts) if args.accounts else None
        classes = load_names(args.classes) if args.classes else None
        _, entries, errors, warnings = check(args.draft, args.period, accounts, classes)
    except OSError as exc:
        p.exit(2, f"Cannot read a file: {exc}\n")

    if errors:
        print(f"NOT READY: {len(errors)} problem(s) found. No upload file was written.\n")
        for e in errors:
            print(f"  - {e}")
        if warnings:
            print("\nAlso worth a look:")
            for w in warnings:
                print(f"  - {w}")
        sys.exit(1)

    fmt = "%m/%d/%Y" if args.date_style == "mdy" else "%Y-%m-%d"
    used = [k for k in OUTPUT_HEADERS if k in ALWAYS_WRITE or any(r[k] for v in entries.values() for r in v)]
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow([OUTPUT_HEADERS[k] for k in used])
        for recs in entries.values():
            for r in recs:
                row = []
                for k in used:
                    if k == "date":
                        row.append(r["date_value"].strftime(fmt))
                    elif k in ("debit", "credit"):
                        row.append(f"{r[k]:.2f}" if r[k] > 0 else "")
                    else:
                        row.append(r[k])
                w.writerow(row)
    text = summary_text(args.draft, out, entries, warnings, args.date_style)
    summary_path.write_text(text, encoding="utf-8")
    print("READY FOR REVIEW: every entry balances and every line passed the checks.\n")
    print(text)
    print(f"Wrote {out}\nWrote {summary_path}")


if __name__ == "__main__":
    main()
