from fastapi import FastAPI

app = FastAPI(title="Microdose Social Listening API")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}
