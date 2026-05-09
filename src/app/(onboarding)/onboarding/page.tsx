'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LanguageStep } from './LanguageStep'
import { GoalStep } from './GoalStep'
import type { LanguageCode } from '@/lib/languages'

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState<LanguageCode | null>(null)
  const [goal, setGoal] = useState(20)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleFinish() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_language: language, daily_goal_xp: goal, onboarding_done: true }),
      })
      if (!res.ok) throw new Error('Failed to save preferences')
      router.push('/')
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      {/* Step dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-blue-400' : 'bg-slate-700'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="lang" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-slate-100 mb-2 text-center">What do you want to learn?</h1>
            <p className="text-slate-400 text-center mb-8">Pick your target language</p>
            <LanguageStep selected={language} onSelect={setLanguage} />
            <button
              disabled={!language}
              onClick={() => setStep(1)}
              className="mt-8 w-full py-3 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 transition-opacity"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="goal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-slate-100 mb-2 text-center">Set your daily goal</h1>
            <p className="text-slate-400 text-center mb-8">How much do you want to practice?</p>
            <GoalStep selected={goal} onSelect={setGoal} />
            {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
            <button
              onClick={handleFinish}
              disabled={saving}
              className="mt-8 w-full py-3 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40"
            >
              {saving ? 'Saving...' : "Let's go! 🚀"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
