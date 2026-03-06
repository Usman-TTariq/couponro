import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

const BUCKET = "store-logos";
const PREFIX = "";
const MAX_SIZE = 1024 * 1024; // 1 MB
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") ?? formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use form field 'logo' or 'file'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 1 MB." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, GIF, WebP or SVG." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ? ext : "png";
    const path = `${PREFIX ? PREFIX + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;

    // Ensure bucket exists (create if missing – e.g. app uses different Supabase project)
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "1MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    });
    if (createErr && !createErr.message?.toLowerCase().includes("already exists")) {
      console.warn("[upload/logo] createBucket:", createErr.message);
    }

    const result = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (result.error) {
      console.error("[upload/logo]", result.error);
      return NextResponse.json(
        { error: result.error.message || "Upload failed" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("[upload/logo]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
