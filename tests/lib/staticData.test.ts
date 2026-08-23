import { describe, it, expect } from 'vitest'
import { MOVIES, CURATED_TV, TV_SHOWS, ALL_CONTENT, GENRES } from '@/lib/staticData'

describe('MOVIES', () => {
  it('is a non-empty catalogue of movies', () => {
    expect(MOVIES.length).toBeGreaterThan(0)
    expect(MOVIES.every(m => m.media_type === 'movie')).toBe(true)
  })

  it('gives every movie a title, poster, trailer and genres', () => {
    for (const movie of MOVIES) {
      expect(movie.title).toBeTruthy()
      expect(movie.poster_path_raw).toMatch(/^https:\/\//)
      expect(movie.backdrop_path_raw).toMatch(/^https:\/\//)
      expect(movie.trailer_key).toMatch(/^[\w-]+$/)
      expect(movie.genre.length).toBeGreaterThan(0)
    }
  })

  it('has unique ids', () => {
    expect(new Set(MOVIES.map(m => m.id)).size).toBe(MOVIES.length)
  })

  it('keeps ratings on a 0-10 scale', () => {
    for (const movie of MOVIES) {
      expect(movie.vote_average).toBeGreaterThan(0)
      expect(movie.vote_average).toBeLessThanOrEqual(10)
    }
  })
})

describe('TV_SHOWS', () => {
  it('lists the curated shows first', () => {
    expect(TV_SHOWS.slice(0, CURATED_TV.length)).toEqual(CURATED_TV)
  })

  it('is much larger than the curated list thanks to the TVMaze dataset', () => {
    expect(TV_SHOWS.length).toBeGreaterThan(CURATED_TV.length)
  })

  it('assigns a trailer key to every show', () => {
    expect(TV_SHOWS.every(s => typeof s.trailer_key === 'string' && s.trailer_key.length > 0)).toBe(
      true
    )
  })

  it('maps a show genre to its curated genre trailer', () => {
    const drama = TV_SHOWS.find(
      s => !CURATED_TV.includes(s as never) && s.genre?.[0] === 'Drama'
    )
    expect(drama?.trailer_key).toBe('HhesaQXLuRY')
  })

  it('falls back to the default trailer for shows with no known genre', () => {
    const unmapped = TV_SHOWS.find(
      s => !CURATED_TV.includes(s as never) && (!s.genre || s.genre.length === 0)
    )
    if (unmapped) expect(unmapped.trailer_key).toBe('HhesaQXLuRY')
  })
})

describe('ALL_CONTENT', () => {
  it('concatenates movies and shows', () => {
    expect(ALL_CONTENT.length).toBe(MOVIES.length + TV_SHOWS.length)
  })

  it('keeps media_type set on every entry', () => {
    expect(ALL_CONTENT.every(c => c.media_type === 'movie' || c.media_type === 'tv')).toBe(true)
  })
})

describe('GENRES', () => {
  it('is a list of [id, name] pairs with unique ids', () => {
    for (const entry of GENRES) {
      expect(entry).toHaveLength(2)
      expect(entry[0]).toMatch(/^\d+$/)
      expect(entry[1]).toBeTruthy()
    }
    expect(new Set(GENRES.map(([id]) => id)).size).toBe(GENRES.length)
  })
})
