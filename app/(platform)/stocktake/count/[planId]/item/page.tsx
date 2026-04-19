import { ItemCountClient } from "@/components/counting/item-count-client";

export default async function CountItemPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <ItemCountClient planId={planId} />;
}
