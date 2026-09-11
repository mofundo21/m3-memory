import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseConfig, getPersistenceMode } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await params;

  try {
    const config = getSupabaseConfig(true);

    const mediaRes = await fetch(
      `${config.url}/rest/v1/media?id=eq.${encodeURIComponent(mediaId)}&select=*`,
      {
        headers: {
          apikey: config.anonKey,
          authorization: `Bearer ${config.serviceRoleKey}`,
          "content-type": "application/json",
        },
      }
    );

    if (!mediaRes.ok) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const mediaRows = await mediaRes.json();
    if (!Array.isArray(mediaRows) || mediaRows.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const media = mediaRows[0];
    const storagePath = media.storage_path;

    const objectRes = await fetch(
      `${config.url}/storage/v1/object/authenticated/submission-media/${encodeURIComponent(storagePath)}`,
      {
        headers: {
          authorization: `Bearer ${config.serviceRoleKey}`,
        },
      }
    );

    if (!objectRes.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await objectRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "content-type": media.mime_type || "application/octet-stream",
        "content-disposition": `inline; filename="${media.file_name}"`,
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
