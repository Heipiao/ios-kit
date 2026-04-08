import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

function resolveFramesRoot() {
  const candidates = [
    path.resolve(process.cwd(), "public/vendor/mockup-device-frames/Exports/iOS"),
    path.resolve(process.cwd(), "frontend/public/vendor/mockup-device-frames/Exports/iOS"),
    path.resolve(process.cwd(), "vendor/mockup-device-frames/Exports/iOS"),
    path.resolve(process.cwd(), "frontend/vendor/mockup-device-frames/Exports/iOS"),
  ];

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (existsSync(normalized)) {
      return normalized;
    }
  }

  return candidates[0];
}

function getContentType(filePath: string) {
  if (filePath.endsWith(".png")) {
    return "image/png";
  }
  if (filePath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: { assetPath: string[] } }
) {
  const { assetPath } = params;
  const framesRoot = resolveFramesRoot();
  const safeSegments = assetPath.map((segment) => segment.replaceAll("\\", "/"));
  const filePath = path.resolve(framesRoot, ...safeSegments);

  if (!filePath.startsWith(framesRoot)) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Frame asset not found" }, { status: 404 });
  }
}
