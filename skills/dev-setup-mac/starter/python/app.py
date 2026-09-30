"""A tiny web app in Python, in the Brilliance Labs style.  Run it with:   streamlit run app.py
Then try changing the title below, save the file, and watch the page update."""
import pandas as pd
import streamlit as st

from brand import apply_brand, eyebrow   # the Brilliance look (see brand.py and .streamlit/config.toml)

st.set_page_config(page_title="Giving Dashboard", page_icon="🔥", layout="wide")
apply_brand()

eyebrow("Cedar Creek Community Church · Practice data")
st.title("Monthly Giving")
st.caption("A made-up church. Point this at your own CSV file anytime.")

# 1. Read the spreadsheet (a CSV file sitting next to this app)
data = pd.read_csv("giving.csv", parse_dates=["month"])

# 2. Let people pick which funds to look at
all_funds = sorted(data["fund"].unique())
funds = st.multiselect("Funds", all_funds, default=all_funds)
shown = data[data["fund"].isin(funds)]

# 3. Big numbers at the top
col1, col2, col3 = st.columns(3)
col1.metric("Total given", f"${shown['amount'].sum():,.0f}")
col2.metric("Best month", shown.groupby("month")["amount"].sum().idxmax().strftime("%B %Y") if len(shown) else "-")
col3.metric("Funds shown", len(funds))

# 4. A chart and the table underneath
st.subheader("Each month")
by_month = shown.assign(month=shown["month"].dt.strftime("%Y-%m"))  # "2025-01" labels sort in order
st.bar_chart(by_month.pivot_table(index="month", columns="fund", values="amount", aggfunc="sum"))
with st.expander("See the numbers"):
    st.dataframe(shown, width="stretch", hide_index=True)
