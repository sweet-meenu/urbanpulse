import { NextResponse } from "next/server"
import { getAllIncidents } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const incidents = await getAllIncidents()
    return NextResponse.json({ ok: true, incidents })
  } catch (err) {
    // don't leak internal errors, but log for debugging
    console.warn('incidents route error', err)
    return NextResponse.json({ ok: false, message: "Failed to fetch incidents" }, { status: 500 })
  }
}
