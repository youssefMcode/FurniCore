"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";
import type { ProductImage } from "@/lib/api/products";

const MAX_IMAGES = 6;
const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface ExistingImagesProps {
  mode: "existing";
  productId: string;
  images: ProductImage[];
  onChanged: () => void;
}

interface NewImagesProps {
  mode: "new";
  files: File[];
  onFilesChange: (files: File[]) => void;
}

type ProductImagesManagerProps =
  | ExistingImagesProps
  | NewImagesProps;

export function ProductImagesManager(
  props: ProductImagesManagerProps,
) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const count =
    props.mode === "existing"
      ? props.images.length
      : props.files.length;

  function validateFiles(files: File[]) {
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return "Only JPEG, PNG and WebP images are allowed.";
      }

      if (file.size > MAX_SIZE) {
        return "Each image must be 5 MB or smaller.";
      }
    }

    if (count + files.length > MAX_IMAGES) {
      return `A product can have a maximum of ${MAX_IMAGES} images.`;
    }

    return null;
  }

  async function handleFiles(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selected = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (!selected.length) return;

    const validationError = validateFiles(selected);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    if (props.mode === "new") {
      props.onFilesChange([...props.files, ...selected]);
      return;
    }

    setUploading(true);

    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await authenticatedFetch(
          `/api/products/${props.productId}/images`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(await getApiError(response));
        }
      }

      props.onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload product images.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(imageId: string) {
    if (props.mode !== "existing") return;

    setBusyId(imageId);
    setError("");

    try {
      const response = await authenticatedFetch(
        `/api/products/${props.productId}/images/${imageId}/primary`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      props.onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change primary image.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteImage(imageId: string) {
    if (props.mode !== "existing") return;

    setBusyId(imageId);
    setError("");

    try {
      const response = await authenticatedFetch(
        `/api/products/${props.productId}/images/${imageId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      props.onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product image.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function removePending(index: number) {
    if (props.mode !== "new") return;

    props.onFilesChange(
      props.files.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  const sortedExistingImages =
    props.mode === "existing"
      ? [...props.images].sort((a, b) => {
          if (a.is_primary) return -1;
          if (b.is_primary) return 1;

          return a.sort_order - b.sort_order;
        })
      : [];

  return (
    <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-lg font-semibold text-[#242624]">
            Product images
          </h3>

          <p className="mt-1 text-sm text-[#73766F]">
            Add up to 6 images. The primary image is used
            throughout FurniCore.
          </p>
        </div>

        <span className="text-sm text-[#73766F]">
          {count}/{MAX_IMAGES}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {props.mode === "existing" &&
          sortedExistingImages.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-[#E5E2DA]"
            >
              <div className="relative aspect-[4/3] bg-[#F3F1EC]">
                <Image
                  src={image.image_url}
                  alt="Product"
                  fill
                  sizes="220px"
                  className="object-cover"
                />

                {image.is_primary && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#244A3D] px-2 py-1 text-[10px] font-semibold text-white">
                    <Star className="size-3 fill-current" />
                    Primary
                  </span>
                )}
              </div>

              <div className="flex gap-2 p-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId !== null}
                    onClick={() => setPrimary(image.id)}
                    className="min-w-0 flex-1"
                  >
                    {busyId === image.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Star className="size-3.5" />
                    )}
                    Primary
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId !== null}
                  onClick={() => deleteImage(image.id)}
                  className={image.is_primary ? "w-full" : ""}
                >
                  {busyId === image.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}

                  <span className="sr-only sm:not-sr-only">
                    Delete
                  </span>
                </Button>
              </div>
            </div>
          ))}

        {props.mode === "new" &&
          props.files.map((file, index) => {
            const preview = URL.createObjectURL(file);

            return (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="overflow-hidden rounded-xl border border-[#E5E2DA]"
              >
                <div className="relative aspect-[4/3] bg-[#F3F1EC]">
                  <Image
                    src={preview}
                    alt={file.name}
                    fill
                    unoptimized
                    sizes="220px"
                    className="object-cover"
                  />

                  {index === 0 && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#244A3D] px-2 py-1 text-[10px] font-semibold text-white">
                      <Star className="size-3 fill-current" />
                      Primary
                    </span>
                  )}
                </div>

                <div className="p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removePending(index)}
                    className="w-full"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}

        {count < MAX_IMAGES && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/3] min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-[#CFCBC2] bg-[#FAF9F6] px-4 text-center transition hover:border-[#244A3D] hover:bg-[#F4F7F5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-[#244A3D]" />
            ) : (
              <ImagePlus className="size-6 text-[#244A3D]" />
            )}

            <span className="mt-2 text-sm font-medium text-[#242624]">
              {uploading ? "Uploading..." : "Add images"}
            </span>

            <span className="mt-1 text-xs text-[#8A8D86]">
              JPEG, PNG or WebP
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {props.mode === "new" && props.files.length > 0 && (
        <p className="mt-4 text-xs text-[#73766F]">
          The first selected image will become the primary image.
          You can change it after creating the product.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}