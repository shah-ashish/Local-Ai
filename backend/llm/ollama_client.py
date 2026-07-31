from langchain_ollama import ChatOllama
from backend.utils.tools import TOOLS

def llm(llm_config: dict | None = None):
    llm_config = llm_config or {}
    response = ChatOllama(
        model=llm_config.get("model_name", "llama3"),
        temperature=llm_config.get("temp", 0.7),
        num_ctx=llm_config.get("num_ctx", 8192),
        num_predict=llm_config.get("num_predict", 1024),
        repeat_penalty=llm_config.get("repeat_penalty", 1.1),
        repeat_last_n=llm_config.get("repeat_last_n", 256 if llm_config.get("reasoning", False) else 64),
        reasoning=llm_config.get("reasoning", False),
    )
    
    if llm_config.get("tools_enabled"):
        response = response.bind_tools(TOOLS)
        
    return response
