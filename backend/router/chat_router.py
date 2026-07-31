# router/chat_router.py
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from backend.schemas.chat_schemas import ChatRequest, StopRequest
from backend.state.request_tracker import request_tracker
from backend.services import chat_service

router = APIRouter()

@router.post("/chat")
def chat(body: ChatRequest, modelname: str = Header(None), x_request_id: str = Header(None)):
    if not modelname:
        raise HTTPException(status_code=400, detail="modelname header is required")

    event = request_tracker.register(x_request_id) if x_request_id else None

    return StreamingResponse(
        chat_service.generate_stream(body, modelname, event, x_request_id),
        media_type="text/plain"
    )

@router.post("/chat/stop")
def stop_chat(body: StopRequest):
    if request_tracker.cancel(body.request_id):
        return {"status": "cancelled"}
    raise HTTPException(status_code=404, detail="Active request not found")
