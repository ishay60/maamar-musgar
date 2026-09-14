import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isAdminEnabled } from "@/lib/adminAccess";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!isAdminEnabled()) {
    notFound();
  }

  return children;
}
