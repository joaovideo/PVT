import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'

const estado = vi.hoisted(() => ({
  funcionario: null as { id: string; nome: string; ativo: boolean; admin?: boolean } | null,
}))

vi.mock('../features/auth/useFuncionarioAtual', () => ({
  useFuncionarioAtual: () => ({
    carregando: false,
    session: {},
    funcionario: estado.funcionario,
    sair: vi.fn(),
  }),
}))

function renderShell() {
  render(
    <MemoryRouter initialEntries={['/mapa']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/mapa" element={<p>conteúdo do mapa</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('funcionário comum vê Mapa/Chegadas/Reservas, sem a aba Admin', () => {
    estado.funcionario = { id: '1', nome: 'Ana Ribeiro', ativo: true }
    renderShell()

    expect(screen.getByText('Ana Ribeiro')).toBeDefined()
    for (const aba of ['Mapa', 'Chegadas', 'Reservas']) {
      expect(screen.getByRole('link', { name: aba })).toBeDefined()
    }
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull()
    expect(screen.getByText('conteúdo do mapa')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeDefined()
  })

  it('administrador vê também a aba Admin (4 abas)', () => {
    estado.funcionario = { id: '1', nome: 'Ana Ribeiro', ativo: true, admin: true }
    renderShell()

    for (const aba of ['Mapa', 'Chegadas', 'Reservas', 'Admin']) {
      expect(screen.getByRole('link', { name: aba })).toBeDefined()
    }
  })
})
