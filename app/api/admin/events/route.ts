import { NextRequest, NextResponse } from "next/server";
import { isAdminEnabled } from "@/lib/adminAccess";
import { loadEventsForDate, monthDayFromIso } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !monthDayFromIso(date)) {
    return NextResponse.json(
      { ok: false, error: "Query param 'date' must be ISO YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const events = await loadEventsForDate(date);
  return NextResponse.json({ ok: true, date, events });
}
