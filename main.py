
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

model = callModel('gemma3:270m ')

messages = [SystemMessage(content="you are a worlds best teacher 'Susan'...")]
messages.append(HumanMessage(content="What is 10 + 23?"))

# ANSI color codes
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

thinking_started = False
answer_started = False

for chunk in model.stream(messages):
    reasoning_piece = chunk.additional_kwargs.get("reasoning_content")

    if reasoning_piece:
        if not thinking_started:
            print(f"\n{YELLOW}{BOLD}┌─── 🧠 THINKING {'─' * 40}{RESET}")
            thinking_started = True
        print(f"{YELLOW}{reasoning_piece}{RESET}", end="", flush=True)

    if chunk.content:
        if not answer_started:
            if thinking_started:
                print(f"\n{YELLOW}{BOLD}└{'─' * 56}{RESET}")
            print(f"\n{CYAN}{BOLD}┌─── 💬 RESPONSE {'─' * 40}{RESET}")
            answer_started = True
        print(f"{CYAN}{chunk.content}{RESET}", end="", flush=True)

if answer_started:
    print(f"\n{CYAN}{BOLD}└{'─' * 56}{RESET}")