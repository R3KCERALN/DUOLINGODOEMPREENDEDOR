import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { perceptionSummary, SCORE_RANGE, shortDate, type PerceptionPoint } from '@/domain/dashboard'
import { ChartFrame } from './ChartFrame'
import { CHART, INITIAL, TICK, TOOLTIP_STYLE } from './chartTheme'

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** RF-92: a nota que ela se deu e a do mentor em cada simulado. As duas linhas se distinguem também por traço e marcador. */
export function PerceptionChart({ points, viewer }: { points: PerceptionPoint[]; viewer: 'mentor' | 'aluna' }) {
  const studentName = viewer === 'mentor' ? 'Autoavaliação dela' : 'Sua autoavaliação'
  const data = points.map((p) => ({ label: shortDate(p.day), student: p.student, mentor: p.mentor }))
  return (
    <ChartFrame
      title="Autoavaliação × mentor"
      summary={perceptionSummary(points, viewer)}
      table={points.length === 0 ? undefined : {
        head: ['Simulado', studentName, 'Nota do mentor', 'Diferença'],
        rows: points.map((p) => [shortDate(p.day), p.student, p.mentor, signed(p.gap)]),
      }}
    >
      {points.length > 0 && (
        <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" />
            <XAxis dataKey="label" tick={TICK} stroke={CHART.axis} />
            <YAxis domain={[SCORE_RANGE.min, SCORE_RANGE.max]} tick={TICK} stroke={CHART.axis} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: CHART.text, fontSize: 12 }} />
            <Line type="monotone" dataKey="student" name={studentName} stroke={CHART.student} strokeWidth={3}
              dot={{ r: 4, fill: CHART.student, stroke: CHART.student }} isAnimationActive={false} />
            <Line type="monotone" dataKey="mentor" name="Nota do mentor" stroke={CHART.mentor} strokeWidth={3} strokeDasharray="6 4"
              dot={{ r: 4, fill: 'var(--color-bg)', stroke: CHART.mentor, strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  )
}
