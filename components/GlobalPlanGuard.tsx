import React from "react";

export function GlobalPlanGuard({ children }: { children: React.ReactNode }) {
  // Shim: allow render; hook real gating later.
  return <>{children}</>;
}
