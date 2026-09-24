import { redirect } from "next/navigation";
import { History } from "lucide-react";

import { getCurrentUserProfile } from "@/lib/auth";
import { getAuditLogs } from "@/lib/api/audit-logs";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const currentUser =
    await getCurrentUserProfile();

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Audit Log
        </h2>

        <p className="mt-1 text-sm text-[#73766F]">
          Review important actions performed in FurniCore.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7D3CA] bg-white p-10 text-center">
          <History className="mx-auto size-8 text-[#73766F]" />

          <p className="mt-3 text-sm text-[#73766F]">
            No recorded activity yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E2DA] bg-[#FAF9F6] text-xs uppercase text-[#73766F]">
                <tr>
                  <th className="px-5 py-4">
                    User
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>

                  <th className="px-5 py-4">
                    Entity
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#EEECE6] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {log.users?.name ??
                          "Unknown User"}
                      </p>

                      {log.users?.role && (
                        <p className="mt-1 text-xs capitalize text-[#73766F]">
                          {log.users.role}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {log.action}
                    </td>

                    <td className="px-5 py-4 capitalize text-[#73766F]">
                      {log.entity_type}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-[#73766F]">
                      {new Date(
                        log.created_at,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}