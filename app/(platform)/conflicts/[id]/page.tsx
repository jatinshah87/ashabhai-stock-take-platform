import { ConflictDetailClient } from "@/components/sync/conflict-detail-client";

export default async function ConflictDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConflictDetailClient conflictId={id} />;
}
