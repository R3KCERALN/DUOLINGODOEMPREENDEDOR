import { render, screen } from '@testing-library/react'
import { Markdown } from './Markdown'

test('renderiza títulos, listas, negrito e link seguro', () => {
  render(<Markdown source={'## Ideias\n\n- **abrir** com o porquê\n- [guia](https://exemplo.com)'} />)
  expect(screen.getByRole('heading', { name: 'Ideias', level: 3 })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('abrir').tagName).toBe('STRONG')
  const link = screen.getByRole('link', { name: 'guia' })
  expect(link).toHaveAttribute('href', 'https://exemplo.com')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link).toHaveAttribute('target', '_blank')
})

test('HTML e links perigosos aparecem como texto, sem virar elemento (Review Focus 5)', () => {
  const { container } = render(<Markdown source={'<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[clique](javascript:alert(1))'} />)
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('a')).toBeNull()
  expect(container).toHaveTextContent('<script>alert(1)</script>')
  expect(container).toHaveTextContent('[clique](javascript:alert(1))')
})
