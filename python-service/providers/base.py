from abc import ABC, abstractmethod
from typing import Literal
from pydantic import BaseModel


class WordAnalysis(BaseModel):
    ipa: str
    meaning: str
    register: str           # "formal" | "neutral" | "informal" | "slang" | "vulgar"
    slang_notes: str | None
    examples: list[str]
    provider: str           # which provider produced this result
    is_partial: bool = False  # True when free provider has incomplete data


class WordAnalysisProvider(ABC):
    """
    Strategy interface. Implement this to add a new analysis engine.
    Register the instance in main.py: registry.register(my_provider)
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier used in cache key and request routing."""
        ...

    @property
    @abstractmethod
    def tier(self) -> Literal["free", "pro"]:
        """'free' providers require no API keys; 'pro' providers require credentials."""
        ...

    @abstractmethod
    async def analyze(
        self, language_code: str, word: str, context: str | None
    ) -> WordAnalysis:
        """Analyze a word and return structured linguistic data."""
        ...

    def supports_language(self, language_code: str) -> bool:
        """Override to restrict language support. Default: all languages."""
        return True
