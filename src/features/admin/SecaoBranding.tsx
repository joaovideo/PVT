import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { usePousada, useAtualizarBranding } from '../pousada/usePousada'

// Defaults = tokens do index.css, usados quando a pousada ainda não tem cor.
const PADRAO = { primaria: '#1e293b', secundaria: '#64748b', fundo: '#f8fafc' }

export function SecaoBranding() {
  const pousada = usePousada()
  const salvar = useAtualizarBranding()

  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [corPrimaria, setCorPrimaria] = useState(PADRAO.primaria)
  const [corSecundaria, setCorSecundaria] = useState(PADRAO.secundaria)
  const [corFundo, setCorFundo] = useState(PADRAO.fundo)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const p = pousada.data
    if (!p) return
    setNome(p.nome_exibicao)
    setEndereco(p.endereco ?? '')
    setCorPrimaria(p.cor_primaria ?? PADRAO.primaria)
    setCorSecundaria(p.cor_secundaria ?? PADRAO.secundaria)
    setCorFundo(p.cor_fundo ?? PADRAO.fundo)
  }, [pousada.data])

  if (!pousada.data) return null

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const p = pousada.data
    if (!p) return
    setErro(null)
    setSalvo(false)
    try {
      await salvar.mutateAsync({
        id: p.id,
        nome_exibicao: nome.trim() || 'Pousada',
        endereco: endereco.trim() || null,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        cor_fundo: corFundo,
      })
      setSalvo(true)
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-bold text-slate-800">Identidade visual</h2>
      <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg bg-white p-3">
        <Input
          rotulo="Nome exibido"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setSalvo(false)
          }}
        />
        <Input
          rotulo="Endereço"
          value={endereco}
          onChange={(e) => {
            setEndereco(e.target.value)
            setSalvo(false)
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            rotulo="Cor principal"
            type="color"
            value={corPrimaria}
            onChange={(e) => {
              setCorPrimaria(e.target.value)
              setSalvo(false)
            }}
          />
          <Input
            rotulo="Cor secundária"
            type="color"
            value={corSecundaria}
            onChange={(e) => {
              setCorSecundaria(e.target.value)
              setSalvo(false)
            }}
          />
          <Input
            rotulo="Cor de fundo"
            type="color"
            value={corFundo}
            onChange={(e) => {
              setCorFundo(e.target.value)
              setSalvo(false)
            }}
          />
        </div>
        <p className="text-xs text-slate-400">
          O logo será adicionável em breve (upload). Por enquanto, edite nome, endereço e cores.
        </p>
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : 'Salvar identidade'}
        </Button>
        {salvo && <p className="text-sm text-green-700">Salvo! As cores já foram aplicadas.</p>}
      </form>
    </section>
  )
}
