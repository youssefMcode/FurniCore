from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.categories import router as categories_router
from app.api.dashboard import router as dashboard_router
from app.api.products import router as products_router
from app.api.uploads import router as uploads_router
from app.api.inventory import router as inventory_router


app = FastAPI(
    title="FurniCore API",
    description="Backend API for the FurniCore furniture management system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(products_router)
app.include_router(categories_router)
app.include_router(uploads_router)
app.include_router(inventory_router)


@app.get("/")
def root():
    return {
        "message": "FurniCore API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }