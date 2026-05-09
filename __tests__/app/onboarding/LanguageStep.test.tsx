import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageStep } from '@/app/(onboarding)/onboarding/LanguageStep'

jest.mock('framer-motion', () => ({
  motion: { button: 'button', div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}))

describe('LanguageStep', () => {
  it('renders all 7 language cards', () => {
    render(<LanguageStep selected={null} onSelect={jest.fn()} />)
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Spanish')).toBeInTheDocument()
    expect(screen.getByText('Japanese')).toBeInTheDocument()
    expect(screen.getByText('Russian')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
    expect(screen.getByText('Arabic')).toBeInTheDocument()
    expect(screen.getByText('Chinese')).toBeInTheDocument()
  })

  it('calls onSelect with language code when a card is clicked', () => {
    const onSelect = jest.fn()
    render(<LanguageStep selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('French'))
    expect(onSelect).toHaveBeenCalledWith('fr')
  })

  it('shows selected state for the chosen language', () => {
    render(<LanguageStep selected="fr" onSelect={jest.fn()} />)
    const frenchCard = screen.getByText('French').closest('[data-selected]')
    expect(frenchCard).toHaveAttribute('data-selected', 'true')
  })
})
