import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from '@/components/discover/FilterBar'

describe('FilterBar', () => {
  it('renders All button and all 7 language buttons', () => {
    render(<FilterBar selectedLang={null} onLangChange={jest.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText(/French/)).toBeInTheDocument()
    expect(screen.getByText(/Spanish/)).toBeInTheDocument()
    expect(screen.getByText(/Japanese/)).toBeInTheDocument()
  })

  it('calls onLangChange(null) when All is clicked', () => {
    const onChange = jest.fn()
    render(<FilterBar selectedLang="fr" onLangChange={onChange} />)
    fireEvent.click(screen.getByText('All'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('calls onLangChange with language code when a language is clicked', () => {
    const onChange = jest.fn()
    render(<FilterBar selectedLang={null} onLangChange={onChange} />)
    fireEvent.click(screen.getByText(/French/))
    expect(onChange).toHaveBeenCalledWith('fr')
  })

  it('applies active style to selected language', () => {
    render(<FilterBar selectedLang="fr" onLangChange={jest.fn()} />)
    const frButton = screen.getByText(/French/)
    expect(frButton).toHaveClass('bg-blue-500')
  })
})
