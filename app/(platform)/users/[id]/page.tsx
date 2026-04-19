import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RolePill } from "@/components/shared/role-pill";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserForm } from "@/components/users/user-form";
import { getSites, getUserById, getWarehouses } from "@/lib/services/users";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, warehouses, sites] = await Promise.all([getUserById(id), getWarehouses(), getSites()]);

  if (!user) notFound();

  return (
    <div className="grid gap-6">
      <PageHeader
        title={user.name}
        description="Review and update operational access, role assignment and warehouse/site mapping."
        actions={
          <>
            <RolePill role={user.role} />
            <StatusBadge status={user.status} />
          </>
        }
      />
      <UserForm mode="edit" user={user} warehouses={warehouses} sites={sites} />
    </div>
  );
}
