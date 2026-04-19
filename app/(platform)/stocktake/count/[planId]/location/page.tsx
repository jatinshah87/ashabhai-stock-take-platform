import { LocationScanClient } from "@/components/counting/location-scan-client";

export default async function CountLocationPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <LocationScanClient planId={planId} />;
}
