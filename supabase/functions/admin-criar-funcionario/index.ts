// Edge Function: criar/reativar funcionário (ação de admin).
//
// Por que existe: criar um usuário com e-mail que JÁ existe no Auth, ou definir
// a senha inicial de outra pessoa, exige a service_role key — que não pode ir
// para o frontend. Esta função roda no servidor do Supabase, valida que quem
// chamou é admin (com o JWT do próprio chamador) e só então usa a service_role
// para criar (ou reaproveitar) a conta e gravar a linha em `funcionarios`.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY são injetadas
// automaticamente pelo runtime — não precisa configurar segredo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const URL = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Corpo {
  nome?: string
  email?: string
  senha?: string
}

async function acharUsuarioPorEmail(service: ReturnType<typeof createClient>, email: string) {
  const alvo = email.trim().toLowerCase()
  let page = 1
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const achado = data.users.find((u) => u.email?.toLowerCase() === alvo)
    if (achado) return achado
    if (data.users.length < 200) return null
    page++
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405)

  // 1. Autorização: o chamador precisa ser admin. Usamos o JWT dele (não a
  //    service_role) para avaliar funcionario_eh_admin() como aquele usuário.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ ok: false, erro: 'sem_sessao' }, 401)

  const chamador = createClient(URL, ANON, { global: { headers: { Authorization: authHeader } } })
  const { data: ehAdmin, error: erroAdmin } = await chamador.rpc('funcionario_eh_admin')
  if (erroAdmin) return json({ ok: false, erro: 'sem_sessao' }, 401)
  if (ehAdmin !== true) return json({ ok: false, erro: 'nao_admin' }, 403)

  // 2. Validação da entrada.
  let corpo: Corpo
  try {
    corpo = await req.json()
  } catch {
    return json({ ok: false, erro: 'dados_invalidos' }, 400)
  }
  const nome = (corpo.nome ?? '').trim()
  const email = (corpo.email ?? '').trim()
  const senha = corpo.senha ?? ''
  if (!nome || !email) return json({ ok: false, erro: 'dados_invalidos' }, 400)
  if (senha.length < 6) return json({ ok: false, erro: 'senha_curta' }, 400)

  // 3. Cria ou reaproveita a conta no Auth (service_role).
  const service = createClient(URL, SERVICE_ROLE)
  let uid: string
  let reaproveitado = false

  const { data: criado, error: erroCriar } = await service.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // admin criou → já confirmado, sem e-mail de confirmação
    user_metadata: { nome },
  })

  if (erroCriar) {
    // Provável e-mail já cadastrado: acha a conta e redefine a senha.
    const existente = await acharUsuarioPorEmail(service, email)
    if (!existente) return json({ ok: false, erro: 'falha_criar' }, 500)
    const { error: erroUpdate } = await service.auth.admin.updateUserById(existente.id, {
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    })
    if (erroUpdate) return json({ ok: false, erro: 'falha_criar' }, 500)
    uid = existente.id
    reaproveitado = true
  } else {
    uid = criado.user.id
  }

  // 4. Grava/atualiza a linha em funcionarios. Omitimos `admin` de propósito:
  //    no INSERT usa o default (false); no conflito, preserva o valor atual.
  const { error: erroUpsert } = await service
    .from('funcionarios')
    .upsert({ id: uid, nome, ativo: true, email }, { onConflict: 'id' })
  if (erroUpsert) return json({ ok: false, erro: 'falha_funcionario' }, 500)

  return json({ ok: true, reaproveitado })
})
