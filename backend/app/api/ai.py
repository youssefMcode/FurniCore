from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from openai import OpenAI

from app.core.auth import require_admin
from app.core.config import OPENAI_API_KEY
from app.schemas.ai import (
    BusinessAssistantRequest,
    BusinessAssistantResponse,
    ProductDescriptionRequest,
    ProductDescriptionResponse,
)
import json
from datetime import date, datetime, timedelta, timezone
from app.core.supabase import get_supabase_client


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


@router.post(
    "/product-description",
    response_model=ProductDescriptionResponse,
)
def generate_product_description(
    payload: ProductDescriptionRequest,
    current_user: dict = Depends(require_admin),
):
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured.",
        )

    name = payload.name.strip()
    category = payload.category.strip()

    if not name or not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name and category are required.",
        )

    try:
        client = OpenAI(
            api_key=OPENAI_API_KEY,
        )

        response = client.responses.create(
            model="gpt-5.4-mini",
            instructions=(
                "You write concise, professional furniture "
                "product descriptions for a furniture showroom. "
                "Use only the product information provided. "
                "Never invent dimensions, materials, colors, "
                "brands, warranties, prices, features, or "
                "technical specifications that were not provided. "
                "Write one polished paragraph of approximately "
                "45 to 70 words. "
                "Do not use markdown, headings, bullet points, "
                "quotation marks, or exaggerated marketing claims."
            ),
            input=(
                f"Product name: {name}\n"
                f"Category: {category}\n"
                f"Customizable: "
                f"{'Yes' if payload.is_customizable else 'No'}"
            ),
            max_output_tokens=200,
        )

        description = response.output_text.strip()

        if not description:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI did not generate a description.",
            )

        return {
            "description": description,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "AI product description error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Unable to generate a product description "
                "right now."
            ),
        )


@router.post(
    "/business-assistant",
    response_model=BusinessAssistantResponse,
)
def ask_business_assistant(
    payload: BusinessAssistantRequest,
    current_user: dict = Depends(require_admin),
):
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured.",
        )

    question = payload.question.strip()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is required.",
        )

    try:
        supabase = get_supabase_client()

        # -----------------------------------
        # Reporting period: last 30 days
        # -----------------------------------

        now = datetime.now(timezone.utc)
        start = now - timedelta(days=30)

        # -----------------------------------
        # Sales
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
            .gte("created_at", start.isoformat())
            .execute()
        )

        completed_sales = [
            sale
            for sale in (sales_response.data or [])
            if sale.get("status") == "completed"
        ]

        gross_sales = sum(
            float(sale.get("total") or 0)
            for sale in completed_sales
        )

        # -----------------------------------
        # Payments / outstanding balance
        # -----------------------------------

        outstanding_balance = 0.0

        for sale in completed_sales:
            paid = sum(
                float(payment.get("amount") or 0)
                for payment in (
                    sale.get("payments") or []
                )
            )

            outstanding_balance += max(
                float(sale.get("total") or 0) - paid,
                0,
            )

        # -----------------------------------
        # Returns
        # -----------------------------------

        returns_response = (
            supabase.table("returns")
            .select("refund_amount, created_at")
            .gte("created_at", start.isoformat())
            .execute()
        )

        refunds = sum(
            float(item.get("refund_amount") or 0)
            for item in (returns_response.data or [])
        )

        net_sales = gross_sales - refunds

        # -----------------------------------
        # Expenses
        # -----------------------------------

        start_date = start.date().isoformat()

        expenses_response = (
            supabase.table("expenses")
            .select("category, amount, expense_date")
            .gte("expense_date", start_date)
            .execute()
        )

        expenses = expenses_response.data or []

        total_expenses = sum(
            float(item.get("amount") or 0)
            for item in expenses
        )

        expense_totals: dict[str, float] = {}

        for expense in expenses:
            category = expense.get("category") or "other"

            expense_totals[category] = (
                expense_totals.get(category, 0)
                + float(expense.get("amount") or 0)
            )

        expense_breakdown = sorted(
            [
                {
                    "category": category,
                    "amount": round(amount, 2),
                }
                for category, amount
                in expense_totals.items()
            ],
            key=lambda item: item["amount"],
            reverse=True,
        )

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
                        "name": product.get(
                            "name",
                            "Unknown product",
                        ),
                        "sku": product.get("sku", ""),
                        "quantity_sold": 0,
                        "revenue": 0.0,
                    }

                product_totals[product_id][
                    "quantity_sold"
                ] += int(item.get("quantity") or 0)

                product_totals[product_id][
                    "revenue"
                ] += float(item.get("line_total") or 0)

        top_products = sorted(
            product_totals.values(),
            key=lambda item: item["revenue"],
            reverse=True,
        )[:5]

        for item in top_products:
            item["revenue"] = round(
                item["revenue"],
                2,
            )

        # -----------------------------------
        # Inventory
        # -----------------------------------

        products_response = (
            supabase.table("products")
            .select(
                "name, sku, stock_quantity, "
                "minimum_stock, is_active"
            )
            .eq("is_active", True)
            .execute()
        )

        products = products_response.data or []

        low_stock = []

        for product in products:
            stock = int(
                product.get("stock_quantity") or 0
            )

            minimum = int(
                product.get("minimum_stock") or 0
            )

            if stock <= minimum:
                low_stock.append(
                    {
                        "name": product.get("name"),
                        "sku": product.get("sku"),
                        "stock_quantity": stock,
                        "minimum_stock": minimum,
                    }
                )

        # -----------------------------------
        # Safe summarized AI context
        # -----------------------------------

        business_context = {
            "period": {
                "description": "Last 30 days",
                "start": start.date().isoformat(),
                "end": now.date().isoformat(),
            },
            "financial_summary": {
                "gross_sales": round(gross_sales, 2),
                "refunds": round(refunds, 2),
                "net_sales": round(net_sales, 2),
                "expenses": round(total_expenses, 2),
                "net_revenue": round(
                    net_sales - total_expenses,
                    2,
                ),
                "outstanding_balance": round(
                    outstanding_balance,
                    2,
                ),
                "completed_sales_count": len(
                    completed_sales
                ),
            },
            "top_products": top_products,
            "low_stock_products": low_stock[:10],
            "expense_breakdown": expense_breakdown,
            "inventory": {
                "active_products": len(products),
                "low_stock_count": len(low_stock),
            },
        }

        # -----------------------------------
        # OpenAI
        # -----------------------------------

        client = OpenAI(
            api_key=OPENAI_API_KEY,
        )

        response = client.responses.create(
            model="gpt-5.4-mini",
            instructions=(
                "You are FurniCore's AI Business Assistant. "
                "Answer questions about the furniture business "
                "using ONLY the FurniCore business data supplied "
                "with the question. "

                "Never invent sales, expenses, inventory values, "
                "customers, products, dates, forecasts, or other "
                "facts that are not supported by the supplied data. "

                "The supplied financial and sales metrics cover "
                "the last 30 days unless stated otherwise. "
                "Inventory values are the current inventory snapshot. "

                "If the user asks for information that cannot be "
                "answered from the supplied data, clearly say that "
                "the available FurniCore data does not provide "
                "enough information. "

                "Do not claim certainty about future business "
                "performance. You may suggest practical actions "
                "when they follow from the supplied data. "

                "Keep answers concise, useful, and easy for a "
                "business owner to understand. "
                "Do not use markdown tables."
            ),
            input=(
                "FurniCore business data:\n"
                f"{json.dumps(business_context)}\n\n"
                "User question:\n"
                f"{question}"
            ),
            max_output_tokens=500,
        )

        answer = response.output_text.strip()

        if not answer:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI did not return an answer.",
            )

        return {
            "answer": answer,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "AI business assistant error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Unable to answer the business question "
                "right now."
            ),
        )