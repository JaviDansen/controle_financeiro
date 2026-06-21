import { createWorker } from 'tesseract.js'

type HeaderMatchKind = 'relative' | 'calendar'

export type DateHeaderAnalysis = {
  valid: boolean
  score: number
  matchedKind?: HeaderMatchKind
  matchedLine?: string
  matchedLines: string[]
  lines: string[]
  text: string
}

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const MONTH_ALIASES = [
  ...MONTH_NAMES,
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

const MONTH_PATTERN = `(?:${MONTH_ALIASES.join('|')})`
const RELATIVE_HEADER_PATTERN = /\b(hoje|ontem)\b/i
const CALENDAR_HEADER_PATTERN = new RegExp(`\\b\\d{1,2}\\s+de\\s+${MONTH_PATTERN}(?:\\s+de\\s+\\d{4})?\\b`, 'i')

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[|]/g, 'l')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function scoreHeaderLine(line: string): { score: number; kind?: HeaderMatchKind } {
  const normalized = normalizeText(line)
  if (!normalized) return { score: 0 }

  const compact = normalized.replace(/[^\p{L}\p{N}\s]/gu, '').trim()

  if (/^(hoje|ontem)$/.test(compact)) {
    return { score: 5, kind: 'relative' }
  }

  if (new RegExp(`^\\d{1,2}\\s+de\\s+${MONTH_PATTERN}(?:\\s+de\\s+\\d{4})?$`, 'i').test(compact)) {
    return { score: 5, kind: 'calendar' }
  }

  if (compact.length <= 18 && RELATIVE_HEADER_PATTERN.test(compact)) {
    return { score: 3, kind: 'relative' }
  }

  if (compact.length <= 28 && CALENDAR_HEADER_PATTERN.test(compact)) {
    return { score: 3, kind: 'calendar' }
  }

  return { score: 0 }
}

export function analyzeDateHeaderText(text: string): DateHeaderAnalysis {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let bestScore = 0
  let matchedKind: HeaderMatchKind | undefined
  let matchedLine: string | undefined
  const matchedLines: string[] = []

  for (const line of lines) {
    const { score, kind } = scoreHeaderLine(line)
    if (score > 0) {
      matchedLines.push(line)
    }
    if (score > bestScore) {
      bestScore = score
      matchedKind = kind
      matchedLine = line
    }
  }

  return {
    valid: bestScore >= 3,
    score: bestScore,
    matchedKind,
    matchedLine,
    matchedLines,
    lines,
    text,
  }
}

export async function analyzeDateHeaderImage(imagePath: string): Promise<DateHeaderAnalysis> {
  const worker = await createWorker('por')

  try {
    const { data } = await worker.recognize(imagePath)
    return analyzeDateHeaderText(data.text ?? '')
  } finally {
    await worker.terminate()
  }
}
