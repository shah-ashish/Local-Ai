# router/chat_router.py
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage
from Model import callModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

def generate_stream(message: str, modelname: str):
    model = callModel(modelname)

    messages = [
        SystemMessage(content="you are a worlds best teacher 'Susan'..."),
        HumanMessage(content=message)
    ]

    thinking_started = False
    answer_started = False

    for chunk in model.stream(messages):
        reasoning_piece = chunk.additional_kwargs.get("reasoning_content")

        if reasoning_piece:
            if not thinking_started:
                yield "\n[THINKING]\n"
                thinking_started = True
            yield reasoning_piece

        if chunk.content:
            if not answer_started:
                if thinking_started:
                    yield "\n[/THINKING]\n"
                yield "\n[RESPONSE]\n"
                answer_started = True
            yield chunk.content

    if answer_started:
        yield "\n[/RESPONSE]\n"

@router.post("/chat")
def chat(body: ChatRequest, modelname: str = Header(None)):
    if not modelname:
        raise HTTPException(status_code=400, detail="modelname header is required")

    return StreamingResponse(
        generate_stream(body.message, modelname),
        media_type="text/plain"
    )