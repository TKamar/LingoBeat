import { render, screen, fireEvent } from '@testing-library/react'
import { GoalStep } from '@/app/(onboarding)/onboarding/GoalStep'

jest.mock('framer-motion', () => ({
  motion: { button: 'button' },
}))

describe('GoalStep', () => {
  it('renders all 4 goal options', () => {
    render(<GoalStep selected={20} onSelect={jest.fn()} />)
    expect(screen.getByText('10 XP')).toBeInTheDocument()
    expect(screen.getByText('20 XP')).toBeInTheDocument()
    expect(screen.getByText('30 XP')).toBeInTheDocument()
    expect(screen.getByText('50 XP')).toBeInTheDocument()
  })

  it('renders goal labels', () => {
    render(<GoalStep selected={20} onSelect={jest.fn()} />)
    expect(screen.getByText('Casual')).toBeInTheDocument()
    expect(screen.getByText('Regular')).toBeInTheDocument()
    expect(screen.getByText('Serious')).toBeInTheDocument()
    expect(screen.getByText('Intense')).toBeInTheDocument()
  })

  it('calls onSelect with correct XP value when clicked', () => {
    const onSelect = jest.fn()
    render(<GoalStep selected={20} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('30 XP'))
    expect(onSelect).toHaveBeenCalledWith(30)
  })
})
