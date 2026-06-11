// =============================================================================
// ROHAN'S FINAL CUT — Real Data Engine
// 9,276 real TV shows/anime from TVMaze + curated movies with real trailers
// =============================================================================

// Genre → YouTube trailer key mapping (curated cinematic trailers per genre)
const GENRE_TRAILER_MAP: Record<string, string> = {
  "Drama":           "HhesaQXLuRY", // Breaking Bad
  "Crime":           "ESPySZNiCEI", // Dark
  "Thriller":        "s9APLXM9Ei8", // Chernobyl
  "Action":          "KPLWWIOCOOQ", // Game of Thrones
  "Adventure":       "V75dMMIW2B4", // LOTR
  "Science-Fiction": "b9EkMcFx4t0", // Stranger Things
  "Sci-Fi":          "YoHD9XEInc0", // Inception
  "Fantasy":         "X4MDh8q0oUk", // Lucifer
  "Horror":          "s9APLXM9Ei8", // Chernobyl
  "Supernatural":    "X4MDh8q0oUk", // Lucifer
  "Comedy":          "4afjMwCVPUQ", // South Park
  "Animation":       "ByXuk9QqQkk", // Spirited Away
  "Anime":           "ByXuk9QqQkk", // Spirited Away
  "Romance":         "bLvqoHBptjg", // Forrest Gump
  "Mystery":         "ESPySZNiCEI", // Dark
  "History":         "gG22gcTFVbc", // Schindler's List
  "War":             "gG22gcTFVbc", // Schindler's List
  "Music":           "7d_jQycdQGo", // Whiplash
  "Family":          "bLvqoHBptjg", // Forrest Gump
  "Espionage":       "s9APLXM9Ei8", // Chernobyl
};

function getTrailerForGenres(genres: string[]): string {
  for (const g of genres) {
    if (GENRE_TRAILER_MAP[g]) return GENRE_TRAILER_MAP[g];
  }
  return "HhesaQXLuRY"; // fallback
}

// ─── Curated Movies (matching trailers + TMDB images) ─────────────────────────
export const MOVIES = [
  { id: 278,    title: "The Shawshank Redemption",    media_type: "movie", vote_average: 9.3, poster_path_raw: "https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/avedvodAZUcwqevBfm8p4G2NziQ.jpg",  overview: "Framed in 1947, Andy Dufresne builds a new life at Shawshank prison, forging a powerful friendship with Red.", trailer_key: "6hB3S9bIaco", genre: ["Drama"] },
  { id: 238,    title: "The Godfather",                media_type: "movie", vote_average: 9.2, poster_path_raw: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLegHzgMR55z.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",  overview: "The aging patriarch of a crime dynasty transfers control to his reluctant son.", trailer_key: "sY1S34973zA", genre: ["Crime","Drama"] },
  { id: 155,    title: "The Dark Knight",              media_type: "movie", vote_average: 9.0, poster_path_raw: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CejMOfAJ.jpg",  overview: "Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy.", trailer_key: "EXeTwQWrcwY", genre: ["Action","Crime","Drama"] },
  { id: 424,    title: "Schindler's List",             media_type: "movie", vote_average: 9.0, poster_path_raw: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg",  overview: "Oskar Schindler saves over a thousand Jewish lives from the Nazis during World War II.", trailer_key: "gG22gcTFVbc", genre: ["Drama","History","War"] },
  { id: 240,    title: "The Godfather Part II",        media_type: "movie", vote_average: 9.0, poster_path_raw: "https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/poec6RqOBY9iSiIUmfyfPfiLtvB.jpg",  overview: "The continuing saga of the Corleone crime family through two timelines.", trailer_key: "9O1Iy9od7-A", genre: ["Crime","Drama"] },
  { id: 389,    title: "12 Angry Men",                 media_type: "movie", vote_average: 8.9, poster_path_raw: "https://image.tmdb.org/t/p/w500/ppd84D2i9W8jXmsyInGyihiSyqz.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/qqHQsStV6exghCM7zbObuYBiYxw.jpg",  overview: "A jury holdout attempts to prevent a miscarriage of justice by convincing fellow jurors.", trailer_key: "6GDkIFGWFrY", genre: ["Drama"] },
  { id: 550,    title: "Fight Club",                   media_type: "movie", vote_average: 8.8, poster_path_raw: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/52AfXWuXCHn3UjD17rBruA9f5qb.jpg",  overview: "An insomniac office worker forms an underground fight club with a soap salesman.", trailer_key: "SUXWAEX2jlg", genre: ["Drama","Thriller"] },
  { id: 680,    title: "Pulp Fiction",                 media_type: "movie", vote_average: 8.9, poster_path_raw: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg",  overview: "The lives of two mob hitmen, a boxer, and a pair of bandits intertwine.", trailer_key: "s7EdQ4FqbhY", genre: ["Crime","Drama","Thriller"] },
  { id: 27205,  title: "Inception",                   media_type: "movie", vote_average: 8.8, poster_path_raw: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",  overview: "A thief who steals corporate secrets through dream-sharing technology.", trailer_key: "YoHD9XEInc0", genre: ["Action","Sci-Fi","Thriller"] },
  { id: 603,    title: "The Matrix",                   media_type: "movie", vote_average: 8.7, poster_path_raw: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",  overview: "A hacker discovers the world is a simulation and joins a rebellion against the machines.", trailer_key: "vKQi3bBA1y8", genre: ["Action","Sci-Fi"] },
  { id: 129,    title: "Spirited Away",                media_type: "movie", vote_average: 8.6, poster_path_raw: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",  overview: "A girl discovers a hidden world of spirits and must work to free her enchanted parents.", trailer_key: "ByXuk9QqQkk", genre: ["Animation","Fantasy","Adventure"] },
  { id: 769,    title: "GoodFellas",                   media_type: "movie", vote_average: 8.7, poster_path_raw: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/sw7mordbZxgITU877yTpZCud90M.jpg",  overview: "Henry Hill rises through the mob ranks alongside Jimmy Conway and Tommy DeVito.", trailer_key: "qo5jnBJvGUs", genre: ["Crime","Drama"] },
  { id: 13,     title: "Forrest Gump",                 media_type: "movie", vote_average: 8.8, poster_path_raw: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/ghgfzbEV7kbpbi1O8eIILKVXEA8.jpg",  overview: "A simple man with a big heart witnesses history while looking for love.", trailer_key: "bLvqoHBptjg", genre: ["Drama","Romance"] },
  { id: 120,    title: "The Fellowship of the Ring",   media_type: "movie", vote_average: 8.8, poster_path_raw: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/mHurbT1N9bSHoGvv9oXjTIxsPMV.jpg",  overview: "Frodo Baggins and his companions embark on a quest to destroy the One Ring.", trailer_key: "V75dMMIW2B4", genre: ["Action","Adventure","Fantasy"] },
  { id: 497,    title: "The Green Mile",               media_type: "movie", vote_average: 8.6, poster_path_raw: "https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmU1jmT.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/l6hQWH9eDksNJNiXWYRkWqikOdu.jpg",  overview: "A gentle giant with a mysterious gift arrives on Death Row and changes guards forever.", trailer_key: "Ki4haKSBfwU", genre: ["Crime","Drama","Fantasy"] },
  { id: 637,    title: "Life Is Beautiful",            media_type: "movie", vote_average: 8.6, poster_path_raw: "https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/mfj4PDq6HaBMOI2Yb3xCQRWMZz7.jpg",  overview: "A Jewish father uses his imagination to shield his son from Holocaust horrors.", trailer_key: "kbSmKNABxSE", genre: ["Comedy","Drama","Romance","War"] },
  { id: 11,     title: "Star Wars: A New Hope",        media_type: "movie", vote_average: 8.6, poster_path_raw: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg",  overview: "Luke Skywalker joins the Rebel Alliance to rescue a princess and defeat the Empire.", trailer_key: "1g3_CFmnU7k", genre: ["Action","Adventure","Sci-Fi"] },
  { id: 372754, title: "Whiplash",                    media_type: "movie", vote_average: 8.5, poster_path_raw: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg",  overview: "A talented drummer at a cutthroat music school is pushed to his limits by a brutal teacher.", trailer_key: "7d_jQycdQGo", genre: ["Drama","Music"] },
  { id: 1422,   title: "Interstellar",                media_type: "movie", vote_average: 8.7, poster_path_raw: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/pbrkL804EoFIAl6ATZB1RvOQQOQ.jpg",  overview: "Astronauts travel through a wormhole to find a new home for humanity.", trailer_key: "zSWdZVtXT7E", genre: ["Sci-Fi","Drama","Adventure"] },
  { id: 637094, title: "Thor: Love and Thunder",      media_type: "movie", vote_average: 6.5, poster_path_raw: "https://image.tmdb.org/t/p/w500/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/p1F51Lvj3sMopG948F3vFETx4x2.jpg",  overview: "Thor embarks on an unprecedented journey of self-discovery, joined by Korg and Jane Foster.", trailer_key: "Go8nTmfrQd8", genre: ["Action","Adventure","Fantasy"] },
  { id: 505642, title: "Black Panther: Wakanda Forever", media_type: "movie", vote_average: 7.3, poster_path_raw: "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg", backdrop_path_raw: "https://image.tmdb.org/t/p/original/xDMIl84Qo5Tsu62c9DGWhmPI67A.jpg", overview: "The people of Wakanda fight to protect their home from intervening world powers.", trailer_key: "RlOB3UALvrQ", genre: ["Action","Adventure","Drama"] },
  { id: 315162, title: "Puss in Boots: The Last Wish", media_type: "movie", vote_average: 8.1, poster_path_raw: "https://image.tmdb.org/t/p/w500/kuf6dutpsT0vSVehic3EZIqkOBt.jpg", backdrop_path_raw: "https://image.tmdb.org/t/p/original/cZMnEFwUwJZkeBdLALqF5lFO6bk.jpg", overview: "Puss in Boots discovers his lives are running out and must seek the Last Wish.", trailer_key: "SbWg0bBFtAQ", genre: ["Animation","Adventure","Comedy"] },
  { id: 361743, title: "Top Gun: Maverick",           media_type: "movie", vote_average: 8.3, poster_path_raw: "https://image.tmdb.org/t/p/w500/62HCnUTHOWT7UpKBHBFBcCzLKj6.jpg",  backdrop_path_raw: "https://image.tmdb.org/t/p/original/AEkuoJwEhCHaZ9F9lM6MEYu9DVa.jpg",  overview: "Maverick returns to train Top Gun graduates for a dangerous mission.", trailer_key: "qSqVVswa420", genre: ["Action","Drama"] },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse", media_type: "movie", vote_average: 8.7, poster_path_raw: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdrop_path_raw: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz2neDQ.jpg", overview: "Miles Morales catapults across the Multiverse to meet a new team of Spider-People.", trailer_key: "cqGjhVJWtEg", genre: ["Animation","Action","Adventure"] },
];

// ─── Curated TV Shows (matching trailers) ─────────────────────────────────────
export const CURATED_TV = [
  { id: 1396,  name: "Breaking Bad",           media_type: "tv", vote_average: 9.5, poster_path_raw: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",   backdrop_path_raw: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",  overview: "A chemistry teacher turned methamphetamine producer.", trailer_key: "HhesaQXLuRY", genre: ["Crime","Drama","Thriller"] },
  { id: 1399,  name: "Game of Thrones",         media_type: "tv", vote_average: 9.3, poster_path_raw: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",   backdrop_path_raw: "https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",  overview: "Seven noble families vie for control of Westeros.", trailer_key: "KPLWWIOCOOQ", genre: ["Action","Adventure","Drama"] },
  { id: 87108, name: "Chernobyl",               media_type: "tv", vote_average: 9.4, poster_path_raw: "https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",   backdrop_path_raw: "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",  overview: "The true story of the Chernobyl nuclear disaster.", trailer_key: "s9APLXM9Ei8", genre: ["Drama","History","Thriller"] },
  { id: 66732, name: "Stranger Things",          media_type: "tv", vote_average: 8.7, poster_path_raw: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",   backdrop_path_raw: "https://image.tmdb.org/t/p/original/rcA17r3hfHtRrk3Xs3hXrgGeSGT.jpg",  overview: "A group of kids uncover supernatural mysteries in Hawkins, Indiana.", trailer_key: "b9EkMcFx4t0", genre: ["Drama","Fantasy","Horror","Sci-Fi"] },
  { id: 80089, name: "Dark",                     media_type: "tv", vote_average: 8.8, poster_path_raw: "https://image.tmdb.org/t/p/w500/apbrbWs5M6RezfKL1hljjRaLjoa.jpg",   backdrop_path_raw: "https://image.tmdb.org/t/p/original/vbXBl1tIH1DfLuXa5r6FXQjQo2l.jpg",  overview: "Time travel and family secrets haunt a small German town.", trailer_key: "ESPySZNiCEI", genre: ["Crime","Drama","Mystery","Sci-Fi"] },
  { id: 63174, name: "Lucifer",                  media_type: "tv", vote_average: 8.5, poster_path_raw: "https://image.tmdb.org/t/p/w500/4EYPN5mVIhKLnxzctqPd8q9gKnc.jpg",   backdrop_path_raw: "https://image.tmdb.org/t/p/original/4obIlMI5gIDqkBOPK9RBF0MuNr0.jpg",  overview: "The Devil trades Hell for LA and joins the LAPD.", trailer_key: "X4MDh8q0oUk", genre: ["Crime","Drama","Fantasy"] },
];

// ─── Augment TVMaze data with smart per-genre trailers ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW_TV = (require("./tvmaze.json") as any[]).map((s: any) => ({
  ...s,
  trailer_key: getTrailerForGenres(s.genre || []),
}));

export const TV_SHOWS = [...CURATED_TV, ...RAW_TV];

export const ALL_CONTENT: any[] = [...MOVIES, ...TV_SHOWS];

export const GENRES = [
  ["28","Action"],["12","Adventure"],["16","Animation"],["35","Comedy"],
  ["80","Crime"],["18","Drama"],["14","Fantasy"],["27","Horror"],
  ["9648","Mystery"],["10749","Romance"],["878","Sci-Fi"],["53","Thriller"],
  ["10752","War"],["37","Anime"],
] as [string, string][];
