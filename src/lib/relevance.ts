/** Pontuação simples e explicável de relevância para o ecossistema Xbox (0 a 100). */
const STRONG: [RegExp, number][] = [
  [/\bxbox\b/i, 30],
  [/game ?pass/i, 30],
  [/\bxcloud\b/i, 25],
  [/series [xs]\b|series x\|s/i, 20],
  [/\b(id@xbox|inside xbox|xbox wire|xbox game studios|xbox games showcase)\b/i, 25],
  [/\b(bethesda|activision|blizzard|mojang|obsidian|playground games|rare|compulsion|ninja theory|the coalition|turn 10|double fine|inxile)\b/i, 14],
  [/\b(halo|forza|gears of war|fable|starfield|elder scrolls|fallout|minecraft|call of duty|diablo|sea of thieves|flight simulator|avowed|hellblade|age of empires|state of decay|grounded|outer worlds)\b/i, 12],
  [/\b(phil spencer|sarah bond|matt booty)\b/i, 14],
  [/\bmicrosoft gaming\b/i, 18],
]
const RUMOR = /\b(rumou?r|rumor|leak|leaked|leaks|reportedly|allegedly|insider|vazamento|vaza|segundo fontes|supostamente)\b/i

export function scoreRelevance(input: { title: string; text: string; official: boolean; onlyXboxFeed: boolean; ageHours: number }) {
  const t = input.title
  const body = input.text.slice(0, 1200)
  let score = input.onlyXboxFeed ? 45 : 0
  for (const [re, w] of STRONG) {
    if (re.test(t)) score += w
    else if (re.test(body)) score += Math.round(w / 3)
  }
  if (input.official) score += 15
  if (input.ageHours < 3) score += 8
  else if (input.ageHours < 12) score += 4
  return { score: Math.max(0, Math.min(100, score)), isRumor: RUMOR.test(t) || RUMOR.test(body.slice(0, 300)) }
}

const STOP = new Set('the a an of to in on for and with is are will new from at by as it its this that be has have after into over about para com de da do das dos que em um uma os as no na por mais'.split(' '))
export const titleTokens = (s: string): Set<string> =>
  new Set(
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  )

export function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  a.forEach((x) => b.has(x) && inter++)
  return inter / (a.size + b.size - inter)
}
