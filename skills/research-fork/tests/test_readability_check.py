"""Known-answer tests for readability_check.py (CAP-4 + CAP-4b)."""
import sys
sys.path.insert(0, "scripts")
from readability_check import measure, evaluate, SENTLEN_WARN, FK_WARN

def test_dense_fixture_fails():
    m = measure(open("tests/fixtures/dense_internals_report.md").read())
    fails, warns, adv = evaluate(m)
    assert fails, "positive control must fail"
    assert m["internals_hits"] > 0
    assert m["mean_refs"] > 1.6

def test_clean_fixture_passes():
    m = measure(open("tests/fixtures/clean_report.md").read())
    fails, warns, adv = evaluate(m)
    assert not fails and not warns, "negative control must pass clean"

def test_bibliography_excluded():
    text = "Body sentence with one ref [1] and more than thirty characters.\n\n## Bibliography\n[1] Author. (2024). The pipeline of something. Journal.\n"
    m = measure(text)
    assert m["sentences"] == 1, "bibliography entries must not count as sentences"
    assert m["internals_hits"] == 0, "bibliography must not trip internals gate"

def test_comma_style_chains_counted():
    text = "A claim supported by many works in one comma chain [1, 2, 3, 4] here. Another ordinary sentence with exactly one reference attached [5]. One more sentence with no references at all and enough length to count."
    m = measure(text)
    assert m["refs"] == 5, f"expected 5 refs, got {m['refs']}"

def test_postbib_internals_fail():
    """Narration moved past the bibliography must still trip the gate."""
    m = measure(open("tests/fixtures/postbib_internals_report.md").read())
    fails, warns, adv = evaluate(m)
    assert fails and any("internals" in f for f in fails)
    # citation metrics unchanged by the leak
    assert m["mean_refs"] <= 1.6

def test_longwinded_fixture_fails():
    """Long tangled sentences trip the textstat gates even with clean
    citations and zero internals — what the CAP-4a gates alone missed."""
    m = measure(open("tests/fixtures/longwinded_report.md").read())
    fails, warns, adv = evaluate(m)
    assert m["mean_sent_len"] > SENTLEN_WARN or m["fk_grade"] > FK_WARN
    assert any("sentence length" in f or "reading grade" in f for f in fails + warns)
    assert m["internals_hits"] == 0 and m["mean_refs"] <= 1.6

if __name__ == "__main__":
    test_dense_fixture_fails()
    test_clean_fixture_passes()
    test_bibliography_excluded()
    test_comma_style_chains_counted()
    test_postbib_internals_fail()
    test_longwinded_fixture_fails()
    print("all 6 known-answer tests ran and passed")
