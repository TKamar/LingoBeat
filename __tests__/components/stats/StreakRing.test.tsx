import { render, screen } from '@testing-library/react'
import { StreakRing } from '@/components/stats/StreakRing'

jest.mock('framer-motion', () => ({
  motion: {
    circle: (props: any) => <circle {...props} />,
    div: 'div',
  },
}))

describe('StreakRing', () => {
  it('renders the streak count', () => {
    render(<StreakRing streak={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders streak label', () => {
    render(<StreakRing streak={0} />)
    expect(screen.getByText(/streak/i)).toBeInTheDocument()
  })

  it('renders 0 streak without crashing', () => {
    render(<StreakRing streak={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
