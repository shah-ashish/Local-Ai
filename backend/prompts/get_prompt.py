import os
from datetime import datetime
from backend.llm.model_info import get_model_info

def get_system_prompt(model_name: str) -> str:
    info = get_model_info(model_name)
    capabilities = info.get("capabilities", [])
    
    if "thinking" in capabilities:
        prompt_file = "DETAILED.txt"
    elif "tools" in capabilities:
        prompt_file = "MEDIUM.txt"
    else:
        prompt_file = "MINIMAL.txt"
        
    base_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(base_dir, prompt_file)
    
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            base_prompt = f.read().strip()
    else:
        base_prompt = "You are a helpful assistant."
        
    return f"Today's date is {datetime.now().strftime('%A, %B %d, %Y')}.\n\n{base_prompt}"
