import requests
from backend.llm.model_info import get_model_info

def list_available_models(base_url: str = "http://localhost:11434") -> list[dict]:
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        response.raise_for_status()
        data = response.json()
        models = data.get("models", [])
        
        result = []
        for m in models:
            name = m.get("name")
            if not name:
                continue
            try:
                # Query capabilities using the existing get_model_info logic
                info = get_model_info(name, base_url=base_url)
                result.append({
                    "id": name,
                    "name": name,
                    "capabilities": info.get("capabilities", [])
                })
            except Exception as e:
                # Fallback if get_model_info fails for a specific model
                result.append({
                    "id": name,
                    "name": name,
                    "capabilities": ["completion"]
                })
        return result
    except Exception as e:
        raise ConnectionError(f"Could not connect to Ollama. Details: {e}")
