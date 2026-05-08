from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from providers.registry import registry
from providers.base import WordAnalysis

router = APIRouter()


class AnalyzeRequest(BaseModel):
    language_code: str = Field(..., min_length=2, max_length=5)
    word: str = Field(..., min_length=1, max_length=200)
    context: str | None = None
    provider: str | None = None


@router.post("/analyze-word", response_model=WordAnalysis)
async def analyze_word(req: AnalyzeRequest) -> WordAnalysis:
    try:
        provider = registry.get(req.provider) if req.provider else registry.get_default()
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        return await provider.analyze(req.language_code, req.word, req.context)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
