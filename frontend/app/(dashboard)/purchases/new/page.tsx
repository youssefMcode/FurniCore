import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getSuppliers } from "@/lib/api/suppliers";
import { getProducts } from "@/lib/api/products";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const [suppliers, allProducts] = await Promise.all([
    getSuppliers(),
    getProducts(),
  ]);

  const products = allProducts.filter(
    (product) => product.is_active,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/purchases"
          className="inline-flex items-center gap-2 text-sm text-[#73766F] hover:text-[#244A3D]"
        >
          <ArrowLeft className="size-4" />
          Purchases
        </Link>

        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          New Purchase
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Record furniture received from a supplier.
        </p>
      </div>

      <PurchaseForm
        suppliers={suppliers}
        products={products}
      />
    </div>
  );
}