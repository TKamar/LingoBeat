import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WordPopover } from '@/components/WordPopover'

const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button', span: 'span' },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } } }),
}))

const mockWord = { text: 'dis-moi', start_ms: 5000, end_ms: 8000 }

describe('WordPopover', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when word is null', () => {
    render(<WordPopover word={null} languageCode="fr" onClose={() => {}} onSaved={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows dialog with word text when word is selected', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<WordPopover word={mockWord} languageCode="fr" onClose={() => {}} onSaved={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('dis-moi')).toBeInTheDocument()
  })

  it('shows analysis after fetch resolves', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ipa: '/di.mwa/', meaning: 'tell me', register: 'informal',
        slang_notes: null, examples: ['Dis-moi tout.'], provider: 'haiku', is_partial: false,
      }),
    })
    render(<WordPopover word={mockWord} languageCode="fr" onClose={() => {}} onSaved={() => {}} />)
    await waitFor(() => expect(screen.getByText('/di.mwa/')).toBeInTheDocument())
    expect(screen.getByText('tell me')).toBeInTheDocument()
  })

  it('shows partial data warning when is_partial is true', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ipa: '/di.mwa/', meaning: 'tell me', register: 'neutral',
        slang_notes: null, examples: [], provider: 'free', is_partial: true,
      }),
    })
    render(<WordPopover word={mockWord} languageCode="fr" onClose={() => {}} onSaved={() => {}} />)
    await waitFor(() => expect(screen.getByText(/limited analysis/i)).toBeInTheDocument())
  })

  it('calls onClose when close button clicked', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    const onClose = jest.fn()
    render(<WordPopover word={mockWord} languageCode="fr" onClose={onClose} onSaved={() => {}} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows error message when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 502 })
    render(<WordPopover word={mockWord} languageCode="fr" onClose={() => {}} onSaved={() => {}} />)
    await waitFor(() => expect(screen.getByText(/unavailable/i)).toBeInTheDocument())
  })
})
