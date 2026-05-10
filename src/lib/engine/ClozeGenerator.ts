interface LyricWordMinimal { word: string; startMs: number }
interface LyricLineMinimal { startMs: number; endMs: number; text: string }

export interface ClozeCard {
  word: string
  lyric_line: string
  choices: string[]
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateCloze(
  targetWord: string,
  words: LyricWordMinimal[],
  lines: LyricLineMinimal[]
): ClozeCard {
  const targetWordLower = targetWord.toLowerCase()
  const wordObj = words.find(w => w.word.toLowerCase() === targetWordLower)
  const line = wordObj
    ? lines.find(l => l.startMs <= wordObj.startMs && wordObj.startMs <= l.endMs)
    : null

  const lyricText = line?.text ?? targetWord
  // \b only works with ASCII; use lookaround for non-ASCII characters (e.g. accented French words)
  const escapedWord = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const boundaryRegex = new RegExp(`(?<![\\w\\u00C0-\\u024F])${escapedWord}(?![\\w\\u00C0-\\u024F])`, 'i')
  const replaced = lyricText.replace(boundaryRegex, '___')
  const lyric_line = replaced !== lyricText ? replaced : lyricText.replace(new RegExp(escapedWord, 'i'), '___')

  const others = words
    .map(w => w.word)
    .filter(w => w.toLowerCase() !== targetWordLower && w.length > 1)
  const unique = [...new Set(others)]

  const shuffled = shuffleArray(unique)
  const distractors = shuffled.slice(0, 3)

  while (distractors.length < 3) {
    distractors.push(`option${distractors.length}`)
  }

  const choices = shuffleArray([targetWord, ...distractors])
  return { word: targetWord, lyric_line, choices }
}
