#!/usr/bin/env python3
"""Compare actuals with budget and write a CSV table plus a standalone HTML report.

Inputs (CSV, one row per board-level line):
  budget  : Category, Type, Amount     Type is "income" or "expense"
  actuals : Category, Amount           (a Type column is optional; it is needed
                                        only for lines that are not in the budget)
  Accepted header spellings: Category/Line/Account/Name, Amount/Budget/Actual/Total,
  Type/Kind/Section. Amounts may include $ and commas; (100) means -100.
  Lines starting with "#" are comments. A comment containing "fictional" puts a
  "Fictional sample data" banner on the report.

Optional explanations CSV: Category, Explanation, Confirmed by. Use it to carry the
treasurer's confirmed variance explanations into the table and report.

For every line it computes variance (actual minus budget), variance percent of budget,
whether the variance is favorable (more income, or less expense, than budget), and
flags it when the variance is at least --min-amount and at least --pct percent of
budget (or any unbudgeted amount of at least --min-amount). It adds totals for
income, expenses and the net result.

Outputs, in the --out folder:
  budget-vs-actual.csv   the full table, with totals
  budget-vs-actual.html  one self-contained page with inline SVG bar charts;
                         no scripts, fonts or links to other sites

Local files only; no network calls. The report is a draft for the treasurer.

Example:
  python3 scripts/bva.py --actuals assets/demo-actuals.csv --budget assets/demo-budget.csv \
      --explanations assets/demo-variance-notes.csv --pct 5 --min-amount 500 \
      --title "Cedar Hill Community Church" --period "First quarter 2026" --out demo-output
"""
import argparse
import csv
import html
import io
import sys
from collections import OrderedDict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

CAT = ["category", "line", "account", "name", "lineitem"]
AMT = ["amount", "budget", "actual", "actuals", "total"]
TYP = ["type", "kind", "section"]
INCOME = {"income", "revenue", "support", "giving"}
EXPENSE = {"expense", "expenses", "cost", "spending"}


def norm(text):
    return "".join(ch for ch in text.strip().lower() if ch.isalnum())


def money(text, where):
    raw = text.strip().replace(",", "").replace("$", "")
    neg = raw.startswith("(") and raw.endswith(")")
    raw = raw.strip("()")
    if raw == "":
        raise ValueError(f"{where}: amount is empty")
    try:
        value = Decimal(raw)
    except InvalidOperation:
        raise ValueError(f"{where}: amount '{text}' is not a number")
    return -value if neg else value


def read_table(path, need_type):
    text = Path(path).read_text(encoding="utf-8-sig")
    fictional = any("fictional" in ln.lower() for ln in text.splitlines() if ln.lstrip().startswith("#"))
    body = "\n".join(ln for ln in text.splitlines() if not ln.lstrip().startswith("#"))
    rows = [r for r in csv.reader(io.StringIO(body)) if any(c.strip() for c in r)]
    if not rows:
        raise ValueError(f"{Path(path).name}: no header row or data")
    head = [norm(h) for h in rows[0]]
    pick = lambda names: next((i for i, h in enumerate(head) if h in names), None)
    ci, ai, ti = pick(CAT), pick(AMT), pick(TYP)
    missing = [n for n, i in (("Category", ci), ("Amount", ai)) if i is None]
    if need_type and ti is None:
        missing.append("Type")
    if missing:
        raise ValueError(f"{Path(path).name}: missing column(s) {', '.join(missing)}; found {', '.join(rows[0])}")
    data, warnings = OrderedDict(), []
    for n, r in enumerate(rows[1:], start=2):
        where = f"{Path(path).name} row {n}"
        cat = r[ci].strip() if ci < len(r) else ""
        if not cat:
            raise ValueError(f"{where}: category is empty")
        amount = money(r[ai] if ai < len(r) else "", where)
        kind = None
        if ti is not None and ti < len(r) and r[ti].strip():
            t = norm(r[ti])
            if t in INCOME:
                kind = "income"
            elif t in EXPENSE:
                kind = "expense"
            else:
                raise ValueError(f"{where}: Type '{r[ti]}' must be income or expense")
        elif need_type:
            raise ValueError(f"{where}: Type is empty; use income or expense")
        key = norm(cat)
        if key in data:
            warnings.append(f"'{cat}' appears more than once in {Path(path).name}; amounts were added together")
            data[key]["amount"] += amount
            data[key]["type"] = data[key]["type"] or kind
        else:
            data[key] = {"category": cat, "amount": amount, "type": kind}
    return data, warnings, fictional


def read_notes(path):
    text = Path(path).read_text(encoding="utf-8-sig")
    body = "\n".join(ln for ln in text.splitlines() if not ln.lstrip().startswith("#"))
    notes, names = {}, {}
    for r in csv.DictReader(io.StringIO(body)):
        r = {norm(k or ""): (v or "").strip() for k, v in r.items()}
        cat = r.get("category") or r.get("line") or ""
        if cat:
            notes[norm(cat)] = (r.get("explanation", ""), r.get("confirmedby", ""))
            names[norm(cat)] = cat
    return notes, names


def pct(var, base):
    if base == 0:
        return None
    return (var / abs(base) * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def build(budget, actuals, notes, pct_limit, min_amount):
    lines = []
    keys = list(budget.keys()) + [k for k in actuals if k not in budget]
    for k in keys:
        b, a = budget.get(k), actuals.get(k)
        kind = (b or {}).get("type") or (a or {}).get("type")
        if kind is None:
            raise ValueError(f"'{a['category']}' is in actuals but not in the budget and has no Type; "
                             "add a Type column (income or expense) to the actuals file")
        bud = b["amount"] if b else Decimal("0")
        act = a["amount"] if a else Decimal("0")
        var = act - bud
        p = pct(var, bud)
        fav = var >= 0 if kind == "income" else var <= 0
        big = abs(var) >= min_amount
        flagged = var != 0 and big and (p is None or abs(p) >= pct_limit)
        exp, who = notes.get(k, ("", ""))
        lines.append({"category": (b or a)["category"], "type": kind, "budget": bud, "actual": act,
                      "variance": var, "pct": p, "favorable": fav, "flagged": flagged,
                      "unbudgeted": b is None, "missing_actual": a is None,
                      "explanation": exp, "confirmed": who})
    totals = []
    for kind, label in (("income", "Total income"), ("expense", "Total expenses")):
        bud = sum((l["budget"] for l in lines if l["type"] == kind), Decimal("0"))
        act = sum((l["actual"] for l in lines if l["type"] == kind), Decimal("0"))
        var = act - bud
        totals.append({"category": label, "type": kind, "budget": bud, "actual": act, "variance": var,
                       "pct": pct(var, bud), "favorable": var >= 0 if kind == "income" else var <= 0})
    inc, exp_ = totals
    net_b, net_a = inc["budget"] - exp_["budget"], inc["actual"] - exp_["actual"]
    totals.append({"category": "Net result (income minus expenses)", "type": "net", "budget": net_b,
                   "actual": net_a, "variance": net_a - net_b, "pct": pct(net_a - net_b, net_b),
                   "favorable": net_a - net_b >= 0})
    return lines, totals


def fmt(d, places=2):
    q = Decimal(1) if places == 0 else Decimal("0.01")
    v = d.quantize(q, rounding=ROUND_HALF_UP)
    s = f"{abs(v):,.{places}f}"
    return f"({s})" if v < 0 else s


def pct_text(p):
    return "n/a" if p is None else f"{p}%"


def write_csv(path, lines, totals):
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["Category", "Type", "Budget", "Actual", "Variance", "Variance %", "Favorable",
                    "Flagged", "Explanation", "Confirmed by"])
        fav = lambda l: "on budget" if l["variance"] == 0 else ("yes" if l["favorable"] else "no")
        for l in lines:
            w.writerow([l["category"], l["type"], f"{l['budget']:.2f}", f"{l['actual']:.2f}",
                        f"{l['variance']:.2f}", pct_text(l["pct"]), fav(l),
                        "yes" if l["flagged"] else "", l["explanation"], l["confirmed"]])
        for t in totals:
            w.writerow([t["category"], t["type"], f"{t['budget']:.2f}", f"{t['actual']:.2f}",
                        f"{t['variance']:.2f}", pct_text(t["pct"]), fav(t), "", "", ""])


def bar_chart(title, items):
    """Horizontal paired bars: budget (outlined) and actual (filled) for each item."""
    esc = html.escape
    width, label_w, row_h, top = 680, 210, 44, 34
    plot_w = width - label_w - 90
    peak = max([abs(i["budget"]) for i in items] + [abs(i["actual"]) for i in items] + [Decimal("1")])
    height = top + row_h * len(items) + 10
    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{esc(title)}" class="chart">',
             f'<title>{esc(title)}</title>',
             f'<rect x="{label_w}" y="8" width="12" height="10" class="bud"/>'
             f'<text x="{label_w + 18}" y="17" class="small">Budget</text>'
             f'<rect x="{label_w + 90}" y="8" width="12" height="10" class="act"/>'
             f'<text x="{label_w + 108}" y="17" class="small">Actual</text>']
    for n, i in enumerate(items):
        y = top + n * row_h
        bw = float(max(i["budget"], 0) / peak) * plot_w
        aw = float(max(i["actual"], 0) / peak) * plot_w
        mark = " (flagged)" if i.get("flagged") else ""
        parts.append(f'<text x="{label_w - 8}" y="{y + 17}" text-anchor="end" class="lbl">{esc(i["category"][:30])}{mark}</text>')
        parts.append(f'<rect x="{label_w}" y="{y + 2}" width="{bw:.1f}" height="14" class="bud"/>')
        parts.append(f'<text x="{label_w + bw + 6:.1f}" y="{y + 13}" class="small">{fmt(i["budget"], 0)}</text>')
        parts.append(f'<rect x="{label_w}" y="{y + 19}" width="{aw:.1f}" height="14" class="act"/>')
        parts.append(f'<text x="{label_w + aw + 6:.1f}" y="{y + 30}" class="small">{fmt(i["actual"], 0)}</text>')
    parts.append("</svg>")
    return "".join(parts)


def write_html(path, lines, totals, title, period, fictional, pct_limit, min_amount):
    esc = html.escape
    banner = "Fictional sample data &middot; " if fictional else ""

    def row(l, total=False):
        cls = ' class="total"' if total else (' class="flag"' if l.get("flagged") else "")
        note = ""
        if not total:
            if l["explanation"]:
                who = f' <span class="who">Confirmed by {esc(l["confirmed"])}</span>' if l["confirmed"] else \
                    ' <span class="who">Draft, not yet confirmed</span>'
                note = esc(l["explanation"]) + who
            elif l["flagged"]:
                note = '<span class="need">Explanation needed</span>'
            if l.get("unbudgeted"):
                note = "Not in budget. " + note
        flag = "Flagged" if l.get("flagged") else ""
        fav = "Favorable" if l["favorable"] else "Unfavorable"
        if l["variance"] == 0:
            fav = "On budget"
        return (f"<tr{cls}><th scope=\"row\">{esc(l['category'])}</th><td>{fmt(l['budget'], 0)}</td>"
                f"<td>{fmt(l['actual'], 0)}</td><td>{fmt(l['variance'], 0)}</td><td>{pct_text(l['pct'])}</td>"
                f"<td>{fav}</td><td>{flag}</td><td class=\"note\">{note}</td></tr>")

    sections = []
    for kind, label in (("income", "Income"), ("expense", "Expenses")):
        body = "".join(row(l) for l in lines if l["type"] == kind)
        tot = next(t for t in totals if t["type"] == kind)
        sections.append(f'<tr class="sec"><th colspan="8">{label}</th></tr>{body}{row(tot, True)}')
    net = totals[-1]
    flagged = [l for l in lines if l["flagged"]]
    unexplained = [l for l in flagged if not l["explanation"]]
    charts = (bar_chart("Income: budget and actual", [l for l in lines if l["type"] == "income"])
              + bar_chart("Expenses: budget and actual", [l for l in lines if l["type"] == "expense"])
              + bar_chart("Totals: budget and actual", totals[:2]))
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} budget vs actual</title>
<style>
:root{{--bg:#ffffff;--fg:#1d2330;--muted:#5b6475;--line:#d9dde5;--bud:#b7c3d6;--act:#2f6f73;--flag:#fff4d6;--sec:#f2f4f8}}
@media (prefers-color-scheme: dark){{:root{{--bg:#15181e;--fg:#e8ebf1;--muted:#a3abba;--line:#343a46;--bud:#566175;--act:#5fb3b3;--flag:#3a3220;--sec:#1f242c}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}}
main{{max-width:960px;margin:auto;padding:24px 16px}}
.banner{{font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}}
h1{{font-size:1.6rem;margin:.2em 0}} h2{{font-size:1.15rem;margin-top:1.6em}}
.wrap{{overflow-x:auto}} table{{border-collapse:collapse;width:100%;font-size:14px}}
th,td{{padding:6px 8px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}}
th[scope=row],.sec th,thead th:first-child{{text-align:left}} td.note{{text-align:left;min-width:220px}}
tr.flag{{background:var(--flag)}} tr.total th,tr.total td{{font-weight:600}} tr.sec th{{background:var(--sec)}}
.who{{display:block;font-size:12px;color:var(--muted)}} .need{{font-weight:600}}
.chart{{width:100%;height:auto;margin:8px 0 18px}} .chart .bud{{fill:var(--bud)}} .chart .act{{fill:var(--act)}}
.chart text{{fill:var(--fg)}} .chart .small{{font-size:11px}} .chart .lbl{{font-size:12px}}
.kpi{{display:flex;flex-wrap:wrap;gap:12px}} .kpi div{{border:1px solid var(--line);border-radius:6px;padding:10px 14px;min-width:150px}}
.kpi b{{display:block;font-size:1.2rem}} footer{{color:var(--muted);font-size:13px;margin-top:2em}}
</style></head><body><main>
<p class="banner">{banner}Draft for treasurer review &middot; not yet approved</p>
<h1>{esc(title)}</h1><p>Budget compared with actual, {esc(period)}</p>
<div class="kpi"><div>Net result, actual<b>{fmt(net['actual'], 0)}</b></div>
<div>Net result, budget<b>{fmt(net['budget'], 0)}</b></div>
<div>Difference<b>{fmt(net['variance'], 0)}</b>{'Favorable' if net['favorable'] else 'Unfavorable'}</div>
<div>Lines flagged<b>{len(flagged)}</b>{len(unexplained)} still need an explanation</div></div>
<h2>Budget vs actual</h2>
<p>Variance is actual minus budget. Favorable means more income or less expense than budgeted. A line is flagged when it is off by at least {fmt(min_amount, 0)} and at least {pct_limit}% of budget.</p>
<div class="wrap"><table><thead><tr><th>Line</th><th>Budget</th><th>Actual</th><th>Variance</th><th>%</th><th>Direction</th><th>Flag</th><th>Explanation</th></tr></thead>
<tbody>{''.join(sections)}{row(net, True)}</tbody></table></div>
<h2>Charts</h2>{charts}
<footer>Built from the exports supplied. This page does not check the figures against QuickBooks Online; the treasurer confirms them and every explanation before the board sees it.</footer>
</main></body></html>
"""
    path.write_text(page, encoding="utf-8")


def number(text):
    """argparse type for --pct and --min-amount: a plain non-negative number."""
    try:
        value = Decimal(text.replace(",", "").replace("$", "").rstrip("%"))
    except InvalidOperation:
        raise argparse.ArgumentTypeError(f"'{text}' is not a number; use a plain number such as 10 or 500")
    if value < 0:
        raise argparse.ArgumentTypeError(f"'{text}' is negative; use zero or more")
    return value


def main():
    p = argparse.ArgumentParser(description="Compare an actuals CSV with a budget CSV; write a variance "
                                "CSV and a standalone HTML report with inline SVG charts. Local files only.")
    p.add_argument("--actuals", required=True, help="actuals CSV: Category, Amount (Type optional)")
    p.add_argument("--budget", required=True, help="budget CSV: Category, Type (income or expense), Amount")
    p.add_argument("--explanations", help="optional CSV: Category, Explanation, Confirmed by")
    p.add_argument("--pct", type=number, default=Decimal("10"), help="flag threshold, percent of budget (default 10)")
    p.add_argument("--min-amount", type=number, default=Decimal("0"),
                   help="flag only variances at least this many dollars (default 0)")
    p.add_argument("--title", default="Budget vs actual", help="organization name or report title")
    p.add_argument("--period", default="the period", help='period label, for example "First quarter 2026"')
    p.add_argument("--out", required=True, help="output folder (created if missing)")
    p.add_argument("--overwrite", action="store_true", help="replace existing output files")
    args = p.parse_args()

    out = Path(args.out)
    targets = [out / "budget-vs-actual.csv", out / "budget-vs-actual.html"]
    if not args.overwrite and any(t.exists() for t in targets):
        p.exit(2, "Cannot write: output files already exist in that folder. Choose a new folder or add --overwrite.\n")
    try:
        budget, w1, f1 = read_table(args.budget, need_type=True)
        actuals, w2, f2 = read_table(args.actuals, need_type=False)
        notes, note_names = read_notes(args.explanations) if args.explanations else ({}, {})
        lines, totals = build(budget, actuals, notes, args.pct, args.min_amount)
    except (OSError, ValueError) as exc:
        p.exit(1, f"Cannot build the report: {exc}\n")
    warnings = w1 + w2
    for l in lines:
        if l["missing_actual"]:
            warnings.append(f"'{l['category']}' is in the budget but not in actuals; treated as 0 actual")
    unknown_notes = [k for k in notes if k not in {norm(l['category']) for l in lines}]
    for k in unknown_notes:
        warnings.append(f"an explanation was given for '{note_names[k]}', which is not a line in either file")

    out.mkdir(parents=True, exist_ok=True)
    write_csv(targets[0], lines, totals)
    write_html(targets[1], lines, totals, args.title, args.period, f1 or f2, args.pct, args.min_amount)

    print(f"{args.title}: budget vs actual, {args.period}\n")
    print(f"{'Line':<36}{'Budget':>12}{'Actual':>12}{'Variance':>12}{'%':>9}  Flag")
    for l in lines + totals:
        flag = "FLAG" if l.get("flagged") else ""
        if l.get("flagged") and not l.get("explanation"):
            flag += " (explanation needed)"
        print(f"{l['category'][:35]:<36}{fmt(l['budget']):>12}{fmt(l['actual']):>12}"
              f"{fmt(l['variance']):>12}{pct_text(l['pct']):>9}  {flag}")
    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  - {w}")
    print(f"\nWrote {targets[0]}\nWrote {targets[1]}")
    print("Draft only. The treasurer confirms figures and explanations before anything goes to the board.")


if __name__ == "__main__":
    main()
