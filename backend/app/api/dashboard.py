from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.supabase import get_supabase_client


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


def money(value) -> float:
    return float(Decimal(str(value or 0)))


def parse_timestamp(value: str) -> datetime:
    """
    Safely parse PostgreSQL/Supabase ISO timestamps.

    PostgreSQL may return fractional seconds with a variable
    number of digits, so normalize them to Python's supported
    six-digit microsecond precision.
    """
    value = value.strip().replace("Z", "+00:00")

    if "." in value:
        date_part, remainder = value.split(".", 1)

        timezone_position = max(
            remainder.find("+"),
            remainder.find("-"),
        )

        if timezone_position != -1:
            fraction = remainder[:timezone_position]
            timezone_part = remainder[timezone_position:]
        else:
            fraction = remainder
            timezone_part = ""

        fraction = fraction[:6].ljust(6, "0")

        value = (
            f"{date_part}.{fraction}"
            f"{timezone_part}"
        )

    parsed = datetime.fromisoformat(value)

    # Keep all comparisons timezone-aware.
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed


@router.get("/summary")
def get_dashboard_summary(
    current_user: dict = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        now = datetime.now(timezone.utc)

        today_start = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        month_start = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        trend_start = today_start - timedelta(days=6)

        # ---------------------------------------------------------
        # SALES
        # ---------------------------------------------------------

        sales_response = (
            supabase.table("sales")
            .select(
                "id, invoice_number, customer_id, subtotal, "
                "discount, total, status, created_at"
            )
            .gte(
                "created_at",
                trend_start.isoformat(),
            )
            .order("created_at", desc=True)
            .execute()
        )

        sales = sales_response.data or []

        completed_sales = [
            sale
            for sale in sales
            if sale["status"] == "completed"
        ]

        today_sales = sum(
            money(sale["total"])
            for sale in completed_sales
            if parse_timestamp(
                sale["created_at"]
            )
            >= today_start
        )

        monthly_revenue = sum(
            money(sale["total"])
            for sale in completed_sales
            if parse_timestamp(
                sale["created_at"]
            )
            >= month_start
        )

        # ---------------------------------------------------------
        # MONTHLY EXPENSES
        # ---------------------------------------------------------

        expenses_response = (
            supabase.table("expenses")
            .select("amount, expense_date")
            .gte(
                "expense_date",
                month_start.date().isoformat(),
            )
            .execute()
        )

        monthly_expenses = sum(
            money(expense["amount"])
            for expense in (
                expenses_response.data or []
            )
        )

        # ---------------------------------------------------------
        # ESTIMATED PROFIT
        #
        # Current simple estimate:
        # monthly revenue - monthly operational expenses.
        # ---------------------------------------------------------

        estimated_profit = (
            monthly_revenue - monthly_expenses
        )

        # ---------------------------------------------------------
        # OUTSTANDING BALANCE
        # ---------------------------------------------------------

        all_completed_sales_response = (
            supabase.table("sales")
            .select("id, total")
            .eq("status", "completed")
            .execute()
        )

        all_completed_sales = (
            all_completed_sales_response.data or []
        )

        payments_response = (
            supabase.table("payments")
            .select("sale_id, amount")
            .execute()
        )

        payments_by_sale = defaultdict(float)

        for payment in payments_response.data or []:
            payments_by_sale[
                payment["sale_id"]
            ] += money(payment["amount"])

        outstanding_balance = 0.0

        for sale in all_completed_sales:
            remaining = (
                money(sale["total"])
                - payments_by_sale.get(
                    sale["id"],
                    0.0,
                )
            )

            if remaining > 0:
                outstanding_balance += remaining

        # ---------------------------------------------------------
        # LOW STOCK
        # ---------------------------------------------------------

        products_response = (
            supabase.table("products")
            .select(
                "id, name, sku, stock_quantity, "
                "minimum_stock, image_url, is_active"
            )
            .eq("is_active", True)
            .order("stock_quantity")
            .execute()
        )

        products = products_response.data or []

        low_stock_products = [
            {
                "id": product["id"],
                "name": product["name"],
                "sku": product["sku"],
                "stock_quantity": (
                    product["stock_quantity"]
                ),
                "minimum_stock": (
                    product["minimum_stock"]
                ),
                "image_url": product["image_url"],
            }
            for product in products
            if (
                product["stock_quantity"]
                <= product["minimum_stock"]
            )
        ]

        # ---------------------------------------------------------
        # 7-DAY SALES TREND
        # ---------------------------------------------------------

        trend_map = {}

        for offset in range(7):
            day = trend_start + timedelta(
                days=offset
            )

            key = day.date().isoformat()

            trend_map[key] = {
                "date": key,
                "revenue": 0.0,
                "sales": 0,
            }

        for sale in completed_sales:
            sale_date = (
                parse_timestamp(
                    sale["created_at"]
                )
                .date()
                .isoformat()
            )

            if sale_date in trend_map:
                trend_map[sale_date][
                    "revenue"
                ] += money(sale["total"])

                trend_map[sale_date]["sales"] += 1

        sales_trend = list(
            trend_map.values()
        )

        # ---------------------------------------------------------
        # RECENT SALES
        # ---------------------------------------------------------

        recent_sales_response = (
            supabase.table("sales")
            .select(
                "id, invoice_number, customer_id, "
                "total, status, created_at"
            )
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        recent_sales_raw = (
            recent_sales_response.data or []
        )

        customer_ids = list(
            {
                sale["customer_id"]
                for sale in recent_sales_raw
                if sale["customer_id"]
            }
        )

        customers_by_id = {}

        if customer_ids:
            customers_response = (
                supabase.table("customers")
                .select("id, name")
                .in_("id", customer_ids)
                .execute()
            )

            customers_by_id = {
                customer["id"]: customer["name"]
                for customer in (
                    customers_response.data or []
                )
            }

        recent_sales = [
            {
                "id": sale["id"],
                "invoice_number": (
                    sale["invoice_number"]
                ),
                "customer_name": (
                    customers_by_id.get(
                        sale["customer_id"],
                        "Walk-in Customer",
                    )
                ),
                "total": money(sale["total"]),
                "status": sale["status"],
                "created_at": sale["created_at"],
            }
            for sale in recent_sales_raw
        ]

        return {
            "summary": {
                "today_sales": round(
                    today_sales,
                    2,
                ),
                "monthly_revenue": round(
                    monthly_revenue,
                    2,
                ),
                "monthly_expenses": round(
                    monthly_expenses,
                    2,
                ),
                "estimated_profit": round(
                    estimated_profit,
                    2,
                ),
                "outstanding_balance": round(
                    outstanding_balance,
                    2,
                ),
                "low_stock_count": len(
                    low_stock_products
                ),
            },
            "sales_trend": sales_trend,
            "recent_sales": recent_sales,
            "low_stock_products": (
                low_stock_products[:5]
            ),
        }

    except Exception as exc:
        print(f"Dashboard error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load dashboard data.",
        )