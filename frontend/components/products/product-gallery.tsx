"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import type { ProductImage } from "@/lib/api/products";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const sortedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;

        return a.sort_order - b.sort_order;
      }),
    [images],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    sortedImages[0]?.id ?? null,
  );

  const selectedImage =
    sortedImages.find((image) => image.id === selectedId) ??
    sortedImages[0];

  if (!selectedImage) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-[#E5E2DA] bg-[#F3F1EC]">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#244A3D] shadow-sm">
            <ImageIcon className="size-6" />
          </div>

          <p className="mt-3 text-sm text-[#73766F]">
            No product images
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F3F1EC]">
        <Image
          src={selectedImage.image_url}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 520px"
          className="object-cover"
        />

        {selectedImage.is_primary && (
          <span className="absolute left-3 top-3 rounded-full bg-[#244A3D] px-3 py-1 text-xs font-medium text-white shadow-sm">
            Primary
          </span>
        )}
      </div>

      {sortedImages.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {sortedImages.map((image) => {
            const selected = image.id === selectedImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedId(image.id)}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                  selected
                    ? "border-[#244A3D]"
                    : "border-transparent hover:border-[#C8C6BF]"
                }`}
                aria-label="View product image"
              >
                <Image
                  src={image.image_url}
                  alt=""
                  fill
                  sizes="90px"
                  className="object-cover"
                />

                {image.is_primary && (
                  <span className="absolute bottom-1 right-1 rounded bg-[#244A3D] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    MAIN
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}