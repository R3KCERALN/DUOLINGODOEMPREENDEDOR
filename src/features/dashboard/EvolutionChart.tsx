import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { evolutionSummary, formatScore, SCORE_GOALS, SCORE_RANGE, shortDate, type WeekPoint } from '@/domain/dashboard'
import { ChartFrame } from './ChartFrame'
import { CHART, INITIAL, TICK, TOOLTIP_STYLE } from './chartTheme'

/** Faixa à direita do gráfico para os rótulos das metas: fora da área dos dados, nunca por cima de um ponto. */
const GOAL_LABEL_GUTTER = 56

/** RF-91: média oficial por semana, com as metas 15 (Fase 2) e 22 (Fase 4). */
export function EvolutionChart({ points }: { points: WeekPoint[] }) {
  const data = points.map((p) => ({ label: shortDate(p.weekStart), avg: p.avg }))
  return (
    <ChartFrame
      title="Evolução das notas"
      summary={evolutionSummary(points)}
      table={points.length === 0 ? undefined : {
        head: ['Semana', 'Média oficial', 'Simulados'],
        rows: points.map((p) => [`Semana de ${shortDate(p.weekStart)}`, formatScore(p.avg), p.count]),
      }}
    >
      {points.length > 0 && (
        <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL}>
          <LineChart data={data} margin={{ top: 8, right: GOAL_LABEL_GUTTER, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" />
            <XAxis dataKey="label" tick={TICK} stroke={CHART.axis} />
            <YAxis domain={[SCORE_RANGE.min, SCORE_RANGE.max]} tick={TICK} stroke={CHART.axis} />
            <ReferenceLine y={SCORE_GOALS.f2} stroke={CHART.goalF2} strokeDasharray="6 3"
              label={{ value: 'Meta 15', fill: CHART.goalF2, fontSize: 12, position: 'right' }} />
            <ReferenceLine y={SCORE_GOALS.f4} stroke={CHART.goalF4} strokeDasharray="2 3"
              label={{ value: 'Meta 22', fill: CHART.goalF4, fontSize: 12, position: 'right' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatScore(Number(v))} />
            <Line type="monotone" dataKey="avg" name="Média oficial" stroke={CHART.official} strokeWidth={3}
              dot={{ r: 4, fill: CHART.official, stroke: CHART.official }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  )
}
