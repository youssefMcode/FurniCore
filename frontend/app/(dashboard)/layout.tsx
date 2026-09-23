import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();

  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AppSidebar role={profile.role} />
      </div>

      <div className="lg:pl-[260px]">
        <AppHeader profile={profile} />

        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}