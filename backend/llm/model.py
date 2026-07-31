from backend.llm.model_info import get_model_info
from backend.llm.ollama_client import llm

def callModel(model_name):
    # model info
    info = get_model_info(model_name)

    llm_config = {
        "model_name": info['model_name'],
        "num_ctx": info['num_ctx'],
        "num_predict" : min(4096, info['num_ctx'] // 2) ,
        "reasoning": "thinking" in info.get('capabilities', []),
        "tools_enabled": "tools" in info.get('capabilities', []),
    }

    return llm(llm_config)
