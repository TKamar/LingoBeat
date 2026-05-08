import os
import json
import anthropic
from .base import WordAnalysisProvider, WordAnalysis

LANGUAGE_NAMES: dict[str, str] = {
    "fr": "French", "es": "Spanish", "de": "German", "it": "Italian",
    "pt": "Portuguese", "ja": "Japanese", "ko": "Korean", "zh": "Chinese (Mandarin)",
    "ar": "Arabic", "ru": "Russian", "nl": "Dutch", "pl": "Polish",
    "tr": "Turkish", "sv": "Swedish", "da": "Danish", "no": "Norwegian",
}

_PROMPT = """\
Analyze the {language} word or phrase: "{word}"
{context_line}

Respond with a JSON object containing exactly these fields:
- ipa: IPA pronunciation string (e.g., "/di.mwa/")
- meaning: English translation and brief explanation (1-2 sentences max)
- register: exactly one of "formal", "neutral", "informal", "slang", "vulgar"
- slang_notes: a brief note if register is slang/vulgar, otherwise null
- examples: array of exactly 2 strings, each as "{language} sentence. (English translation.)"

Return ONLY valid JSON. No markdown, no code blocks."""


class ClaudeProvider(WordAnalysisProvider):
    """
    Pro-tier provider using Anthropic Claude models.
    Instantiate with different model IDs to register haiku, sonnet, etc.
    """

    def __init__(self, model: str, name: str) -> None:
        self._model = model
        self._name = name
        self._client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    @property
    def name(self) -> str:
        return self._name

    @property
    def tier(self) -> str:
        return "pro"

    async def analyze(self, language_code: str, word: str, context: str | None) -> WordAnalysis:
        language = LANGUAGE_NAMES.get(language_code, language_code)
        context_line = f'Sentence context: "{context}"' if context else ""
        prompt = _PROMPT.format(language=language, word=word, context_line=context_line)

        message = self._client.messages.create(
            model=self._model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )

        try:
            data = json.loads(message.content[0].text.strip())
            return WordAnalysis(**data, provider=self.name)
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            raise RuntimeError(f"Claude response parse error: {e}") from e


# Concrete instances — register both in main.py
haiku_provider = ClaudeProvider(model="claude-haiku-4-5-20251001", name="haiku")
sonnet_provider = ClaudeProvider(model="claude-sonnet-4-6", name="sonnet")
