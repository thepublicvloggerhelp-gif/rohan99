"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MOVIES, TV_SHOWS, ALL_CONTENT, GENRES } from "@/lib/staticData";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface Review   { media_id: string; media_type: string; title: string; rating: number; text: string; timestamp: number; }
interface ListItem { id: string; media_type: string; title: string; poster_path: string; vote_average?: number; }

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS — proxy ALL images through Next.js server to bypass client blocks
───────────────────────────────────────────────────────────────────────────── */
// Accepts either a full URL (TVMaze) or a TMDB path fragment
const POSTER = (p: string) => {
  if (!p) return "";
  const full = p.startsWith("http") ? p : `https://image.tmdb.org/t/p/w500${p}`;
  return `/_next/image?url=${encodeURIComponent(full)}&w=640&q=80`;
};

const BACKDROP = (p: string) => {
  if (!p) return "";
  const full = p.startsWith("http") ? p : `https://image.tmdb.org/t/p/original${p}`;
  return `/_next/image?url=${encodeURIComponent(full)}&w=1920&q=80`;
};

const YOUTUBE_THUMB = (key: string) =>
  `/_next/image?url=${encodeURIComponent(`https://img.youtube.com/vi/${key}/hqdefault.jpg`)}&w=640&q=75`;

// Get raw poster URL from item (supports both old path-style and new raw-url-style)
const getPoster = (item: any) => item.poster_path_raw || item.poster_path || "";
const getBackdrop = (item: any) => item.backdrop_path_raw || item.backdrop_path || "";

/* ─────────────────────────────────────────────────────────────────────────────
   TRAILER MODAL
───────────────────────────────────────────────────────────────────────────── */
function TrailerModal({ youtubeKey, onClose }: { youtubeKey: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="trailer-overlay" onClick={onClose}>
      <div className="trailer-modal" onClick={e => e.stopPropagation()}>
        <button className="trailer-close" onClick={onClose}>✕</button>
        <div className="trailer-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADVANCED SEARCH BAR
───────────────────────────────────────────────────────────────────────────── */
function SearchBar({ onNav }: { onNav: (h: string) => void }) {
  const [val,      setVal]      = useState("");
  const [focused,  setFocused]  = useState(false);
  const [genre,    setGenre]    = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!val.trim()) return [];
    const q = val.toLowerCase();
    return ALL_CONTENT.filter(it =>
      (it.title || it.name || "").toLowerCase().includes(q) ||
      (it.overview || "").toLowerCase().includes(q)
    ).slice(0, 7);
  }, [val]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setFocused(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (it: any) => {
    setVal(""); setFocused(false);
    onNav(`detail/${it.media_type}/${it.id}`);
  };

  const search = () => {
    if (!val.trim() && !genre) return;
    setFocused(false);
    if (genre && !val.trim()) { onNav(`genre/${genre}`); return; }
    onNav(`search/${encodeURIComponent(val.trim())}${genre ? `?genre=${genre}` : ""}`);
  };

  const open = focused && (val.trim() || suggestions.length > 0);

  return (
    <div ref={ref} className="adv-search-wrap">
      <div className={`adv-search-bar${focused ? " focused" : ""}`}>
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          className="adv-search-input"
          placeholder="Search any film or series..."
          value={val}
          onChange={e => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={e => { if (e.key === "Enter") search(); if (e.key === "Escape") setFocused(false); }}
        />
        <select className="adv-genre-filter" value={genre} onChange={e => setGenre(e.target.value)}>
          <option value="">All Genres</option>
          {GENRES.map(([, name]) => <option key={name} value={name}>{name}</option>)}
        </select>
        <button className="adv-search-btn" onClick={search}>Search</button>
      </div>

      {open && (
        <div className="search-dropdown">
          {suggestions.map(it => (
            <div key={it.id} className="search-suggestion" onClick={() => go(it)}>
              <div className="suggestion-poster">
                {getPoster(it)
                  ? <img src={POSTER(getPoster(it))} alt="" />
                  : <div style={{ width: "100%", height: "100%", background: "#1E252B" }} />}
              </div>
              <div className="suggestion-info">
                <div className="suggestion-title">{it.title || it.name}</div>
                <div className="suggestion-meta">
                  <span className="suggestion-type">{it.media_type === "tv" ? "TV Series" : "Movie"}</span>
                  <span className="suggestion-rating">★ {it.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
          {val.trim() && suggestions.length === 0 && (
            <div style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: 13 }}>No results for &ldquo;{val}&rdquo;</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO BANNER  (auto-cycles, plays trailer)
───────────────────────────────────────────────────────────────────────────── */
function HeroBanner({ items, onNav, onPlayTrailer }: { items: any[]; onNav: (h: string) => void; onPlayTrailer: (key: string) => void }) {
  const [idx,     setIdx]     = useState(0);
  const [fading,  setFading]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const item = items[idx] ?? items[0];

  const goTo = useCallback((next: number) => {
    setFading(true);
    setTimeout(() => { setIdx(next); setFading(false); }, 400);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => goTo((idx + 1) % items.length), 7000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, items.length, goTo]);

  const title  = item?.title || item?.name || "";
  const type   = item?.media_type || "movie";
  const rating = item?.vote_average?.toFixed(1) ?? "NR";

  return (
    <div id="hero" style={{ position: "relative" }}>
      {/* Backdrop slides */}
      {items.slice(0, 5).map((it, i) => (
        <div key={it.id} className={`hero-bg-layer${i === idx ? " active" : ""}`}
          style={{ backgroundImage: getBackdrop(it) ? `url(${BACKDROP(getBackdrop(it))})` : undefined }} />
      ))}
      <div className="hero-overlay" />

      {/* Content */}
      <div className={`hero-content${fading ? " fading" : ""}`}>
        <div className="hero-rating-badge">
          <span style={{ color: "#f5c518" }}>★</span> {rating} &nbsp;·&nbsp; {type === "tv" ? "TV Series" : "Film"}
        </div>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-desc">{item?.overview}</p>
        <div className="hero-btns">
          {item?.trailer_key && (
            <button className="btn-play-trailer" onClick={() => onPlayTrailer(item.trailer_key)}>
              <span className="play-icon">▶</span> Play Trailer
            </button>
          )}
          <button className="btn-hero-primary" onClick={() => onNav(`detail/${type}/${item?.id}`)}>View Details</button>
          <button className="btn-hero-secondary" onClick={() => onNav(`detail/${type}/${item?.id}`)}>Write Review</button>
        </div>
      </div>

      {/* Dots */}
      <div className="hero-dots">
        {items.slice(0, 5).map((_, i) => (
          <div key={i} className={`hero-dot${i === idx ? " active" : ""}`} onClick={() => goTo(i)} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOVIE CARD  (3-D tilt, glassmorphic overlay)
───────────────────────────────────────────────────────────────────────────── */
function MovieCard({ item, onNav, onPlayTrailer, rank }: { item: any; onNav: (h: string) => void; onPlayTrailer?: (k: string) => void; rank?: number }) {
  const title   = item.title || item.name || "Untitled";
  const type    = item.media_type || "movie";
  const rating  = item.vote_average?.toFixed(1) ?? "NR";
  const ref     = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r  = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${-((e.clientY - r.top  - r.height / 2) / r.height) * 12}deg`);
    el.style.setProperty("--ry", `${ ((e.clientX - r.left - r.width  / 2) / r.width)  * 12}deg`);
  };
  const onLeave = () => {
    setHov(false);
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="m-card" ref={ref} onMouseMove={onMove} onMouseEnter={() => setHov(true)} onMouseLeave={onLeave}
      onClick={() => onNav(`detail/${type}/${item.id}`)}>
      {rank && <div className="card-rank">#{rank}</div>}
      <div className="card-poster">
        {getPoster(item)
          ? <img src={POSTER(getPoster(item))} alt={title} loading="lazy" />
          : <div className="card-poster-placeholder">{title.slice(0, 2).toUpperCase()}</div>}
      </div>
      <div className="card-overlay">
        <div className="card-rating"><span className="card-rating-icon">★</span>{rating}</div>
        <div className="card-title">{title}</div>
        {item.genre && <div className="card-genre">{item.genre[0]}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   REVIEW CARD
───────────────────────────────────────────────────────────────────────────── */
function ReviewCard({ rev, onClick }: { rev: Review; onClick?: () => void }) {
  return (
    <div className="review-card glass-panel" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="review-card-header">
        <div className="reviewer-avatar">R</div>
        <div className="reviewer-info">
          <div className="reviewer-name">Rohan Community User</div>
          <div className="reviewer-date">{new Date(rev.timestamp).toLocaleDateString()}</div>
        </div>
        <div className="review-card-rating" style={{ background: `hsl(${rev.rating * 12}, 80%, 35%)` }}>★ {rev.rating}/10</div>
      </div>
      <p className="review-card-text">&ldquo;{rev.text}&rdquo;</p>
      <div className="review-card-movie">{rev.title}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INFINITE SCROLL GRID — Renders 48 items initially, loads 48 more on scroll.
   Keeps DOM lean for 60fps smoothness across 9,000+ items.
───────────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 48;
function InfiniteGrid({ items, onNav, onPlayTrailer, ranked }: {
  items: any[];
  onNav: (h: string) => void;
  onPlayTrailer?: (k: string) => void;
  ranked?: boolean;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when dataset changes (tab switch, search, etc.)
  useEffect(() => { setLimit(PAGE_SIZE); }, [items]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLimit(prev => Math.min(prev + PAGE_SIZE, items.length));
      }
    }, { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length]);

  const visible = items.slice(0, limit);

  return (
    <>
      <div className="mlt-grid">
        {visible.map((it, i) => (
          <MovieCard key={`${it.id}-${i}`} item={it} onNav={onNav} onPlayTrailer={onPlayTrailer} rank={ranked ? i + 1 : undefined} />
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: 1 }} />
      {limit < items.length && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div className="loading-spinner" />
        </div>
      )}
      {limit >= items.length && items.length > PAGE_SIZE && (
        <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 12, letterSpacing: 1 }}>
          ✓ All {items.length.toLocaleString()} titles loaded
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────────────────────────── */
export default function RohansApp() {
  const [route,      setRoute]      = useState("");
  const [pageData,   setPageData]   = useState<any>(null);
  const [prevPage,   setPrevPage]   = useState<string>("");
  const [transitioning, setTransitioning] = useState(false);
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [myList,     setMyList]     = useState<ListItem[]>([]);
  const [toast,      setToast]      = useState<string | null>(null);
  const [ratingVal,  setRatingVal]  = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [menuOpen,   setMenuOpen]   = useState(false);

  useEffect(() => {
    try {
      const r = localStorage.getItem("rfc_reviews"); if (r) setReviews(JSON.parse(r));
      const l = localStorage.getItem("rfc_mylist");  if (l) setMyList(JSON.parse(l));
    } catch {}
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3200); };
  const playTrailer = (key: string) => setTrailerKey(key);

  const nav = useCallback((hash: string) => { window.location.hash = hash; }, []);

  /* ── Route loader ───────────────────────────────────────────────────────── */
  const loadRoute = useCallback((r: string) => {
    window.scrollTo({ top: 0 });

    const transition = (fn: () => void) => {
      setTransitioning(true);
      setTimeout(() => { fn(); setTransitioning(false); }, 280);
    };

    transition(() => {
      if (!r) {
        setPageData({ type: "dashboard" });
      } else if (r === "movies") {
        setPageData({ type: "grid", title: "Global Top Movies", desc: "The highest-rated films of all time.", items: [...MOVIES].sort((a, b) => b.vote_average - a.vote_average) });
      } else if (r === "tv") {
        setPageData({ type: "grid", title: "Global Top Series", desc: "The most acclaimed television.", items: [...TV_SHOWS].sort((a, b) => b.vote_average - a.vote_average) });
      } else if (r === "critics") {
        setPageData({ type: "grid", title: "Critic Picks", desc: "Films with the highest critical acclaim.", items: [...ALL_CONTENT].sort((a, b) => b.vote_average - a.vote_average) });
      } else if (r === "halloffame") {
        setPageData({ type: "grid", title: "Hall of Fame", desc: "Cinematic masterpieces for the ages.", items: ALL_CONTENT.filter(it => it.vote_average >= 8.7) });
      } else if (r === "trailers") {
        setPageData({ type: "trailers", items: ALL_CONTENT.filter(it => it.trailer_key) });
      } else if (r.startsWith("genre/")) {
        const name = decodeURIComponent(r.slice(6));
        const filtered = ALL_CONTENT.filter(it => (it.genre ?? []).includes(name));
        setPageData({ type: "grid", title: name, desc: `Top ${name} titles in our collection.`, items: filtered.length ? filtered : ALL_CONTENT.slice(0, 10) });
      } else if (r.startsWith("search/")) {
        const raw = r.slice(7);
        const [qEncoded, rest] = raw.split("?genre=");
        const q    = decodeURIComponent(qEncoded).toLowerCase();
        const gf   = rest ? decodeURIComponent(rest) : "";
        let items  = ALL_CONTENT.filter(it => (it.title || it.name || "").toLowerCase().includes(q) || (it.overview || "").toLowerCase().includes(q));
        if (gf) items = items.filter(it => (it.genre ?? []).includes(gf));
        setPageData({ type: "search", items, query: decodeURIComponent(qEncoded) });
      } else if (r.startsWith("detail/")) {
        const [, type, id] = r.split("/");
        const item = ALL_CONTENT.find(it => String(it.id) === id) ?? ALL_CONTENT[0];
        setPageData({ type: "detail", data: item, mediaType: type, id });
      } else if (r === "community") { setPageData({ type: "community" }); }
        else if (r === "notebook")  { setPageData({ type: "notebook" }); }
        else if (r === "news")      { setPageData({ type: "news" }); }
        else if (r === "forums")    { setPageData({ type: "forums" }); }
        else if (r === "profile")   { setPageData({ type: "profile" }); }
        else { setPageData({ type: "dashboard" }); }
    });
  }, []);

  const loadRouteRef = useRef(loadRoute);
  useEffect(() => { loadRouteRef.current = loadRoute; }, [loadRoute]);

  useEffect(() => {
    const onHash = () => {
      const r = window.location.hash.slice(1) || "";
      setPrevPage(route);
      setRoute(r);
      loadRouteRef.current(r);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []); // eslint-disable-line

  /* ── Reviews / list ─────────────────────────────────────────────────────── */
  const submitReview = (id: string, type: string, title: string) => {
    if (!reviewText.trim()) { showToast("Write something first!"); return; }
    const updated = [...reviews, { media_id: id, media_type: type, title, rating: ratingVal, text: reviewText.trim(), timestamp: Date.now() }];
    setReviews(updated);
    localStorage.setItem("rfc_reviews", JSON.stringify(updated));
    setReviewText(""); setRatingVal(5);
    showToast("✓ Review submitted!");
  };

  const toggleList = (item: ListItem) => {
    const exists  = myList.some(i => i.id === item.id);
    const updated = exists ? myList.filter(i => i.id !== item.id) : [...myList, item];
    setMyList(updated);
    localStorage.setItem("rfc_mylist", JSON.stringify(updated));
    showToast(exists ? "Removed from Notebook" : "✓ Added to Notebook!");
  };

  /* ── Content renderer ───────────────────────────────────────────────────── */
  const renderContent = () => {
    if (!pageData) return <div className="page-loading"><div className="spinner" /></div>;

    /* Dashboard */
    if (pageData.type === "dashboard") {
      const heroItems = ALL_CONTENT.filter(it => getBackdrop(it)).slice(0, 8);
      const topMovies = [...MOVIES].sort((a, b) => b.vote_average - a.vote_average);
      const topTv     = [...TV_SHOWS].sort((a, b) => b.vote_average - a.vote_average).slice(0, 120);
      return (
        <div>
          <HeroBanner items={heroItems} onNav={nav} onPlayTrailer={playTrailer} />

          <div className="sec-header" style={{ marginTop: 40 }}>
            <h2 className="sec-title">Top Ranked Films</h2>
            <span className="sec-sub">Sorted by TMDB rating</span>
          </div>
          <div className="card-row-wrap"><div className="card-row">
            {topMovies.slice(0, 18).map((it, i) =>
              <MovieCard key={it.id} item={it} onNav={nav} onPlayTrailer={playTrailer} rank={i + 1} />)}
          </div></div>

          <div className="sec-header" style={{ marginTop: 40 }}>
            <h2 className="sec-title">Trending TV & Anime</h2>
            <span className="sec-sub">Most acclaimed on screen</span>
          </div>
          <div className="card-row-wrap"><div className="card-row">
            {topTv.slice(0, 18).map(it =>
              <MovieCard key={it.id} item={it} onNav={nav} onPlayTrailer={playTrailer} />)}
          </div></div>
        </div>
      );
    }

    /* Grid */
    if (pageData.type === "grid") return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{pageData.title}</h1>
          <p className="page-desc">{pageData.desc} &mdash; <strong style={{ color: "var(--accent-blue)" }}>{pageData.items.length.toLocaleString()} titles</strong></p>
        </div>
        {pageData.items.length === 0 && <p style={{ color: "var(--text-muted)", padding: 20 }}>No results found.</p>}
        <InfiniteGrid items={pageData.items} onNav={nav} onPlayTrailer={playTrailer} ranked />
      </div>
    );

    /* Trailers page */
    if (pageData.type === "trailers") return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Trailers Hub</h1>
          <p className="page-desc">Click any card to watch the official trailer.</p>
        </div>
        <div className="trailers-grid">
          {pageData.items.map((it: any) => (
            <div key={it.id} className="trailer-card" onClick={() => playTrailer(it.trailer_key)}>
              <div className="trailer-thumb">
                <img src={YOUTUBE_THUMB(it.trailer_key)} alt={it.title || it.name} loading="lazy" />
                <div className="trailer-play-btn"><span>▶</span></div>
              </div>
              <div className="trailer-info">
                <div className="trailer-title">{it.title || it.name}</div>
                <div className="trailer-meta">★ {it.vote_average?.toFixed(1)} · {it.media_type === "tv" ? "Series" : "Film"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    /* Search */
    if (pageData.type === "search") return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Search Results</h1>
          <p className="page-desc">
            <strong style={{ color: "var(--accent-blue)" }}>{pageData.items.length.toLocaleString()}</strong> result{pageData.items.length !== 1 ? "s" : ""} for &ldquo;{pageData.query}&rdquo;
          </p>
        </div>
        {pageData.items.length === 0
          ? <div className="empty-state"><div style={{ fontSize: 52 }}>🔍</div><h3>No results found</h3><p>Try a different title or genre.</p></div>
          : <InfiniteGrid items={pageData.items} onNav={nav} onPlayTrailer={playTrailer} />}
      </div>
    );

    /* Detail */
    if (pageData.type === "detail") {
      const d      = pageData.data;
      const title  = d?.title || d?.name || "";
      const year   = (d?.release_date || d?.first_air_date || "2000").split("-")[0];
      const inList = myList.some(i => i.id == pageData.id);
      const myRevs = reviews.filter(r => r.media_id == pageData.id).reverse();
      const similar = ALL_CONTENT
        .filter(it => String(it.id) !== String(pageData.id) && (it.genre ?? []).some((g: string) => (d?.genre ?? []).includes(g)))
        .slice(0, 16);

      return (
        <div>
          {/* Full Hero with Poster and Auto-playing Trailer */}
          <div className="detail-hero">
            {getBackdrop(d) && <img src={BACKDROP(getBackdrop(d))} className="detail-hero-bg" alt="" />}
            <div className="detail-hero-overlay" />
            <div className="detail-content-top">
              <div className="detail-poster">
                {getPoster(d) && <img src={POSTER(getPoster(d))} alt={title} />}
              </div>
              <div className="detail-trailer-container">
                {d?.trailer_key ? (
                  <iframe
                    className="detail-hero-iframe"
                    src={`https://www.youtube-nocookie.com/embed/${d.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${d.trailer_key}&controls=0&modestbranding=1&rel=0`}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="no-trailer-fallback">No trailer available</div>
                )}
              </div>
            </div>
          </div>

          {/* Movie Details Below */}
          <div className="detail-info-section">
            <div className="detail-main">
              <div className="detail-badges">
                <span className="badge-year">{year}</span>
                <span className="badge-type">{pageData.mediaType === "tv" ? "TV Series" : "Film"}</span>
                {(d?.genre ?? []).slice(0, 3).map((g: string) => <span key={g} className="badge-genre">{g}</span>)}
              </div>
              <h1 className="detail-title">{title}</h1>
              <div className="detail-rating-row">
                <div className="detail-score">
                  <span className="detail-score-num">{d?.vote_average?.toFixed(1)}</span>
                  <span className="detail-score-label">/ 10 TMDB</span>
                </div>
                <div className="detail-stars">
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round((d?.vote_average ?? 0) / 2) ? "#f5c518" : "#333" }}>★</span>)}
                </div>
              </div>
              <p className="detail-desc" style={{ fontSize: 16, maxWidth: 800 }}>{d?.overview}</p>
              
              <div className="detail-actions" style={{ marginTop: 24 }}>
                <button className="btn-editorial secondary" onClick={() => toggleList({ id: pageData.id, media_type: pageData.mediaType, title, poster_path: d?.poster_path, vote_average: d?.vote_average })}>
                  {inList ? "✓ In Notebook" : "+ Notebook"}
                </button>
                <button className="btn-editorial primary" onClick={() => document.getElementById("review-form")?.scrollIntoView()}>
                  Write Review
                </button>
              </div>
            </div>
          </div>

          <div className="detail-grid-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px', marginTop: '40px' }}>
            <div className="detail-left-col">
              <div className="sec-header"><h2 className="sec-title">Cast & Crew</h2></div>
              <div className="cast-grid">
                {["Director", "Lead Actor", "Supporting Actor", "Composer", "Cinematographer"].map((role, i) => (
                  <div key={i} className="cast-card glass-panel">
                    <div className="cast-avatar">👤</div>
                    <div className="cast-info">
                      <div className="cast-name">Talent Name</div>
                      <div className="cast-role">{role}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review form */}
              <div id="review-form" style={{ marginTop: 40 }}>
                <div className="sec-header" style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "var(--text-light)", fontWeight: 700 }}>Write a Review</h2>
                </div>
                <div className="review-form glass-panel" style={{ padding: 20 }}>
                  <div className="rating-slider-container">
                    <div className="rating-label">
                      <span>Your Rating</span>
                      <span style={{ color: "var(--accent-green)", fontWeight: 700, fontSize: 16 }}>{ratingVal}<span style={{ fontSize: 10, color: "var(--text-muted)" }}>/10</span></span>
                    </div>
                    <div className="stars-display">
                      {[1,2,3,4,5,6,7,8,9,10].map(s => (
                        <span key={s} onClick={() => setRatingVal(s)} style={{ cursor: "pointer", fontSize: 18, color: s <= ratingVal ? "#f5c518" : "rgba(255,255,255,0.15)", transition: "color 0.15s" }}>★</span>
                      ))}
                    </div>
                    <input type="range" min="1" max="10" value={ratingVal} className="rating-slider" onChange={e => setRatingVal(+e.target.value)} />
                  </div>
                  <textarea className="review-textarea" placeholder="Share your critique..." value={reviewText} onChange={e => setReviewText(e.target.value)} style={{ height: 80 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn-editorial primary" onClick={() => submitReview(pageData.id, pageData.mediaType, title)}>Submit Review</button>
                  </div>
                </div>

                <div className="sec-header" style={{ marginTop: 40 }}><h2 className="sec-title">Community Reviews ({myRevs.length})</h2></div>
                <div className="reviews-masonry" style={{ columns: 1 }}>
                  {myRevs.length === 0
                    ? <div className="empty-state" style={{ padding: 20 }}><div style={{ fontSize: 30 }}>✍️</div><p style={{ fontSize: 13 }}>No reviews yet.</p></div>
                    : myRevs.map((rev, i) => <ReviewCard key={i} rev={rev} />)}
                </div>
              </div>
            </div>

            <div className="detail-right-col">
              <div className="sec-header"><h2 className="sec-title">Latest News</h2></div>
              <div className="detail-news-list">
                {[
                  { tag: "PRODUCTION", title: `${title} sequel reportedly in talks at studio`, time: "2h ago" },
                  { tag: "BOX OFFICE", title: `Global audiences react to ${title}`, time: "5h ago" },
                  { tag: "INTERVIEW", title: `Director discusses the ending of ${title}`, time: "1d ago" }
                ].map((n, i) => (
                  <div key={i} className="detail-news-item">
                    <div className="news-tag" style={{ color: "var(--accent-blue)", fontSize: 9 }}>{n.tag}</div>
                    <div className="news-title" style={{ fontSize: 13, fontFamily: "Inter, sans-serif" }}>{n.title}</div>
                    <div className="news-time" style={{ fontSize: 10 }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Similar titles */}
          {similar.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div className="sec-header"><h2 className="sec-title">You Might Also Like</h2></div>
              <div className="card-row-wrap"><div className="card-row">
                {similar.map(it => <MovieCard key={it.id} item={it} onNav={nav} onPlayTrailer={playTrailer} />)}
              </div></div>
            </div>
          )}
        </div>
      );
    }

    /* Community */
    if (pageData.type === "community") return (
      <div>
        <div className="page-header"><h1 className="page-title">Community Feed</h1><p className="page-desc">Latest critiques from the editorial community.</p></div>
        {reviews.length === 0
          ? <div className="empty-state"><div style={{ fontSize: 52 }}>🎬</div><h3>No reviews yet!</h3><p>Be the first to write one.</p></div>
          : <div className="reviews-masonry">{[...reviews].reverse().map((rev, i) => <ReviewCard key={i} rev={rev} onClick={() => nav(`detail/${rev.media_type}/${rev.media_id}`)} />)}</div>}
      </div>
    );

    /* Notebook */
    if (pageData.type === "notebook") return (
      <div>
        <div className="page-header"><h1 className="page-title">My Notebook</h1><p className="page-desc">Your personal curated watchlist.</p></div>
        {myList.length === 0
          ? <div className="empty-state"><div style={{ fontSize: 52 }}>📓</div><h3>Your Notebook is empty.</h3><p>Add films from any detail page.</p></div>
          : <div className="mlt-grid">{myList.map(it => <MovieCard key={it.id} item={it} onNav={nav} onPlayTrailer={playTrailer} />)}</div>}
      </div>
    );

    /* News */
    if (pageData.type === "news") {
      const articles = [
        { tag: "BREAKING",  col: "var(--accent-green)", title: "Christopher Nolan Announces His Next Sci-Fi Epic",    body: "The acclaimed director reveals his next project shoots entirely in IMAX across three continents.", time: "2 hours ago" },
        { tag: "EDITORIAL", col: "var(--accent-blue)",  title: "Why 1999 Was the Greatest Year in Cinema History",    body: "From The Matrix to Fight Club, the year that redefined modern filmmaking and storytelling forever.", time: "5 hours ago" },
        { tag: "INTERVIEW", col: "#f5c518",             title: "Denis Villeneuve on the Art of World-Building",       body: "The Dune director opens up about his obsession with scale, silence, and the camera as a storytelling device.", time: "1 day ago" },
        { tag: "REVIEW",    col: "#e879f9",             title: "Inception Is Still a Mind-Bending Masterpiece",       body: "Re-examining Christopher Nolan's dream heist film a decade later — it only gets richer with each viewing.", time: "2 days ago" },
        { tag: "ANALYSIS",  col: "#fb923c",             title: "The Rise of Korean Cinema: A New Golden Age",         body: "From Parasite to The Wailing, Korean filmmakers are redefining what world cinema can achieve.", time: "3 days ago" },
      ];
      return (
        <div>
          <div className="page-header"><h1 className="page-title">News & Articles</h1><p className="page-desc">Industry dispatches and editorial columns.</p></div>
          {articles.map((a, i) => (
            <div key={i} className="news-card glass-panel"
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "")}>
              <div className="news-tag" style={{ color: a.col }}>{a.tag}</div>
              <h2 className="news-title">{a.title}</h2>
              <p className="news-body">{a.body}</p>
              <div className="news-time">{a.time}</div>
            </div>
          ))}
        </div>
      );
    }

    /* Forums */
    if (pageData.type === "forums") {
      const threads = [
        { title: "The Dark Knight vs. The Godfather — Greatest Film Ever?",  by: "Cinephile99", replies: "1,240", hot: true,  time: "2h ago"  },
        { title: "Recommend a great psychological thriller?",                 by: "GuestUser",   replies: "45",    hot: false, time: "5h ago"  },
        { title: "Is Chernobyl the best miniseries ever made?",               by: "FilmBro23",   replies: "312",   hot: true,  time: "1d ago"  },
        { title: "Best cinematography of the 2020s so far",                   by: "LensLover",   replies: "88",    hot: false, time: "2d ago"  },
        { title: "Breaking Bad or The Wire — which is better?",               by: "SeriesKing",  replies: "456",   hot: true,  time: "3d ago"  },
      ];
      return (
        <div>
          <div className="page-header"><h1 className="page-title">Community Forums</h1><p className="page-desc">Debate, discuss, and discover.</p></div>
          {threads.map((t, i) => (
            <div key={i} className="forum-thread glass-panel"
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "")}>
              <div className="forum-thread-left">
                <h3 className="forum-title">{t.title}</h3>
                <div className="forum-meta">By <strong>{t.by}</strong> · {t.replies} replies · {t.time}</div>
              </div>
              {t.hot && <div className="forum-hot">HOT 🔥</div>}
            </div>
          ))}
        </div>
      );
    }

    /* Profile */
    if (pageData.type === "profile") {
      const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
      const topGenre = (() => {
        const gc: Record<string, number> = {};
        reviews.forEach(r => { const it = ALL_CONTENT.find(x => String(x.id) === r.media_id); (it?.genre ?? []).forEach((g: string) => gc[g] = (gc[g] ?? 0) + 1); });
        return Object.entries(gc).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      })();
      return (
        <div>
          <div className="page-header"><h1 className="page-title">Profile Dashboard</h1><p className="page-desc">Your cinematic analytics at a glance.</p></div>
          <div className="stats-grid">
            {[{ val: reviews.length, label: "Reviews Written", col: "var(--text-light)", icon: "✍️" },
              { val: `★ ${avg}`,    label: "Avg Rating",       col: "#f5c518",            icon: "⭐" },
              { val: myList.length,  label: "In Notebook",      col: "var(--accent-blue)", icon: "📓" },
              { val: topGenre,       label: "Fav Genre",         col: "var(--accent-green)",icon: "🎭" },
            ].map((s, i) => (
              <div key={i} className="stat-card glass-panel">
                <div className="stat-icon">{s.icon}</div>
                <div style={{ fontSize: 40, color: s.col, fontWeight: 700, marginBottom: 6 }}>{s.val}</div>
                <div style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {reviews.length > 0 && <>
            <div className="sec-header" style={{ marginTop: 40 }}><h2 className="sec-title">Your Reviews</h2></div>
            <div className="reviews-masonry">{[...reviews].reverse().map((rev, i) => <ReviewCard key={i} rev={rev} onClick={() => nav(`detail/${rev.media_type}/${rev.media_id}`)} />)}</div>
          </>}
        </div>
      );
    }

    return null;
  };

  /* ── Nav ─────────────────────────────────────────────────────────────────── */
  const NAV = [
    { id: "",           label: "Dashboard",   icon: "⊞" },
    { id: "movies",     label: "Movies",      icon: "🎬" },
    { id: "tv",         label: "Series",      icon: "📺" },
    { id: "critics",    label: "Critics",     icon: "✍️" },
    { id: "trailers",   label: "Trailers",    icon: "▶" },
    { id: "news",       label: "News",        icon: "📰" },
    { id: "halloffame", label: "Hall of Fame",icon: "🏆" },
    { id: "community",  label: "Community",   icon: "👥" },
    { id: "forums",     label: "Forums",      icon: "💬" },
    { id: "notebook",   label: "Notebook",    icon: "📓" },
  ];

  const tickerData = [
    ...reviews.slice(-2).reverse().map(r => ({ user: "You", rating: r.rating, title: r.title, text: r.text, time: "Just now" })),
    { user: "Cinephile99",  rating: 10, title: "The Shawshank Redemption", text: "Greatest film ever made. Period.",           time: "3m ago"  },
    { user: "FilmBro23",    rating: 9,  title: "The Dark Knight",           text: "Ledger's Joker is legendary.",              time: "11m ago" },
    { user: "SarahReviews", rating: 10, title: "Spirited Away",             text: "Miyazaki is a true visionary.",             time: "1h ago"  },
    { user: "ActionJunkie", rating: 9,  title: "Inception",                 text: "Still blows my mind on every rewatch.",     time: "2h ago"  },
    { user: "CriticX",      rating: 8,  title: "Breaking Bad",              text: "The greatest TV series ever written.",      time: "4h ago"  },
  ].slice(0, 7);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        @keyframes slideIn { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:none; } }
        .page-enter { animation: slideIn 0.32s ease; }
        .page-exit  { opacity:0; transform:translateX(-20px); transition:0.25s ease; }
      `}</style>

      {/* ── Trailer Modal ── */}
      {trailerKey && <TrailerModal youtubeKey={trailerKey} onClose={() => setTrailerKey(null)} />}

      {/* ── Navbar ── */}
      <nav id="navbar">
        <div className="nav-inner">
          <div className="logo-wordmark" onClick={() => nav("")} style={{ cursor: "pointer", flexShrink: 0 }}>
            <span className="logo-name">Rohan&rsquo;s Final Cut</span>
            <span className="logo-tag">Editorial</span>
          </div>

          {/* Desktop nav links */}
          <div className="nav-links">
            {NAV.map(n => (
              <div key={n.id || "dash"} className={`nav-link${route === n.id ? " active" : ""}`} onClick={() => nav(n.id)}>
                {n.label}
              </div>
            ))}
          </div>

          <SearchBar onNav={nav} />
          <div className="profile-avatar" onClick={() => nav("profile")}>R</div>
        </div>
      </nav>

      {/* ── 3-Column Layout ── */}
      <div className="layout-wrapper">

        {/* Left Sidebar */}
        <aside className="sidebar glass-panel">
          <div className="sidebar-header">Browse</div>
          <div className="filter-group">
            <label>Genre</label>
            <select defaultValue="" onChange={e => { if (e.target.value) nav(`genre/${encodeURIComponent(e.target.options[e.target.selectedIndex].text)}`); }}>
              <option value="">— All Genres —</option>
              {GENRES.map(([, name]) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Quick Nav</label>
            {([["🏆 Hall of Fame","halloffame"],["✍️ Critics","critics"],["▶ Trailers","trailers"],["👥 Community","community"],["📰 News","news"]] as [string,string][]).map(([label, id]) => (
              <button key={id} className="sidebar-nav-btn" onClick={() => nav(id)}>{label}</button>
            ))}
          </div>
        </aside>

        {/* Main content with page transition */}
        <main className={`main-content${transitioning ? " page-exit" : " page-enter"}`}>
          {renderContent()}
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar glass-panel">
          <div className="sidebar-header">Live Feed</div>
          <div className="ticker-feed">
            {tickerData.map((t, i) => (
              <div key={i} className="ticker-item" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="ticker-meta">
                  <div className="ticker-user">
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: `hsl(${i * 50}, 70%, 40%)`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{t.user[0]}</div>
                    {t.user}
                  </div>
                  <div className="ticker-rating">★ {t.rating}</div>
                </div>
                <div className="ticker-movie">{t.title}</div>
                <div className="ticker-text">&ldquo;{t.text}&rdquo;</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{t.time}</div>
              </div>
            ))}
          </div>
        </aside>

      </div>

      {/* Toast */}
      {toast && (
        <div id="toasts">
          <div className="toast-item">{toast}</div>
        </div>
      )}
    </div>
  );
}
