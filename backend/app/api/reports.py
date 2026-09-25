from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import require_admin
from app.core.supabase import supabase

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


def parse_timestamp(value: str) -> datetime:
    """
    Safely parse PostgreSQL/Supabase timestamps.

    Supabase can return fractional seconds with different lengths,
    so we normalize them to Python's supported microsecond precision.
    """
    if not value:
        raise ValueError("Timestamp is empty.")

    value = value.strip()

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"

    date_part, time_part = value.split("T", 1)

    timezone_part = ""

    # Extract timezone from the time portion.
    if "+" in time_part:
        time_value, tz_value = time_part.rsplit("+", 1)
        timezone_part = f"+{tz_value}"
    else:
        # Handle negative timezone offsets, while avoiding the
        # hyphens that belong to the date portion.
        minus_index = time_part.rfind("-")

        if minus_index > 0:
            time_value = time_part[:minus_index]
            timezone_part = time_part[minus_index:]
        else:
            time_value = time_part

    # Normalize fractional seconds to exactly 6 digits max.
    if "." in time_value:
        seconds, fraction = time_value.split(".", 1)
        fraction = fraction[:6].ljust(6, "0")
        time_value = f"{seconds}.{fraction}"

    normalized = (
        f"{date_part}T"
        f"{time_value}"
        f"{timezone_part}"
    )

    return datetime.fromisoformat(normalized)


def money(value) -> float:
    return round(float(value or 0), 2)


def start_of_day_utc(value: date) -> str:
    dt = datetime.combine(
        value,
        time.min,
        tzinfo=timezone.utc,
    )
    return dt.isoformat()


def end_of_day_utc(value: date) -> str:
    dt = datetime.combine(
        value,
        time.max,
        tzinfo=timezone.utc,
    )
    return dt.isoformat()


@router.get("")
def get_reports(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: dict = Depends(require_admin),
):
    try:
        # -----------------------------------
        # Date range
        # -----------------------------------

        today = date.today()

        report_end = end_date or today
        report_start = start_date or (
            report_end - timedelta(days=29)
        )

        if report_start > report_end:
            raise HTTPException(
                status_code=400,
                detail="Start date cannot be after end date.",
            )

        if report_end > today:
            raise HTTPException(
                status_code=400,
                detail="End date cannot be in the future.",
            )

        start_timestamp = start_of_day_utc(report_start)
        end_timestamp = end_of_day_utc(report_end)

        # -----------------------------------
        # Sales created during selected range
        # -----------------------------------

        sales_response = (
            supabase.table("sales")
            .select(
                "id, total, status, created_at, "
                "sale_items("
                "product_id, quantity, line_total, "
                "products(id, name, sku)"
                "), "
                "payments(amount)"
            )
            .gte("created_at", start_timestamp)
            .lte("created_at", end_timestamp)
            .execute()
        )

        sales = sales_response.data or []

        # -----------------------------------
        # Returns processed during range
        #
        # IMPORTANT:
        # Query independently from sales.
        # A sale may have been created before
        # this reporting period but refunded
        # during this reporting period.
        # -----------------------------------

        returns_response = (
            supabase.table("returns")
            .select(
                "id, sale_id, refund_amount, created_at"
            )
            .gte("created_at", start_timestamp)
            .lte("created_at", end_timestamp)
            .execute()
        )

        returns = returns_response.data or []

        # -----------------------------------
        # Expenses
        # -----------------------------------

        expenses_response = (
            supabase.table("expenses")
            .select(
                "id, category, amount, expense_date"
            )
            .gte("expense_date", report_start.isoformat())
            .lte("expense_date", report_end.isoformat())
            .execute()
        )

        expenses = expenses_response.data or []

        # -----------------------------------
        # Current inventory snapshot
        # -----------------------------------

        products_response = (
            supabase.table("products")
            .select(
                "id, name, sku, "
                "stock_quantity, minimum_stock, is_active"
            )
            .eq("is_active", True)
            .execute()
        )

        products = products_response.data or []

        # -----------------------------------
        # Completed sales
        # -----------------------------------

        completed_sales = [
            sale
            for sale in sales
            if sale.get("status") == "completed"
        ]

        gross_sales = sum(
            money(sale.get("total"))
            for sale in completed_sales
        )

        sales_count = len(completed_sales)

        average_sale = (
            gross_sales / sales_count
            if sales_count > 0
            else 0
        )

        # -----------------------------------
        # Refunds
        # -----------------------------------

        total_refunds = sum(
            money(item.get("refund_amount"))
            for item in returns
        )

        net_sales = gross_sales - total_refunds

        # -----------------------------------
        # Expenses
        # -----------------------------------

        total_expenses = sum(
            money(expense.get("amount"))
            for expense in expenses
        )

        # This is intentionally called
        # "net revenue", not accounting profit.
        net_revenue = net_sales - total_expenses

        # -----------------------------------
        # Outstanding balances
        # -----------------------------------

        outstanding_balance = 0.0

        for sale in completed_sales:
            paid_amount = sum(
                money(payment.get("amount"))
                for payment in (
                    sale.get("payments") or []
                )
            )

            sale_total = money(sale.get("total"))

            outstanding_balance += max(
                sale_total - paid_amount,
                0,
            )

        # -----------------------------------
        # Sales trend
        # -----------------------------------

        trend_map = {}

        current_date = report_start

        while current_date <= report_end:
            key = current_date.isoformat()

            trend_map[key] = {
                "date": key,
                "sales": 0.0,
                "refunds": 0.0,
                "net_sales": 0.0,
            }

            current_date += timedelta(days=1)

        # Gross sales by original sale date.
        for sale in completed_sales:
            created_at = sale.get("created_at")

            if not created_at:
                continue

            sale_date = (
                parse_timestamp(created_at)
                .date()
                .isoformat()
            )

            if sale_date in trend_map:
                trend_map[sale_date]["sales"] += money(
                    sale.get("total")
                )

        # Refunds by actual return date.
        for return_row in returns:
            created_at = return_row.get("created_at")

            if not created_at:
                continue

            return_date = (
                parse_timestamp(created_at)
                .date()
                .isoformat()
            )

            if return_date in trend_map:
                trend_map[return_date][
                    "refunds"
                ] += money(
                    return_row.get("refund_amount")
                )

        for item in trend_map.values():
            item["sales"] = round(
                item["sales"],
                2,
            )

            item["refunds"] = round(
                item["refunds"],
                2,
            )

            item["net_sales"] = round(
                item["sales"] - item["refunds"],
                2,
            )

        sales_trend = list(trend_map.values())

        # -----------------------------------
        # Top products
        # -----------------------------------

        product_totals = {}

        for sale in completed_sales:
            for item in sale.get("sale_items") or []:
                product = item.get("products")

                if not product:
                    continue

                product_id = (
                    product.get("id")
                    or item.get("product_id")
                )

                if not product_id:
                    continue

                if product_id not in product_totals:
                    product_totals[product_id] = {
                        "product_id": product_id,
                        "name": product.get(
                            "name",
                            "Unknown product",
                        ),
                        "sku": product.get(
                            "sku",
                            "",
                        ),
                        "quantity_sold": 0,
                        "revenue": 0.0,
                    }

                product_totals[product_id][
                    "quantity_sold"
                ] += int(
                    item.get("quantity") or 0
                )

                product_totals[product_id][
                    "revenue"
                ] += money(
                    item.get("line_total")
                )

        top_products = sorted(
            product_totals.values(),
            key=lambda item: item["revenue"],
            reverse=True,
        )[:10]

        for item in top_products:
            item["revenue"] = round(
                item["revenue"],
                2,
            )

        # -----------------------------------
        # Expense breakdown
        # -----------------------------------

        expense_totals = {}

        for expense in expenses:
            category = (
                expense.get("category")
                or "other"
            )

            expense_totals[category] = (
                expense_totals.get(category, 0)
                + money(expense.get("amount"))
            )

        expense_breakdown = [
            {
                "category": category,
                "amount": round(amount, 2),
            }
            for category, amount
            in expense_totals.items()
        ]

        expense_breakdown.sort(
            key=lambda item: item["amount"],
            reverse=True,
        )

        # -----------------------------------
        # Low-stock products
        # -----------------------------------

        low_stock = []

        for product in products:
            stock_quantity = int(
                product.get("stock_quantity") or 0
            )

            minimum_stock = int(
                product.get("minimum_stock") or 0
            )

            if stock_quantity <= minimum_stock:
                low_stock.append(
                    {
                        "id": product["id"],
                        "name": product["name"],
                        "sku": product["sku"],
                        "stock_quantity": stock_quantity,
                        "minimum_stock": minimum_stock,
                    }
                )

        low_stock.sort(
            key=lambda item: (
                item["stock_quantity"]
                - item["minimum_stock"]
            )
        )

        # -----------------------------------
        # Final response
        # -----------------------------------

        return {
            "start_date": report_start.isoformat(),
            "end_date": report_end.isoformat(),
            "summary": {
                "gross_sales": round(
                    gross_sales,
                    2,
                ),
                "refunds": round(
                    total_refunds,
                    2,
                ),
                "net_sales": round(
                    net_sales,
                    2,
                ),
                "expenses": round(
                    total_expenses,
                    2,
                ),
                "net_revenue": round(
                    net_revenue,
                    2,
                ),
                "outstanding_balance": round(
                    outstanding_balance,
                    2,
                ),
                "sales_count": sales_count,
                "average_sale": round(
                    average_sale,
                    2,
                ),
            },
            "sales_trend": sales_trend,
            "top_products": top_products,
            "expense_breakdown": expense_breakdown,
            "low_stock": low_stock,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print("Reports error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to generate reports.",
        )