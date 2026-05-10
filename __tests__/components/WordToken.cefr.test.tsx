import React from 'react'
import { render } from '@testing-library/react'
import { WordToken } from '@/components/WordToken'
import { CefrLevel, LyricWord } from '@/lib/types'

const makeWord = (text: string, cefr_level?: CefrLevel): LyricWord => ({
  text,
  start_ms: 1000,
  end_ms: 2000,
  ...(cefr_level !== undefined ? { cefr_level } : {}),
})

const noop = () => {}

describe('WordToken CEFR colors', () => {
  it('applies A2 blue color class for A2 words', () => {
    const { container } = render(
      <WordToken
        word={makeWord('dis', 'A2')}
        index={0}
        isActive={false}
        onSeek={noop}
        onTap={noop}
      />
    )
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-blue-400')
  })

  it('applies no CEFR color class when cefr_level is undefined', () => {
    const { container } = render(
      <WordToken
        word={makeWord('unknown')}
        index={0}
        isActive={false}
        onSeek={noop}
        onTap={noop}
      />
    )
    const span = container.querySelector('span')
    const cls = span?.className ?? ''
    expect(cls).not.toContain('text-yellow-400')
    expect(cls).not.toContain('text-orange-400')
    expect(cls).not.toContain('text-red-400')
    expect(cls).not.toContain('text-purple-400')
    // falls back to default slate color
    expect(cls).toContain('text-slate-300')
  })

  it('applies B1 yellow color class for B1 words', () => {
    const { container } = render(
      <WordToken
        word={makeWord('savoir', 'B1')}
        index={0}
        isActive={false}
        onSeek={noop}
        onTap={noop}
      />
    )
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-yellow-400')
  })

  it('applies C1 red color class for C1 words', () => {
    const { container } = render(
      <WordToken
        word={makeWord('néanmoins', 'C1')}
        index={0}
        isActive={false}
        onSeek={noop}
        onTap={noop}
      />
    )
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-red-400')
  })

  it('does not apply CEFR color when word is active (active class takes precedence)', () => {
    const { container } = render(
      <WordToken
        word={makeWord('savoir', 'B1')}
        index={0}
        isActive={true}
        onSeek={noop}
        onTap={noop}
      />
    )
    const span = container.querySelector('span')
    expect(span?.className).toContain('text-blue-400')
    expect(span?.className).toContain('bg-blue-500/15')
  })
})
