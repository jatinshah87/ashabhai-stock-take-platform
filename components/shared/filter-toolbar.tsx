import { ReactNode } from "react";

export function FilterToolbar({ children }: { children: ReactNode }) {
  return <div className="surface-panel grid gap-4 p-5 tablet:grid-cols-2 xl:grid-cols-5">{children}</div>;
}
