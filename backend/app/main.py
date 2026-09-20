from fastapi import FastAPI

from app.core.supabase import supabase

app = FastAPI(
    title="FurniCore API",
    description="Backend API for the FurniCore furniture management system",
    version="1.0.0",
)


@app.get("/")
def root():
    return {"message": "FurniCore API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}