from fastapi import FastAPI

app = FastAPI(
    title="MCRDSE Social Listening API",
    version="0.1.0",
)

@app.get("/", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "message": "MCRDSE backend is running on Render 🚀",
    }

@app.get("/hello", tags=["demo"])
async def hello(name: str = "world"):
    return {"message": f"Hello, {name}!"}
