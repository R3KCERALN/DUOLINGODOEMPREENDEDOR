// Ícones 1-bit desenhados em grade 7x7: '#' = pixel aceso.
const glyphs = {
  check: ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....', '.......'],
  lock: ['..###..', '.#...#.', '.#...#.', '#######', '###.###', '###.###', '#######'],
  star: ['...#...', '...#...', '..###..', '#######', '..###..', '.##.##.', '##...##'],
  today: ['.#...#.', '#######', '#.....#', '#.##..#', '#.##..#', '#.....#', '#######'],
  trail: ['####...', '#######', '#######', '#..####', '#......', '#......', '#......'],
  reels: ['#######', '#######', '....##.', '...##..', '..##...', '..##...', '..##...'],
  notes: ['######.', '#....##', '#.###.#', '#.....#', '#.###.#', '#.....#', '#######'],
  chest: ['.#####.', '#.....#', '#######', '#..#..#', '#.###.#', '#.....#', '#######'],
} as const

export type PixelGlyph = keyof typeof glyphs

const paths = Object.fromEntries(
  Object.entries(glyphs).map(([name, rows]) => [
    name,
    rows.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `M${x} ${y}h1v1h-1z` : ''))).join(''),
  ]),
) as Record<PixelGlyph, string>

export function PixelIcon({ name, className = 'size-5' }: { name: PixelGlyph; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 7 7" shapeRendering="crispEdges" className={className}>
      <path d={paths[name]} fill="currentColor" />
    </svg>
  )
}
