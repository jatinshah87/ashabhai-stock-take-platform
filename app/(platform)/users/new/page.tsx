import { PageHeader } from "@/components/layout/page-header";
import { UserForm } from "@/components/users/user-form";
import { getSites, getWarehouses } from "@/lib/services/users";

export default async function NewUserPage() {
  const [warehouses, sites] = await Promise.all([getWarehouses(), getSites()]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Create User"
        description="Add a new operational user, assign the right role and map warehouse/site access cleanly."
      />
      <UserForm mode="create" warehouses={warehouses} sites={sites} />
    </div>
  );
}
