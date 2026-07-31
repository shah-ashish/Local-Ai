import threading
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from backend.llm.model import callModel
from backend.prompts.get_prompt import get_system_prompt
from backend.llm.model_info import get_model_info
from backend.services.tool_service import run_tool_round
from backend.services.stream_formatter import format_ask_choice, format_stream
from backend.state.request_tracker import request_tracker

def generate_stream(body, modelname: str, event: threading.Event = None, request_id: str = None):
    try:
        model = callModel(modelname)
        system_prompt = get_system_prompt(modelname)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=body.message)
        ]

        if event and event.is_set():
            return

        model_info = get_model_info(modelname)
        model_has_thinking = "thinking" in model_info.get("capabilities", [])

        # Check if this is a resume round from a user choice selection
        if body.resume:
            # Manually reconstruct the messages list with original query, AIMessage showing the tool call, and the ToolMessage response
            ask_user_tool_call = {
                "name": "ask_user_choice",
                "args": {
                    "question": body.resume.get("question"),
                    "options": body.resume.get("options")
                },
                "id": body.resume.get("tool_call_id")
            }
            ai_msg = AIMessage(content="", tool_calls=[ask_user_tool_call])
            tool_msg = ToolMessage(content=body.resume.get("answer"), tool_call_id=body.resume.get("tool_call_id"))
            
            messages.append(ai_msg)
            messages.append(tool_msg)
            
            if event and event.is_set():
                return
            stream_target = model.stream(messages)
            yield from format_stream(stream_target, event)
        else:
            # Execute tool rounds loop
            messages, ask_choice_payload = run_tool_round(messages, model, model_has_thinking, event)

            if ask_choice_payload:
                yield format_ask_choice(ask_choice_payload)
                return

            if event and event.is_set():
                return

            # Stream the final answer based on the tool results (or original message if no tools called)
            stream_target = model.stream(messages)
            yield from format_stream(stream_target, event)

    finally:
        # Pop the event from in-flight tracker to clean up memory
        if request_id:
            request_tracker.release(request_id)
