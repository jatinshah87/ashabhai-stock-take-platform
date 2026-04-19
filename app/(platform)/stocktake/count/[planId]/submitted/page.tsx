import { SubmittedClient } from "@/components/counting/submitted-client";

export default async function CountSubmittedPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <SubmittedClient planId={planId} />;
}
