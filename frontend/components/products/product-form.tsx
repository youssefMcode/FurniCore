"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
} from "lucide-react";

import { ProductImagesManager } from "@/components/products/product-images-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateProductDescription } from "@/lib/api/ai";
import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";
import type {
  Category,
  Product,
} from "@/lib/api/products";

interface ProductFormProps {
  categories: Category[];
  product?: Product;
}

export function ProductForm({
  categories,
  product,
}: ProductFormProps) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");

  const [categoryId, setCategoryId] = useState(
    product?.category_id ??
      product?.categories?.id ??
      "",
  );

  const [description, setDescription] = useState(
    product?.description ?? "",
  );

  const [costPrice, setCostPrice] = useState(
    product?.cost_price?.toString() ?? "",
  );

  const [sellingPrice, setSellingPrice] = useState(
    product?.selling_price?.toString() ?? "",
  );

  const [stockQuantity, setStockQuantity] = useState(
    product?.stock_quantity?.toString() ?? "0",
  );

  const [minimumStock, setMinimumStock] = useState(
    product?.minimum_stock?.toString() ?? "0",
  );

  const [customizable, setCustomizable] = useState(
    product?.is_customizable ?? false,
  );

  const [active, setActive] = useState(
    product?.is_active ?? true,
  );

  const [pendingImages, setPendingImages] = useState<File[]>(
    [],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [generatingDescription, setGeneratingDescription] =
  useState(false);

const [aiError, setAiError] = useState("");

  async function uploadPendingImages(productId: string) {
    for (const file of pendingImages) {
      const formData = new FormData();

      formData.append("file", file);

      const response = await authenticatedFetch(
        `/api/products/${productId}/images`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }
    }
  }

  async function handleGenerateDescription() {
  setAiError("");

  if (!name.trim()) {
    setAiError(
      "Enter a product name before generating a description.",
    );
    return;
  }

  if (!categoryId) {
    setAiError(
      "Select a category before generating a description.",
    );
    return;
  }

  const category = categories.find(
    (item) => item.id === categoryId,
  );

  if (!category) {
    setAiError("Selected category could not be found.");
    return;
  }

  setGeneratingDescription(true);

  try {
    const generated = await generateProductDescription({
      name: name.trim(),
      category: category.name,
      is_customizable: customizable,
    });

    setDescription(generated);
  } catch (err) {
    setAiError(
      err instanceof Error
        ? err.message
        : "Unable to generate a description.",
    );
  } finally {
    setGeneratingDescription(false);
  }
}

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim() || !sku.trim() || !categoryId) {
      setError("Name, SKU and category are required.");
      return;
    }

    const cost = Number(costPrice);
    const selling = Number(sellingPrice);
    const minimum = Number(minimumStock);
    const stock = Number(stockQuantity);

    if (
      Number.isNaN(cost) ||
      Number.isNaN(selling) ||
      cost < 0 ||
      selling < 0
    ) {
      setError("Please enter valid product prices.");
      return;
    }

    if (!Number.isInteger(minimum) || minimum < 0) {
      setError(
        "Minimum stock must be a valid whole number.",
      );
      return;
    }

    if (
      !editing &&
      (!Number.isInteger(stock) || stock < 0)
    ) {
      setError(
        "Initial stock must be a valid whole number.",
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category_id: categoryId,
        description: description.trim() || null,
        cost_price: cost,
        selling_price: selling,
        minimum_stock: minimum,
        is_customizable: customizable,
        is_active: active,

        ...(!editing
          ? {
              stock_quantity: stock,
            }
          : {}),
      };

      const response = await authenticatedFetch(
        editing
          ? `/api/products/${product!.id}`
          : "/api/products",
        {
          method: editing ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

      const savedProduct = await response.json();

      if (!editing && pendingImages.length > 0) {
        await uploadPendingImages(savedProduct.id);
      }

      router.push(`/products/${savedProduct.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <FormSection
        title="Product information"
        description="Basic information used throughout FurniCore."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Product name" required>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Modern Corner Sofa"
              required
            />
          </Field>

          <Field label="SKU" required>
            <Input
              value={sku}
              onChange={(event) =>
                setSku(event.target.value.toUpperCase())
              }
              placeholder="SOFA-001"
              required
            />
          </Field>

          <Field label="Category" required>
            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              required
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-[#244A3D]"
            >
              <option value="">
                Select a category
              </option>

              {categories
                .filter(
                  (category) =>
                    category.is_active ||
                    category.id === categoryId,
                )
                .map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                    {!category.is_active
                      ? " (Inactive)"
                      : ""}
                  </option>
                ))}
            </select>
          </Field>

          <div />

        <div className="sm:col-span-2">
  <Field label="Description">
    <Textarea
      value={description}
      onChange={(event) =>
        setDescription(event.target.value)
      }
      placeholder="Describe the furniture product..."
      rows={5}
    />

    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1.5 text-xs text-[#73766F]">
        <Sparkles className="size-3.5 text-[#B8895B]" />
        Generate a professional description using product
        information.
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={generatingDescription || saving}
        onClick={handleGenerateDescription}
        className="w-full sm:w-auto"
      >
        {generatingDescription ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}

        {generatingDescription
          ? "Generating..."
          : description.trim()
            ? "Regenerate with AI"
            : "Generate with AI"}
      </Button>
    </div>

    {aiError && (
      <div
        role="alert"
        className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {aiError}
      </div>
    )}
  </Field>
</div>
        </div>
      </FormSection>

      <ProductImagesManager
        mode="new"
        files={pendingImages}
        onFilesChange={setPendingImages}
      />

      {editing && (
        <p className="-mt-3 text-xs text-[#73766F]">
          Existing product images are managed from the product
          details page after saving changes.
        </p>
      )}

      <FormSection
        title="Pricing & inventory"
        description={
          editing
            ? "Update pricing and the minimum-stock alert level. Current stock is managed from Inventory."
            : "Set product pricing and its opening inventory quantity."
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Cost price" required>
            <MoneyInput
              value={costPrice}
              onChange={setCostPrice}
            />
          </Field>

          <Field label="Selling price" required>
            <MoneyInput
              value={sellingPrice}
              onChange={setSellingPrice}
            />
          </Field>

          {!editing ? (
            <Field label="Initial stock" required>
              <Input
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(event) =>
                  setStockQuantity(event.target.value)
                }
              />
            </Field>
          ) : (
            <Field label="Current stock">
              <div className="flex h-9 items-center rounded-lg border border-[#E5E2DA] bg-[#F8F7F3] px-3 text-sm text-[#73766F]">
                {product?.stock_quantity ?? 0} units
              </div>

              <p className="mt-1.5 text-xs text-[#9A9C96]">
                Change stock from Inventory.
              </p>
            </Field>
          )}

          <Field label="Minimum stock" required>
            <Input
              type="number"
              min="0"
              step="1"
              value={minimumStock}
              onChange={(event) =>
                setMinimumStock(event.target.value)
              }
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Product behavior"
        description="Control customization and catalog availability."
      >
        <div className="divide-y divide-[#EEECE6]">
          <ToggleRow
            title="Customizable furniture"
            description="Allow dimensions, color, fabric, material, configuration and customer notes during POS."
            checked={customizable}
            onChange={setCustomizable}
          />

          <ToggleRow
            title="Active product"
            description="Inactive products remain in historical records but cannot be used normally for new sales."
            checked={active}
            onChange={setActive}
          />
        </div>
      </FormSection>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => router.back()}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="bg-[#244A3D] text-white hover:bg-[#19372D]"
        >
          {saving && (
            <Loader2 className="size-4 animate-spin" />
          )}

          {saving
            ? editing
              ? "Saving..."
              : "Creating & uploading..."
            : editing
              ? "Save Changes"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#242624]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-[#73766F]">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#242624]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#73766F]">
        $
      </span>

      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="pl-7"
        required
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-5 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-[#242624]">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-sm leading-5 text-[#73766F]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#244A3D]"
            : "bg-[#D7D6D1]"
        }`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}