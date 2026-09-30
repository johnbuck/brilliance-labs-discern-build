"""Finishing touches for the Brilliance Labs look.

Colors and fonts live in .streamlit/config.toml. This file adds the details that make it
feel like brilliancelabs.org: uppercase headlines, the short orange rule, square tiles.
You don't need to change anything here; app.py just calls apply_brand().
"""
import streamlit as st

_CSS = """
<style>
  h1, h2, h3 { text-transform: uppercase; letter-spacing: 0.01em; line-height: 0.92 !important; }
  h1::after { content: ""; display: block; width: 56px; height: 4px; margin-top: 18px; background: #E8860F; }

  /* Small uppercase label above a title, with an orange lead-in line */
  .bl-eyebrow { display: flex; align-items: center; gap: 12px; margin: 0;
    font-size: 12px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: #9A5700; }
  .bl-eyebrow::before { content: ""; width: 24px; height: 2px; background: #E8860F; }

  /* Headline numbers as square tiles with big Bebas numerals */
  [data-testid="stMetric"] { background: #F5F2EB; border: 1px solid rgba(13,13,13,0.09); padding: 24px 28px; }
  [data-testid="stMetricLabel"] p { font-size: 12px !important; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(13,13,13,0.64); }
  [data-testid="stMetricValue"] { font-family: "Bebas Neue", "Arial Narrow", sans-serif; font-size: 3.25rem; line-height: 1; }

  /* Selected items on orange: black text, like Brilliance buttons (white on orange is hard to read) */
  [data-baseweb="tag"], [data-baseweb="tag"] span, [data-baseweb="tag"] svg { color: #0D0D0D !important; fill: #0D0D0D !important; }
  .stButton button, .stDownloadButton button { text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; }
</style>
"""


def apply_brand():
    """Call once, near the top of your app."""
    st.html(_CSS)


def eyebrow(text):
    """A small uppercase label, usually right above st.title()."""
    st.html(f'<p class="bl-eyebrow">{text}</p>')
