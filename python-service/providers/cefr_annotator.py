from pathlib import Path
import json

_WORDLIST: dict[str, str] = {}


def _load_wordlist() -> None:
    global _WORDLIST
    if _WORDLIST:
        return
    data_dir = Path(__file__).parent.parent / "data"
    for path in data_dir.glob("cefr_*.json"):
        with open(path) as f:
            _WORDLIST.update(json.load(f))


def annotate_cefr(words: list[str], language: str) -> list[dict]:
    _load_wordlist()
    result = []
    for word in words:
        normalized = word.lower().strip(".,!?\"'")
        level = _WORDLIST.get(normalized)
        result.append({"word": word, "cefr_level": level})
    return result
