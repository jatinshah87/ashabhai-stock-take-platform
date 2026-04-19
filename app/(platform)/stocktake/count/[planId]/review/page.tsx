import { ReviewClient } from "@/components/counting/review-client";

export default async function CountReviewPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return <ReviewClient planId={planId} />;
}
