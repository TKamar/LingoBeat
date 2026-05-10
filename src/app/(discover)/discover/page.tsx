'use client'
import { useState, useEffect, useCallback } from 'react'
import { FilterBar } from '@/components/discover/FilterBar'
import { SongCard } from '@/components/home/SongCard'
import { PageTransition } from '@/components/PageTransition'

interface Song { id: string; title: string; artist: string; language_code: string }

export default function DiscoverPage() {
  const [lang, setLang] = useState<string | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSongs = useCallback(async (selectedLang: string | null) => {
    setLoading(true)
    const url = selectedLang
      ? `/api/songs?lang=${selectedLang}&limit=20`
      : '/api/songs?limit=20'
    try {
      const res = await fetch(url)
      const data = await res.json()
      setSongs(data.songs ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSongs(lang)
  }, [lang, fetchSongs])

  return (
    <PageTransition>
      <main className="min-h-screen bg-slate-950 pb-20 px-5 pt-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Discover</h1>
        <FilterBar selectedLang={lang} onLangChange={setLang} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse" />
            ))
          ) : songs.length === 0 ? (
            <p className="col-span-2 text-slate-400 text-center py-12">No songs found</p>
          ) : (
            songs.map(s => <SongCard key={s.id} {...s} />)
          )}
        </div>
      </main>
    </PageTransition>
  )
}
