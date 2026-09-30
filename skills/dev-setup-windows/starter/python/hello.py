"""Run me with:  python hello.py   (checks that Python and the common libraries work)"""
import sys, importlib

libs = ["requests", "dotenv", "pandas", "numpy", "matplotlib", "openpyxl", "bs4",
        "flask", "fastapi", "uvicorn", "jupyterlab", "pytest", "anthropic", "streamlit"]
print(f"Python {sys.version.split()[0]} at {sys.executable}")
for name in libs:
    try:
        mod = importlib.import_module(name)
        print(f"  ok   {name} {getattr(mod, '__version__', '')}")
    except Exception as e:
        print(f"  MISSING {name}: {e}")
