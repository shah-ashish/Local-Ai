import ast
import operator as op
import os
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from ddgs import DDGS
from langchain_core.tools import tool

# Supported operators for safe math calculate tool
operators = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.USub: op.neg
}

def _eval_node(node):
    if isinstance(node, ast.Num):  # Python <3.8
        return node.n
    elif isinstance(node, ast.Constant):  # Python >=3.8
        return node.value
    elif isinstance(node, ast.BinOp):
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        op_func = operators.get(type(node.op))
        if op_func is None:
            raise TypeError(f"Unsupported operator: {type(node.op)}")
        return op_func(left, right)
    elif isinstance(node, ast.UnaryOp):
        operand = _eval_node(node.operand)
        op_func = operators.get(type(node.op))
        if op_func is None:
            raise TypeError(f"Unsupported operator: {type(node.op)}")
        return op_func(operand)
    else:
        raise TypeError(f"Unsupported syntax: {type(node)}")

@tool
def calculate(expression: str) -> str:
    """Safely evaluates a basic mathematical expression containing numbers, parentheses, and operations (+, -, *, /, ^).

    Use this whenever you need to compute simple arithmetic or complex mathematical expressions rather than guessing.
    """
    # Replace '^' with '**' for AST parsing because '^' is XOR in Python
    expression = expression.replace('^', '**')
    try:
        node = ast.parse(expression, mode='eval').body
        result = _eval_node(node)
        return str(result)
    except Exception as e:
        return f"Error: Invalid expression or calculation failed. Details: {e}"

@tool
def get_current_datetime() -> str:
    """Returns the current local date and time. Use this whenever the user asks for the current date, time, year, or month."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

@tool
def get_weather(city: str) -> str:
    """Gets the current weather (temperature and windspeed) for a given city name. Use this whenever the user asks about the weather or forecast for a specific location."""
    try:
        # Step 1: Geocoding
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
        geo_resp = requests.get(geo_url, timeout=10)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        
        results = geo_data.get("results")
        if not results:
            return f"Error: City '{city}' not found."
            
        location = results[0]
        lat = location.get("latitude")
        lon = location.get("longitude")
        name = location.get("name")
        country = location.get("country", "")
        
        # Step 2: Weather Forecast
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        weather_resp = requests.get(weather_url, timeout=10)
        weather_resp.raise_for_status()
        weather_data = weather_resp.json()
        
        curr = weather_data.get("current_weather")
        if not curr:
            return f"Error: Could not retrieve weather data for {name}."
            
        temp = curr.get("temperature")
        wind = curr.get("windspeed")
        unit_temp = "°C"
        
        return f"Current weather in {name}, {country}: Temperature is {temp}{unit_temp}, windspeed is {wind} km/h."
    except Exception as e:
        return f"Error: Failed to fetch weather for '{city}'. Details: {e}"

@tool
def web_search(query: str) -> str:
    """Performs a web search on DuckDuckGo and returns the top 5 results with title, URL, and snippet.

    Use this when the user asks questions requiring real-time info, news, or lookups that you do not know.
    """
    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=5)
            if not results:
                return "No search results found."
            
            output = []
            for i, r in enumerate(results, 1):
                title = r.get("title", "No Title")
                url = r.get("href", "No URL")
                snippet = r.get("body", "No description available.")
                output.append(f"{i}. {title}\n   URL: {url}\n   Snippet: {snippet}")
            return "\n\n".join(output)
    except Exception as e:
        return f"Error: Search failed. Details: {e}"

@tool
def scrape_webpage(url: str) -> str:
    """Fetches a URL and extracts clean webpage text capped at 4000 characters.

    Use this after web_search when you need real article content — not just a snippet — to answer a current-events or factual question with specifics.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            element.extract()
            
        # get text
        text = soup.get_text(separator="\n")
        
        # break into lines and remove leading and trailing whitespace
        lines = (line.strip() for line in text.splitlines())
        # break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # drop blank lines
        clean_text = "\n".join(chunk for chunk in chunks if chunk)
        
        # Cap at 4000 characters
        if len(clean_text) > 4000:
            clean_text = clean_text[:4000] + "\n... [TRUNCATED]"
            
        return clean_text
    except Exception as e:
        return f"Error: Failed to scrape webpage. Details: {e}"

@tool
def ask_user_choice(question: str, options: list[str]) -> str:
    """Asks the user a multiple-choice question when their request is genuinely ambiguous, returning their selection.

    Use this when a request is ambiguous or has multiple possible interpretations and you need the user's choice to proceed.
    Provide 2 to 4 short, distinct choices.
    """
    raise NotImplementedError("This tool is intercepted and never executed directly on the backend.")

# Tools list for binding
TOOLS = [
    calculate,
    get_current_datetime,
    get_weather,
    web_search,
    scrape_webpage,
    ask_user_choice
]

# Map names to tool objects for execution
TOOL_MAP = {
    "calculate": calculate,
    "get_current_datetime": get_current_datetime,
    "get_weather": get_weather,
    "web_search": web_search,
    "scrape_webpage": scrape_webpage,
    "ask_user_choice": ask_user_choice
}
