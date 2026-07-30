@echo off
echo ============================
echo Starting venv environment
echo ============================

:: 1. Check if venv exists, create it if missing
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)

:: 2. Activate the virtual environment
call .venv\Scripts\activate.bat

:: 3. Upgrade pip to avoid warnings
python -m pip install --upgrade pip --quiet

:: 4. Check for requirements.txt and install missing packages
if exist requirements.txt (
    echo Checking and installing packages...
    pip install -r requirements.txt --quiet
) else (
    echo Warning: requirements.txt not found. Skipping package installation.
)

echo ============================
echo Starting server!
echo ============================

call uvicorn app:app --reload --port 8000
