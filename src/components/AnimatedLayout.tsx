'use client'
import { AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export function AnimatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <div key={pathname} className="flex-1 pb-16">
        {children}
      </div>
    </AnimatePresence>
  )
}
