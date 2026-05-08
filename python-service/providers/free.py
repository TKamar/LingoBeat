import httpx
from .base import WordAnalysisProvider, WordAnalysis

_MYMEMORY_URL = "https://api.mymemory.translated.net/get"

# ISO 639-1 codes supported by MyMemory
_SUPPORTED_LANGS = {
    "fr", "es", "de", "it", "pt", "ja", "ko", "zh",
    "ar", "ru", "nl", "pl", "tr", "sv", "da", "no",
}


class FreeProvider(WordAnalysisProvider):
    """
    Free-tier provider. No API keys required.
    - IPA: phonemizer (local, espeak-ng backend)
    - Meaning: MyMemory translation API (free, no key, 1000 req/day)
    - Register/slang: not detected (defaults to 'neutral')
    - Examples: derived from context if provided, otherwise empty
    """

    @property
    def name(self) -> str:
        return "free"

    @property
    def tier(self) -> str:
        return "free"

    async def analyze(self, language_code: str, word: str, context: str | None) -> WordAnalysis:
        ipa = self._get_ipa(word, language_code)
        meaning, is_partial = await self._get_meaning(word, language_code)
        examples = [context] if context else []

        return WordAnalysis(
            ipa=ipa,
            meaning=meaning,
            register="neutral",
            slang_notes=None,
            examples=examples,
            provider=self.name,
            is_partial=is_partial,
        )

    def _get_ipa(self, word: str, language_code: str) -> str:
        try:
            from phonemizer import phonemize
            result = phonemize(
                word,
                language=language_code,
                backend="espeak",
                with_stress=True,
                preserve_punctuation=False,
            )
            return f"/{result.strip()}/"
        except Exception:
            return f"/{word}/"  # graceful fallback

    async def _get_meaning(self, word: str, language_code: str) -> tuple[str, bool]:
        if language_code not in _SUPPORTED_LANGS:
            return f'"{word}" — translation unavailable in free mode', True

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    _MYMEMORY_URL,
                    params={"q": word, "langpair": f"{language_code}|en"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    translated = data["responseData"]["translatedText"]
                    if translated and translated.lower() != word.lower():
                        return translated, False
        except Exception:
            pass

        return f'"{word}" — translation unavailable in free mode', True


free_provider = FreeProvider()
