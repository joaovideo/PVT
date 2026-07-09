import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'

vi.mock('../features/auth/useFuncionarioAtual', () => ({
  useFuncionarioAtual: () => ({
    carregando: false,
    session: {},
    funcionario: { id: '1', nome: 'Ana Ribeiro', ativo: true },
    sair: vi.fn(),
  }),
}))

describe('AppShell', () => {
  it('exibe o nome do funcionário no cabeçalho e as 4 abas de navegação', () => {
    render(
      <MemoryRouter initialEntries={['/mapa']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/mapa" element={<p>conteúdo do mapa</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Ana Ribeiro')).toBeDefined()
    for (const aba of ['Mapa', 'Chegadas', 'Reservas', 'Admin']) {
      expect(screen.getByRole('link', { name: aba })).toBeDefined()
    }
    expect(screen.getByText('conteúdo do mapa')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeDefined()
  })
})
