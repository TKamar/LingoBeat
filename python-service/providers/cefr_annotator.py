from pathlib import Path
import json

_WORDLISTS: dict[str, dict[str, str]] = {}


def _load_wordlist(language: str) -> dict[str, str]:
    if language not in _WORDLISTS:
        data_dir = Path(__file__).parent.parent / "data"
        wordlist: dict[str, str] = {}
        # Load language-specific file first, then fall back to shared/unknown
        lang_file = data_dir / f"cefr_{language}.json"
        if lang_file.exists():
            with open(lang_file) as f:
                wordlist.update(json.load(f))
        _WORDLISTS[language] = wordlist
    return _WORDLISTS[language]


def annotate_cefr(words: list[str], language: str) -> list[dict]:
    wordlist = _load_wordlist(language)
    result = []
    for word in words:
        normalized = word.lower().strip(".,!?\"'")
        level = wordlist.get(normalized)
        result.append({"word": word, "cefr_level": level})
    return result
