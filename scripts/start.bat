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

:: 4. Check for backend/requirements.txt and install missing packages
if exist backend\requirements.txt (
    echo Checking and installing packages...
    pip install -r backend\requirements.txt --quiet
) else (
    echo Warning: backend\requirements.txt not found. Skipping package installation.
)

echo ============================
echo Starting server!
echo ============================

call uvicorn backend.app:app --reload --port 8000
