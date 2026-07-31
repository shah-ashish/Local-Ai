# router/chat_router.py
import json
import threading
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from backend.llm.model import callModel
from backend.prompts.get_prompt import get_system_prompt
from backend.utils.tools import TOOL_MAP

router = APIRouter()

# Track in-flight generations by request ID
active_requests: dict[str, threading.Event] = {}

class ChatRequest(BaseModel):
    message: str
    resume: dict | None = None

class StopRequest(BaseModel):
    request_id: str

def generate_stream(message: str, modelname: str, resume: dict | None = None, event: threading.Event = None, request_id: str = None):
    try:
        model = callModel(modelname)
        system_prompt = get_system_prompt(modelname)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ]

        if event and event.is_set():
            return

        # Check if this is a resume round from a user choice selection
        if resume:
            # Manually reconstruct the messages list with original query, AIMessage showing the tool call, and the ToolMessage response
            ask_user_tool_call = {
                "name": "ask_user_choice",
                "args": {
                    "question": resume.get("question"),
                    "options": resume.get("options")
                },
                "id": resume.get("tool_call_id")
            }
            ai_msg = AIMessage(content="", tool_calls=[ask_user_tool_call])
            tool_msg = ToolMessage(content=resume.get("answer"), tool_call_id=resume.get("tool_call_id"))
            
            messages.append(ai_msg)
            messages.append(tool_msg)
            
            if event and event.is_set():
                return
            stream_target = model.stream(messages)
        else:
            # First round: invoke model to check for tool calls
            response = model.invoke(messages)
            
            if event and event.is_set():
                return

            # Check if the model returned any tool calls
            if hasattr(response, 'tool_calls') and response.tool_calls:
                # Check if any tool call is the human-in-the-loop "ask_user_choice"
                ask_choice_call = next((tc for tc in response.tool_calls if tc.get("name") == "ask_user_choice"), None)
                
                if ask_choice_call:
                    # Yield choice payload back to frontend and return immediately
                    choice_data = {
                        "question": ask_choice_call["args"].get("question"),
                        "options": ask_choice_call["args"].get("options", []),
                        "tool_call_id": ask_choice_call.get("id")
                    }
                    yield f"\n[ASK_CHOICE]{json.dumps(choice_data)}[/ASK_CHOICE]\n"
                    return
                
                # Execute standard tools
                messages.append(response)  # Append AI Message with the tool_calls
                
                for tool_call in response.tool_calls:
                    if event and event.is_set():
                        return
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_id = tool_call.get("id")
                    
                    tool_obj = TOOL_MAP.get(tool_name)
                    if tool_obj:
                        try:
                            tool_result = tool_obj.invoke(tool_args)
                        except Exception as e:
                            tool_result = f"Error executing tool: {e}"
                    else:
                        tool_result = f"Error: Tool '{tool_name}' not found."
                    
                    tool_message = ToolMessage(content=str(tool_result), tool_call_id=tool_id)
                    messages.append(tool_message)
                
                if event and event.is_set():
                    return
                # Stream the final answer based on the tool results
                stream_target = model.stream(messages)
            else:
                # No tool calls: just call model.stream on original messages
                stream_target = model.stream(messages)

        thinking_started = False
        answer_started = False

        for chunk in stream_target:
            # Be honest: breaking out of the model.stream() loop and letting the
            # underlying HTTP connection to Ollama get garbage-collected is the best
            # available stop mechanism here. Ollama doesn't expose a per-request
            # cancel-by-ID API, so we rely on the connection closing to halt generation
            # server-side. It stops quickly in practice, but isn't instantaneous.
            if event and event.is_set():
                break

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

    finally:
        # Pop the event from in-flight tracker to clean up memory
        if request_id:
            active_requests.pop(request_id, None)

@router.post("/chat")
def chat(body: ChatRequest, modelname: str = Header(None), x_request_id: str = Header(None)):
    if not modelname:
        raise HTTPException(status_code=400, detail="modelname header is required")

    # If the client sent a request ID, set up cancellation event
    event = None
    if x_request_id:
        event = threading.Event()
        active_requests[x_request_id] = event

    return StreamingResponse(
        generate_stream(body.message, modelname, body.resume, event, x_request_id),
        media_type="text/plain"
    )

@router.post("/chat/stop")
def stop_chat(body: StopRequest):
    event = active_requests.get(body.request_id)
    if event:
        event.set()
        # Clean up immediately
        active_requests.pop(body.request_id, None)
        return {"status": "cancelled"}
    else:
        # Return a 404-style response indicating request was not found (already finished)
        raise HTTPException(status_code=404, detail="Active request not found")
