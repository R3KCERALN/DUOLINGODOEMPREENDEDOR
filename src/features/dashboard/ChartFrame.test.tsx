import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartFrame } from './ChartFrame'

test('estado vazio: título e resumo, sem gráfico nem tabela', () => {
  const { container } = render(<ChartFrame title="Evolução das notas" summary="Ainda não há simulados." />)
  expect(screen.getByRole('heading', { level: 2, name: 'Evolução das notas' })).toBeInTheDocument()
  expect(screen.getByText('Ainda não há simulados.')).toBeVisible()
  expect(screen.queryByText('Ver os dados em tabela')).not.toBeInTheDocument()
  expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
})

test('com gráfico e tabela: o gráfico fica escondido dos leitores de tela e os dados viram tabela', async () => {
  const { container } = render(
    <ChartFrame title="T" summary="Resumo" table={{ head: ['Semana', 'Média'], rows: [['21/09', '17,0'], ['28/09', '18,5']] }}>
      <svg data-testid="grafico" />
    </ChartFrame>,
  )
  expect(container.querySelector('[aria-hidden="true"]')).toContainElement(screen.getByTestId('grafico'))
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  expect(screen.getByRole('table', { name: 'T' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Média' })).toBeInTheDocument()
  expect(screen.getByRole('row', { name: /28\/09.*18,5/ })).toBeInTheDocument()
})
