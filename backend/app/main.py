from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.categories import router as categories_router
from app.api.dashboard import router as dashboard_router
from app.api.products import router as products_router
from app.api.uploads import router as uploads_router
from app.api.inventory import router as inventory_router
from app.api.customers import router as customers_router
from app.api.sales import router as sales_router
from app.api.suppliers import router as suppliers_router
from app.api.purchases import router as purchases_router
from app.api.expenses import router as expenses_router
from app.api.users import router as users_router
from app.api.audit_logs import router as audit_logs_router
from app.api.business_settings import router as business_settings_router
from app.api.reports import router as reports_router
from app.api.ai import router as ai_router


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
app.include_router(customers_router)
app.include_router(sales_router)
app.include_router(suppliers_router)
app.include_router(purchases_router)
app.include_router(expenses_router)
app.include_router(users_router)
app.include_router(audit_logs_router)
app.include_router(business_settings_router)
app.include_router(reports_router)
app.include_router(ai_router)

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