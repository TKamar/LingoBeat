import os
from .base import WordAnalysisProvider


class ProviderRegistry:
    """
    Registry for WordAnalysisProvider implementations.
    Adding a new engine: implement WordAnalysisProvider, then call registry.register(instance).
    """

    def __init__(self) -> None:
        self._providers: dict[str, WordAnalysisProvider] = {}

    def register(self, provider: WordAnalysisProvider) -> None:
        self._providers[provider.name] = provider

    def get(self, name: str) -> WordAnalysisProvider:
        if name not in self._providers:
            available = list(self._providers)
            raise KeyError(f"Unknown provider '{name}'. Available: {available}")
        return self._providers[name]

    def get_default(self) -> WordAnalysisProvider:
        return self.get(os.getenv("ANALYSIS_PROVIDER", "haiku"))

    def list_all(self) -> list[dict]:
        return [{"name": p.name, "tier": p.tier} for p in self._providers.values()]


registry = ProviderRegistry()
