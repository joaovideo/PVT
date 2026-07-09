import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { formatarData } from '../../lib/formatadores'

export interface Aviso {
  id: number
  mensagem: string
  ocorridoEm: string
}

const DESCRICOES_RELEVANTES = ['Reserva cancelada', 'Check-out realizado']

const SELECT_ENRIQUECIDO = `id, descricao, ocorrido_em,
  funcionario:funcionarios(nome),
  reservas(data_checkin, data_checkout, reserva_segmentos(quartos(nome)))`

interface LinhaEnriquecida {
  id: number
  descricao: string
  ocorrido_em: string
  funcionario: { nome: string } | null
  reservas: {
    data_checkin: string
    data_checkout: string
    reserva_segmentos: { quartos: { nome: string } | null }[]
  } | null
}

function montarMensagem(linha: LinhaEnriquecida): string {
  const quartos = linha.reservas?.reserva_segmentos.map((s) => s.quartos?.nome).join(', ') ?? ''
  const quem = linha.funcionario?.nome ? ` — ${linha.funcionario.nome}` : ''
  if (linha.descricao === 'Reserva cancelada') {
    const periodo = linha.reservas
      ? `${formatarData(linha.reservas.data_checkin)}–${formatarData(linha.reservas.data_checkout)}`
      : ''
    return `${quartos} liberou (${periodo}) — reserva cancelada${quem}`
  }
  return `${quartos} — check-out feito, pode arrumar${quem}`
}

/** Avisos em tempo real de cancelamento/check-out (Supabase Realtime sobre
 *  reserva_eventos). Carrega as últimas 24h ao montar e escuta novos
 *  eventos enquanto o app estiver aberto — sem precisar recarregar. */
export function useAvisosRealtime() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [toast, setToast] = useState<Aviso | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let montado = true

    async function carregarRecentes() {
      const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('reserva_eventos')
        .select(SELECT_ENRIQUECIDO)
        .eq('tipo', 'status')
        .in('descricao', DESCRICOES_RELEVANTES)
        .gte('ocorrido_em', desde)
        .order('ocorrido_em', { ascending: false })
        .returns<LinhaEnriquecida[]>()
      if (error || !montado) return
      setAvisos(
        data.map((l) => ({ id: l.id, mensagem: montarMensagem(l), ocorridoEm: l.ocorrido_em })),
      )
    }

    carregarRecentes()

    const canal = supabase
      .channel('avisos-reserva-eventos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reserva_eventos', filter: 'tipo=eq.status' },
        async (payload) => {
          const descricao = (payload.new as { descricao?: string }).descricao
          if (!descricao || !DESCRICOES_RELEVANTES.includes(descricao)) return
          const id = (payload.new as { id: number }).id
          const { data } = await supabase
            .from('reserva_eventos')
            .select(SELECT_ENRIQUECIDO)
            .eq('id', id)
            .single()
            .returns<LinhaEnriquecida>()
          if (!data || !montado) return
          const aviso: Aviso = {
            id: data.id,
            mensagem: montarMensagem(data),
            ocorridoEm: data.ocorrido_em,
          }
          setAvisos((atual) => [aviso, ...atual])
          setToast(aviso)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => setToast(null), 6000)
        },
      )
      .subscribe()

    return () => {
      montado = false
      supabase.removeChannel(canal)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { avisos, toast, fecharToast: () => setToast(null) }
}
