import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, logError } from "@/lib/errors";

const API_KEY = "fb11b31402e016dd963b993ed60e7d3b";
const BASE    = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const endpoint = searchParams.get("endpoint") ?? "";
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 });
  }
  const params   = new URLSearchParams({ api_key: API_KEY });

  // Forward all query params except "endpoint"
  searchParams.forEach((val, key) => {
    if (key !== "endpoint") params.set(key, val);
  });

  const url = `${BASE}${endpoint}?${params.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    if (!res.ok) {
      logError("tmdb upstream request", data);
      return NextResponse.json(
        { error: getErrorMessage(data) },
        { status: res.status }
      );
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    logError("tmdb fetch", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
