import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('sem sessão, exibe a tela de login com o nome do sistema', async () => {
    render(<App />)
    expect(await screen.findByText('PVT — Sistema de Reservas')).toBeDefined()
    expect(await screen.findByText('Acesso de funcionários')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDefined()
  })
})
