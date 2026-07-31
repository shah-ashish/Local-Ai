import threading
from langchain_core.messages import AIMessage, ToolMessage
from backend.utils.tools import TOOL_MAP

def run_tool_round(messages: list, model, model_has_thinking: bool = False, event: threading.Event = None) -> tuple[list, dict | None]:
    max_rounds = 3 if model_has_thinking else 1

    for round_num in range(max_rounds):
        if event and event.is_set():
            break

        # Invoke the model to see if it wants to call any tools
        response = model.invoke(messages)

        if event and event.is_set():
            break

        if hasattr(response, 'tool_calls') and response.tool_calls:
            # Check for the human-in-the-loop tool "ask_user_choice"
            ask_choice_call = next((tc for tc in response.tool_calls if tc.get("name") == "ask_user_choice"), None)
            if ask_choice_call:
                choice_payload = {
                    "question": ask_choice_call["args"].get("question"),
                    "options": ask_choice_call["args"].get("options", []),
                    "tool_call_id": ask_choice_call.get("id")
                }
                return messages, choice_payload

            # Standard tools execution
            messages.append(response)

            for tool_call in response.tool_calls:
                if event and event.is_set():
                    break
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

                messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_id))
        else:
            # No tool calls in this round, so stop querying tools
            break

    return messages, None
