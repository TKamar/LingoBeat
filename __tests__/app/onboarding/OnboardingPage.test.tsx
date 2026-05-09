import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingPage from '@/app/(onboarding)/onboarding/page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('framer-motion', () => ({
  motion: { button: 'button', div: 'div' },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('OnboardingPage', () => {
  it('shows Continue button disabled on first render', () => {
    render(<OnboardingPage />)
    const btn = screen.getByText('Continue →')
    expect(btn).toBeDisabled()
  })

  it('enables Continue button after language selection', () => {
    render(<OnboardingPage />)
    fireEvent.click(screen.getByText('French'))
    const btn = screen.getByText('Continue →')
    expect(btn).not.toBeDisabled()
  })

  it('advances to step 2 when Continue is clicked with a language selected', () => {
    render(<OnboardingPage />)
    fireEvent.click(screen.getByText('French'))
    fireEvent.click(screen.getByText('Continue →'))
    expect(screen.getByText("Set your daily goal")).toBeInTheDocument()
  })
})
