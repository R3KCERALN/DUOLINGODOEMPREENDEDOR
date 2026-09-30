import { ReviewQueue } from './ReviewQueue'
import { SimulationsHome } from './SimulationsHome'

/** `/simulados`: roleta e histórico; para o mentor, também a fila de treinos para avaliar. */
export function SimulationsPage() {
  return (
    <>
      <SimulationsHome />
      <div className="mx-auto max-w-md px-4 pb-8"><ReviewQueue /></div>
    </>
  )
}
