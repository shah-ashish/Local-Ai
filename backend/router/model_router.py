from fastapi import APIRouter, HTTPException
from backend.services.model_service import list_available_models

router = APIRouter()

@router.get("/models")
def get_models():
    try:
        models = list_available_models()
        return models
    except ConnectionError as e:
        # Return a clear 503 error if Ollama is unreachable, rather than crashing
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
