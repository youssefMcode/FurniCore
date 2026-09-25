from pydantic import BaseModel


class ReportSummary(BaseModel):
    gross_sales: float
    refunds: float
    net_sales: float
    expenses: float
    net_revenue: float
    outstanding_balance: float
    sales_count: int
    average_sale: float


class SalesTrendItem(BaseModel):
    date: str
    sales: float
    refunds: float
    net_sales: float


class TopProductItem(BaseModel):
    product_id: str
    name: str
    sku: str
    quantity_sold: int
    revenue: float


class ExpenseBreakdownItem(BaseModel):
    category: str
    amount: float


class LowStockItem(BaseModel):
    id: str
    name: str
    sku: str
    stock_quantity: int
    minimum_stock: int


class ReportsResponse(BaseModel):
    summary: ReportSummary
    sales_trend: list[SalesTrendItem]
    top_products: list[TopProductItem]
    expense_breakdown: list[ExpenseBreakdownItem]
    low_stock: list[LowStockItem]