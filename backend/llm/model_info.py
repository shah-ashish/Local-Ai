import json
import os
import requests

CACHE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    ".cache",
    "current_model.json"
)


def _load_cache(cache_file: str = CACHE_FILE) -> dict | None:
    """Return cached info dict if the file exists and is valid JSON, else None."""
    if not os.path.exists(cache_file):
        return None
    try:
        with open(cache_file, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def _save_cache(info: dict, cache_file: str = CACHE_FILE) -> None:
    cache_dir = os.path.dirname(cache_file)
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir, exist_ok=True)
    with open(cache_file, "w") as f:
        json.dump(info, f, indent=2)


def get_model_info(
    model_name: str,
    base_url: str = "http://localhost:11434",
    cache_file: str = CACHE_FILE,
) -> dict:
    """
    Fetch key info about an Ollama model via /api/show
    (equivalent to `ollama show <model_name>`), and return
    only the fields we care about:
      - model name
      - context length (num_ctx)
      - capabilities
      - whether a chat template is defined
      - family / parameter size / quantization (bonus useful info)

    Caches the result in `cache_file`. If the cached model_name
    matches the requested model_name, skip the API call entirely
    and return the cached data. Otherwise, call the API and
    overwrite the cache.
    """
    cached = _load_cache(cache_file)
    if cached is not None and cached.get("model_name") == model_name:
        return cached

    response = requests.post(
        f"{base_url}/api/show",
        json={"model": model_name},
    )
    response.raise_for_status()
    data = response.json()

    details = data.get("details", {}) or {}
    model_info = data.get("model_info", {}) or {}

    num_ctx = next(
        (v for k, v in model_info.items() if k.endswith("context_length")),
        None,
    )

    result = {
        "model_name": model_name,
        "num_ctx": num_ctx,
        "capabilities": data.get("capabilities", []),
        "template_supported": bool(data.get("template")),
        "family": details.get("family"),
        "parameter_size": details.get("parameter_size"),
        "quantization_level": details.get("quantization_level"),
    }

    _save_cache(result, cache_file)
    return result
