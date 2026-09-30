import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatScore, radarSummary, type RadarPoint } from '@/domain/dashboard'
import { ChartFrame } from './ChartFrame'
import { CHART, INITIAL, TICK, TOOLTIP_STYLE } from './chartTheme'

const cell = (n: number | null) => (n === null ? '—' : formatScore(n))

/** RF-93: média oficial em cada um dos 6 critérios, últimas 4 semanas contra as 4 anteriores (escala de 1 a 5). */
export function CriteriaRadar({ points }: { points: RadarPoint[] }) {
  const hasRecent = points.some((p) => p.recent !== null)
  const hasPrevious = points.some((p) => p.previous !== null)
  const data = points.map((p) => ({ label: p.label, recent: p.recent ?? 0, previous: p.previous ?? 0 }))
  return (
    <ChartFrame
      title="Radar por critério"
      summary={radarSummary(points)}
      table={hasRecent ? {
        head: ['Critério', 'Últimas 4 semanas', 'Período anterior'],
        rows: points.map((p) => [p.label, cell(p.recent), cell(p.previous)]),
      } : undefined}
    >
      {hasRecent && (
        <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL}>
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke={CHART.grid} />
            <PolarAngleAxis dataKey="label" tick={TICK} />
            <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatScore(Number(v))} />
            <Legend wrapperStyle={{ color: CHART.text, fontSize: 12 }} />
            {hasPrevious && (
              <Radar name="Período anterior" dataKey="previous" stroke={CHART.mentor} strokeWidth={2} strokeDasharray="6 4"
                fill="none" isAnimationActive={false} />
            )}
            <Radar name="Últimas 4 semanas" dataKey="recent" stroke={CHART.official} strokeWidth={3}
              fill={CHART.official} fillOpacity={0.25} isAnimationActive={false} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  )
}
