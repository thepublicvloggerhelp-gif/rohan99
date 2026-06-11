import { NextRequest, NextResponse } from "next/server";

const API_KEY = "fb11b31402e016dd963b993ed60e7d3b";
const BASE    = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const endpoint = searchParams.get("endpoint") ?? "";
  const params   = new URLSearchParams({ api_key: API_KEY });

  // Forward all query params except "endpoint"
  searchParams.forEach((val, key) => {
    if (key !== "endpoint") params.set(key, val);
  });

  const url = `${BASE}${endpoint}?${params.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    return NextResponse.json({ error: "TMDB fetch failed", details: String(err) }, { status: 500 });
  }
}
