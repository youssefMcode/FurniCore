"use client";

import { useRouter } from "next/navigation";

import { ProductImagesManager } from "@/components/products/product-images-manager";
import type { ProductImage } from "@/lib/api/products";

interface Props {
  productId: string;
  images: ProductImage[];
}

export function ProductImagesManagerWrapper({
  productId,
  images,
}: Props) {
  const router = useRouter();

  return (
    <ProductImagesManager
      mode="existing"
      productId={productId}
      images={images}
      onChanged={() => router.refresh()}
    />
  );
}