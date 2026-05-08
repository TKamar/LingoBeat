import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from providers.registry import registry
from providers.base import WordAnalysis

router = APIRouter()


class AnalyzeRequest(BaseModel):
    language_code: str
    word: str
    context: str | None = None
    provider: str | None = None  # optional per-request override


@router.post("/analyze-word", response_model=WordAnalysis)
async def analyze_word(req: AnalyzeRequest) -> WordAnalysis:
    provider_name = req.provider or os.getenv("ANALYSIS_PROVIDER", "haiku")

    try:
        provider = registry.get(provider_name)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        return await provider.analyze(req.language_code, req.word, req.context)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
