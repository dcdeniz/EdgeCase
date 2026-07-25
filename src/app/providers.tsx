"use client";

import { PrototypeProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PrototypeProvider>{children}</PrototypeProvider>;
}
