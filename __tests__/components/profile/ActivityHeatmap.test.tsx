import { render, screen } from '@testing-library/react'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'

describe('ActivityHeatmap', () => {
  it('renders 30 day cells', () => {
    render(<ActivityHeatmap dailyXP={{}} />)
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(30)
  })

  it('shows higher intensity for days with more XP', () => {
    const today = new Date()
    const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const { container } = render(<ActivityHeatmap dailyXP={{ [day]: 15 }} />)
    const activeCells = container.querySelectorAll('[data-intensity="high"]')
    expect(activeCells.length).toBeGreaterThan(0)
  })
})
