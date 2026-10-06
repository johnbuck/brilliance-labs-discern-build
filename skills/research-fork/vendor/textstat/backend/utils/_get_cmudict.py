from __future__ import annotations

from ._typed_cache import typed_cache
from ._get_lang_root import get_lang_root

import os
from pathlib import Path


def _load_vendored_cmudict() -> dict[str, list[list[str]]]:
    """Parse the vendored cmudict corpus without nltk.

    File format: one entry per line, 'WORD VARIANT# P1 P2 P3' where the
    second token is the pronunciation-variant number (not a phone) and
    phones ending in a digit are syllable nuclei. First variant wins.
    """
    path = (
        Path(__file__).resolve().parents[3]
        / "corpora"
        / "cmudict"
        / "cmudict"
    )
    if not path.exists():
        alt = path.with_suffix(".txt")
        if not alt.exists():
            return {}
        path = alt
    d: dict[str, list[list[str]]] = {}
    with open(path, encoding="latin-1") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 3:
                continue
            word = parts[0].lower()  # match nltk's cmudict.dict() key convention
            if word not in d:
                d[word] = [parts[2:]]
    return d


@typed_cache
def get_cmudict(lang: str) -> dict[str, list[list[str]]] | None:
    """Get a cmudict object for the given language. Currently only English is supported.
    Parameters
    ----------
    lang : str
        The language of the text.
    Returns
    -------
    dict[str, list[list[str]]] | None
        A cmudict object for the given language (or None if the language is not
        supported).
    """
    if get_lang_root(lang) == "en":
        try:
            import nltk  # system install wins when present

            try:
                nltk.data.find("corpora/cmudict")
            except LookupError:
                nltk.download("cmudict", quiet=True)
            return nltk.corpus.cmudict.dict()
        except ImportError:
            vendored = _load_vendored_cmudict()
            if vendored:
                return vendored
            raise ImportError(
                "textstat needs cmudict: install nltk, or restore the "
                "skill's vendor/corpora/cmudict directory"
            )
    else:
        return None
