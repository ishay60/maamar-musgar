import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminAuthed, isAdminEnabled } from "@/lib/adminAccess";
import { loadClues } from "@/lib/clueLibrary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminEnabled()) return NextResponse.json({ ok: false }, { status: 404 });
  if (!isAdminAuthed(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, clues: await loadClues() });
}
