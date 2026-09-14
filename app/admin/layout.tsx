import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, LOGIN_FAILED_COOKIE, isAdminAuthed, isAdminEnabled } from "@/lib/adminAccess";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!isAdminEnabled()) notFound();
  const jar = cookies();
  if (!isAdminAuthed(jar.get(ADMIN_COOKIE)?.value)) {
    return <LoginForm failed={jar.has(LOGIN_FAILED_COOKIE)} />;
  }
  return children;
}

function LoginForm({ failed }: { failed: boolean }) {
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <form
        method="post"
        action="/api/admin/login"
        className="rounded-xl p-6 flex flex-col gap-3"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}
      >
        <h1 className="text-lg font-semibold">סטודיו · כניסה</h1>
        {failed ? (
          <p className="puzzle-mono text-[12px]" style={{ color: "#b91c1c" }}>
            סיסמה שגויה
          </p>
        ) : null}
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="סיסמה"
          className="rounded-md px-3 py-2"
          style={{ border: "1px solid #e7e0d0" }}
        />
        <button
          type="submit"
          className="rounded-md px-3 py-2 puzzle-mono text-[12px]"
          style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
        >
          [enter]
        </button>
      </form>
    </main>
  );
}
