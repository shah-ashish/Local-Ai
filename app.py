# main.py
import os
from fastapi import FastAPI
from router.chat_router import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()


# --- CORS setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your Vite frontend's origin
    allow_credentials=True,
    allow_methods=["*"],   # allow GET, POST, etc.
    allow_headers=["*"],   # allow custom headers like "modelname"
)


app.include_router(chat_router, prefix="/api")

# Serve frontend build if it exists
if os.path.exists("client/dist"):
    app.mount("/", StaticFiles(directory="client/dist", html=True), name="static")
else:
    @app.get("/")
    def home():
        return {"message": "server is alive"}