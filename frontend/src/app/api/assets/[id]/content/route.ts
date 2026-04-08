const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const upstream = await fetch(`${API_BASE_URL}/api/assets/${id}/content`, {
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const cacheControl = upstream.headers.get("cache-control");
  const contentLength = upstream.headers.get("content-length");

  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  }
  if (contentLength) {
    headers.set("content-length", contentLength);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
