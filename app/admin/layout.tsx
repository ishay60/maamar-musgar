import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, LOGIN_FLAG_COOKIE, isAdminAuthed, isAdminEnabled } from "@/lib/adminAccess";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!isAdminEnabled()) notFound();
  const jar = cookies();
  if (!isAdminAuthed(jar.get(ADMIN_COOKIE)?.value)) {
    return <LoginForm flag={jar.get(LOGIN_FLAG_COOKIE)?.value} />;
  }
  return children;
}

const MESSAGES: Record<string, { text: string; tone: string }> = {
  sent: { text: "אם הכתובת רשומה, נשלח אליה קישור כניסה. בדקו את המייל.", tone: "text-emerald-700" },
  error: { text: "הכניסה נכשלה. נסו שוב.", tone: "text-red-700" },
};

function LoginForm({ flag }: { flag?: string }) {
  const msg = flag ? MESSAGES[flag] : undefined;
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <form
        method="post"
        action="/api/admin/login"
        className="rounded-xl p-6 flex flex-col gap-3 bg-white border border-line"
      >
        <h1 className="text-lg font-semibold">סטודיו · כניסה</h1>
        {msg ? <p className={`puzzle-mono text-[12px] ${msg.tone}`}>{msg.text}</p> : null}
        <input
          type="email"
          name="email"
          autoFocus
          required
          dir="ltr"
          placeholder="email"
          className="rounded-md px-3 py-2 border border-line"
        />
        <button
          type="submit"
          className="rounded-md px-3 py-2 puzzle-mono text-[12px] bg-ink text-paper"
        >
          [שלחו לי קישור כניסה]
        </button>
      </form>
    </main>
  );
}
