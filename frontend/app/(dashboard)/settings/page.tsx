import { redirect } from "next/navigation";

import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { getBusinessSettings } from "@/lib/api/business-settings";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser =
    await getCurrentUserProfile();

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const settings =
    await getBusinessSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Business Settings
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Manage your showroom information and
          business preferences.
        </p>
      </div>

      <BusinessSettingsForm
        settings={settings}
      />
    </div>
  );
}