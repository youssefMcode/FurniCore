import { POSWorkspace } from "@/components/pos/pos-workspace";
import { getProducts } from "@/lib/api/products";
import { getCustomers } from "@/lib/api/customers";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const [products, customers] = await Promise.all([
    getProducts(),
    getCustomers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#242624] sm:text-3xl">
          Point of Sale
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Create a sale, collect payment and update inventory.
        </p>
      </div>

      <POSWorkspace
        products={products.filter(
          (product) =>
            product.is_active &&
            product.stock_quantity > 0,
        )}
        customers={customers}
      />
    </div>
  );
}