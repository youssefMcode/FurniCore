from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user, require_admin
from app.core.supabase import supabase
from app.schemas.product import ProductCreate, ProductUpdate


router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


@router.get("")
def list_products(
    search: str | None = Query(default=None),
    category_id: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    try:
        query = (
            supabase.table("products")
            .select(
    "id, name, sku, description, "
    "cost_price, selling_price, stock_quantity, "
    "minimum_stock, is_customizable, is_active, "
    "created_at, updated_at, "
    "categories(id, name), "
    "product_images(id, image_url, storage_path, is_primary, sort_order)"
)
            .order("created_at", desc=True)
        )

        if category_id:
            query = query.eq("category_id", category_id)

        if active is not None:
            query = query.eq("is_active", active)

        response = query.execute()
        products = response.data or []

        if search:
            search_value = search.strip().lower()

            products = [
                product
                for product in products
                if search_value in product["name"].lower()
                or search_value in product["sku"].lower()
            ]

        return products

    except Exception as exc:
        print(f"Products list error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load products.",
        )


@router.get("/{product_id}")
def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase.table("products")
           .select(
    "id, category_id, name, sku, description, "
    "cost_price, selling_price, "
    "stock_quantity, minimum_stock, "
    "is_customizable, is_active, created_at, "
    "updated_at, categories(id, name), "
    "product_images(id, image_url, storage_path, is_primary, sort_order)"
)
            .eq("id", product_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        return response.data

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Product details error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load product.",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: dict = Depends(require_admin),
):
    try:
        category_response = (
            supabase.table("categories")
            .select("id, is_active")
            .eq("id", payload.category_id)
            .single()
            .execute()
        )

        category = category_response.data

        if not category or not category["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please select an active category.",
            )

        existing_sku = (
            supabase.table("products")
            .select("id")
            .eq("sku", payload.sku.strip())
            .execute()
        )

        if existing_sku.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A product with this SKU already exists.",
            )

        product_data = payload.model_dump(mode="json")

        product_data["name"] = payload.name.strip()
        product_data["sku"] = payload.sku.strip().upper()

        if payload.description:
            product_data["description"] = payload.description.strip()

        response = (
            supabase.table("products")
            .insert(product_data)
            .execute()
        )

        product = response.data[0]

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "created product",
                "entity_type": "product",
                "entity_id": product["id"],
            }
        ).execute()

        return product

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Create product error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create product.",
        )


@router.patch("/{product_id}")
def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: dict = Depends(require_admin),
):
    try:
        existing_response = (
            supabase.table("products")
            .select("id")
            .eq("id", product_id)
            .single()
            .execute()
        )

        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        update_data = payload.model_dump(
            exclude_unset=True,
            mode="json",
        )

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No product changes were provided.",
            )

        if "category_id" in update_data:
            category_response = (
                supabase.table("categories")
                .select("id, is_active")
                .eq("id", update_data["category_id"])
                .single()
                .execute()
            )

            category = category_response.data

            if not category or not category["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please select an active category.",
                )

        if "sku" in update_data:
            normalized_sku = update_data["sku"].strip().upper()

            sku_response = (
                supabase.table("products")
                .select("id")
                .eq("sku", normalized_sku)
                .execute()
            )

            duplicate = any(
                product["id"] != product_id
                for product in (sku_response.data or [])
            )

            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A product with this SKU already exists.",
                )

            update_data["sku"] = normalized_sku

        if "name" in update_data:
            update_data["name"] = update_data["name"].strip()

        if (
            "description" in update_data
            and update_data["description"]
        ):
            update_data["description"] = (
                update_data["description"].strip()
            )

        response = (
            supabase.table("products")
            .update(update_data)
            .eq("id", product_id)
            .execute()
        )

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "updated product",
                "entity_type": "product",
                "entity_id": product_id,
            }
        ).execute()

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Update product error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update product.",
        )