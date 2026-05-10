import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/BottomNav'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

describe('BottomNav', () => {
  it('renders all 5 navigation tabs', () => {
    (usePathname as jest.Mock).mockReturnValue('/')
    render(<BottomNav />)
    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Discover')).toBeInTheDocument()
    expect(screen.getByLabelText('Player')).toBeInTheDocument()
    expect(screen.getByLabelText('Deck')).toBeInTheDocument()
    expect(screen.getByLabelText('Profile')).toBeInTheDocument()
  })

  it('marks the active tab based on current pathname', () => {
    (usePathname as jest.Mock).mockReturnValue('/deck')
    render(<BottomNav />)
    const deckTab = screen.getByLabelText('Deck')
    expect(deckTab.closest('[data-active="true"]')).not.toBeNull()
  })

  it('does not mark other tabs as active when on /deck', () => {
    (usePathname as jest.Mock).mockReturnValue('/deck')
    render(<BottomNav />)
    const homeTab = screen.getByLabelText('Home')
    expect(homeTab.closest('[data-active="true"]')).toBeNull()
  })
})
