import Image from "next/image";

export function BrandMark() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-white px-4 py-3 shadow-soft">
        <Image
          src="/ashabhai-logo.svg"
          alt="Ashabhai & Co. logo"
          width={260}
          height={90}
          className="h-auto w-full"
          priority
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-xl font-semibold text-white">
          Ashabhai & Co.
        </div>
        <div className="mt-1 text-sm font-medium text-white/72">
          Stock Take Operations Platform
        </div>
      </div>
    </div>
  );
}
