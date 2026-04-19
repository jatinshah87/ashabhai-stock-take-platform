import { AnomalyDetailClient } from "@/components/anomalies/anomaly-detail-client";

export default async function AnomalyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnomalyDetailClient anomalyId={id} />;
}
