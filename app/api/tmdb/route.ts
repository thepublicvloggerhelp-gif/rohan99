import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const API_KEY = process.env.TMDB_API_KEY;
const BASE    = "https://api.themoviedb.org/3";

// Only allow known read-only TMDB endpoints
const ALLOWED_ENDPOINT = /^\/(search|movie|tv|discover|trending|genre)\/[a-zA-Z0-9/_-]*$/;

export async function GET(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "TMDB is not configured" }, { status: 503 });
  }

  // Require an authenticated user
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const endpoint = searchParams.get("endpoint") ?? "";

  if (!ALLOWED_ENDPOINT.test(endpoint) || endpoint.includes("..")) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const params = new URLSearchParams({ api_key: API_KEY });

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
  } catch {
    return NextResponse.json({ error: "TMDB fetch failed" }, { status: 500 });
  }
}
