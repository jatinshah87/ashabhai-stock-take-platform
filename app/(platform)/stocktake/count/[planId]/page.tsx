import { CountOverviewClient } from "@/components/counting/count-overview-client";

export default async function CountOverviewPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <CountOverviewClient planId={planId} />;
}
