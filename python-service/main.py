from fastapi import FastAPI
from pydantic import BaseModel
from providers.registry import registry
from providers.claude import haiku_provider, sonnet_provider
from providers.free import free_provider
from providers.cefr_annotator import annotate_cefr
from routers.analyze import router as analyze_router

# Register all providers here — adding a new engine = one line below + one new file
registry.register(haiku_provider)
registry.register(sonnet_provider)
registry.register(free_provider)

app = FastAPI(title="LingoBeat Analysis Service", version="0.2.0")
app.include_router(analyze_router)


class CEFRRequest(BaseModel):
    words: list[str]
    language: str = "fr"


@app.post("/annotate-cefr")
async def annotate_cefr_endpoint(req: CEFRRequest):
    return annotate_cefr(req.words, req.language)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "providers": registry.list_all()}


@app.get("/providers")
def list_providers() -> list[dict]:
    return registry.list_all()
