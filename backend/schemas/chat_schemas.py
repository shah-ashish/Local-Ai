from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    resume: dict | None = None

class StopRequest(BaseModel):
    request_id: str
