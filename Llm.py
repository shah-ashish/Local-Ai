
from langchain_ollama import ChatOllama

def llm(llm_config: dict | None = None):
    llm_config = llm_config or {}
    response = ChatOllama(
        model=llm_config.get("model_name", "llama3"),
        temperature=llm_config.get("temp", 0.7),
        num_ctx=llm_config.get("num_ctx", 8192),
        num_predict=llm_config.get("num_predict", 1024),
        repeat_penalty=llm_config.get("repeat_penalty", 1.3),
        reasoning=llm_config.get("reasoning", False),
    )
    return response