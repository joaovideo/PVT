import { render, screen } from '@testing-library/react'
import { Badge, type BadgeVariante } from './Badge'

describe('Badge', () => {
  it('renderiza as quatro variantes de status com seus rótulos', () => {
    const casos: Array<[BadgeVariante, string]> = [
      ['livre', 'Livre'],
      ['pago', 'Pago'],
      ['parcial', 'Parcial'],
      ['nao_pago', 'Não pago'],
    ]
    for (const [variante, rotulo] of casos) {
      const { unmount } = render(<Badge variante={variante} />)
      expect(screen.getByText(rotulo)).toBeDefined()
      unmount()
    }
  })
})
