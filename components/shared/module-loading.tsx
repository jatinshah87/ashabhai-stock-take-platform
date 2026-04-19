import { Skeleton } from "@/components/ui/skeleton";

export function ModuleLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-5 w-[42rem]" />
      </div>
      <div className="grid gap-4 tablet:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-28" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}
