import json
import threading

def format_ask_choice(choice_payload: dict) -> str:
    return f"\n[ASK_CHOICE]{json.dumps(choice_payload)}[/ASK_CHOICE]\n"

def format_stream(stream_target, event: threading.Event = None):
    thinking_started = False
    answer_started = False

    for chunk in stream_target:
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
