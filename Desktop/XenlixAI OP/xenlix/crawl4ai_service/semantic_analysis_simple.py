# semantic_analysis_simple.py
from bs4 import BeautifulSoup

def extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    # drop script/style
    for t in soup(["script","style","noscript"]): 
        t.decompose()
    text = " ".join(soup.get_text(" ").split())
    return text[:200_000]  # hard cap to keep responses small

def analyze(text: str) -> dict:
    # trivial signal demo; replace with your real logic
    words = text.split()
    return {
        "length": len(text),
        "word_count": len(words),
        "keywords": sorted({w.lower() for w in words[:500] if len(w) > 6})[:25],
        "score": min(100, max(0, len(words) // 50))
    }