import { getSites, getUsers, getWarehouses } from "@/lib/services/users";
import { UserListClient } from "@/components/users/user-list-client";

export default async function UsersPage() {
  const [users, warehouses, sites] = await Promise.all([getUsers(), getWarehouses(), getSites()]);
  return <UserListClient users={users} warehouses={warehouses} sites={sites} />;
}
