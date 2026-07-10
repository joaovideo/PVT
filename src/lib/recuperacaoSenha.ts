import { supabase } from './supabaseClient'

/** Motivo da falha ao processar o link de recuperação, quando houver. Preenchido
 *  por `consumirHashDeRecuperacao` antes do React montar; lido pela tela de nova
 *  senha para explicar à pessoa o que deu errado. */
export const estadoRecuperacao: { erro: string | null } = { erro: null }

/** O link do e-mail volta para a raiz do site com o token no hash
 *  (#access_token=...&type=recovery), ou — se o token já foi usado ou expirou —
 *  com um hash de erro (#error=...&error_code=otp_expired). Os dois colidem com
 *  o HashRouter. Consumimos ambos aqui, antes do React montar, e reescrevemos a
 *  URL para a rota /nova-senha já limpa. */
export async function consumirHashDeRecuperacao(): Promise<void> {
  const hashBruto = window.location.hash.replace(/^#/, '')
  const rotaNovaSenha = `${import.meta.env.BASE_URL}#/nova-senha`

  const inicioToken = hashBruto.indexOf('access_token=')
  if (inicioToken !== -1 && hashBruto.includes('type=recovery')) {
    const params = new URLSearchParams(hashBruto.slice(inicioToken))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    history.replaceState(null, '', rotaNovaSenha)

    if (!accessToken || !refreshToken) {
      estadoRecuperacao.erro = 'O link chegou incompleto.'
      return
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) estadoRecuperacao.erro = error.message
    return
  }

  const inicioErro = hashBruto.indexOf('error=')
  if (inicioErro !== -1) {
    const params = new URLSearchParams(hashBruto.slice(inicioErro))
    estadoRecuperacao.erro =
      params.get('error_description') ?? params.get('error_code') ?? 'Link inválido.'
    history.replaceState(null, '', rotaNovaSenha)
  }
}
