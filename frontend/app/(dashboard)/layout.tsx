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
    <div className="min-h-screen bg-[#F8F7F3] print:min-h-0 print:bg-white">
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block print:hidden">
        <AppSidebar role={profile.role} />
      </div>

      {/* Dashboard Content */}
      <div className="lg:pl-[260px] print:pl-0">
        {/* Header */}
        <div className="print:hidden">
          <AppHeader profile={profile} />
        </div>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8 print:min-h-0 print:p-0">
          <div className="mx-auto w-full max-w-[1600px] print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}