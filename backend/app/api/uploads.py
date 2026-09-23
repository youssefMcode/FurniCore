import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.auth import require_admin
from app.core.supabase import supabase


router = APIRouter(
    prefix="/api/products",
    tags=["Product Images"],
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024

MAX_PRODUCT_IMAGES = 6


def get_product_or_404(product_id: str):
    response = (
        supabase.table("products")
        .select("id")
        .eq("id", product_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return response.data[0]


@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
):
    get_product_or_404(product_id)

    existing_response = (
        supabase.table("product_images")
        .select("id, is_primary, sort_order")
        .eq("product_id", product_id)
        .execute()
    )

    existing_images = existing_response.data or []

    if len(existing_images) >= MAX_PRODUCT_IMAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product can have a maximum of 6 images.",
        )

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG and WebP images are allowed.",
        )

    contents = await file.read()

    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be 5 MB or smaller.",
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]

    storage_path = (
        f"products/{product_id}/{uuid.uuid4()}{extension}"
    )

    try:
        supabase.storage.from_("product-images").upload(
            path=storage_path,
            file=contents,
            file_options={
                "content-type": file.content_type,
                "upsert": "false",
            },
        )

        public_url = (
            supabase.storage
            .from_("product-images")
            .get_public_url(storage_path)
        )

        # First image automatically becomes primary.
        is_primary = len(existing_images) == 0

        next_sort_order = (
            max(
                [
                    image["sort_order"]
                    for image in existing_images
                ],
                default=-1,
            )
            + 1
        )

        image_response = (
            supabase.table("product_images")
            .insert(
                {
                    "product_id": product_id,
                    "image_url": public_url,
                    "storage_path": storage_path,
                    "is_primary": is_primary,
                    "sort_order": next_sort_order,
                }
            )
            .execute()
        )

        image = image_response.data[0]

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "uploaded product image",
                "entity_type": "product",
                "entity_id": product_id,
            }
        ).execute()

        return image

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Product image upload error: {exc}")

        # Prevent an orphaned Storage file if DB insert fails.
        try:
            supabase.storage.from_("product-images").remove(
                [storage_path]
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload product image.",
        )


@router.patch("/{product_id}/images/{image_id}/primary")
def set_primary_product_image(
    product_id: str,
    image_id: str,
    current_user: dict = Depends(require_admin),
):
    get_product_or_404(product_id)

    try:
        image_response = (
            supabase.table("product_images")
            .select("id")
            .eq("id", image_id)
            .eq("product_id", product_id)
            .execute()
        )

        if not image_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product image not found.",
            )

        # Important because DB allows only one primary image.
        supabase.table("product_images").update(
            {"is_primary": False}
        ).eq(
            "product_id", product_id
        ).eq(
            "is_primary", True
        ).execute()

        response = (
            supabase.table("product_images")
            .update({"is_primary": True})
            .eq("id", image_id)
            .eq("product_id", product_id)
            .execute()
        )

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "changed primary product image",
                "entity_type": "product",
                "entity_id": product_id,
            }
        ).execute()

        return response.data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Set primary image error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to change primary image.",
        )


@router.delete("/{product_id}/images/{image_id}")
def delete_product_image(
    product_id: str,
    image_id: str,
    current_user: dict = Depends(require_admin),
):
    get_product_or_404(product_id)

    try:
        response = (
            supabase.table("product_images")
            .select(
                "id, storage_path, is_primary, sort_order"
            )
            .eq("id", image_id)
            .eq("product_id", product_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product image not found.",
            )

        image = response.data[0]

        supabase.storage.from_("product-images").remove(
            [image["storage_path"]]
        )

        supabase.table("product_images").delete().eq(
            "id", image_id
        ).execute()

        # If primary was deleted, make the first remaining image primary.
        if image["is_primary"]:
            remaining_response = (
                supabase.table("product_images")
                .select("id")
                .eq("product_id", product_id)
                .order("sort_order")
                .limit(1)
                .execute()
            )

            remaining = remaining_response.data or []

            if remaining:
                supabase.table("product_images").update(
                    {"is_primary": True}
                ).eq(
                    "id", remaining[0]["id"]
                ).execute()

        supabase.table("audit_logs").insert(
            {
                "user_id": current_user["id"],
                "action": "deleted product image",
                "entity_type": "product",
                "entity_id": product_id,
            }
        ).execute()

        return {
            "message": "Product image deleted successfully."
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Delete product image error: {exc}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete product image.",
        )