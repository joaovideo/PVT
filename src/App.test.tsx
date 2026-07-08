import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('exibe o nome do sistema', () => {
    render(<App />)
    expect(screen.getByText('PVT — Sistema de Reservas')).toBeDefined()
  })
})
