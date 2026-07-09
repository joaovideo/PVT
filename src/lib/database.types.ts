export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      bloqueios: {
        Row: {
          criado_em: string
          criado_por: string
          data_fim: string
          data_inicio: string
          id: number
          motivo: string
          quarto_id: number
        }
        Insert: {
          criado_em?: string
          criado_por: string
          data_fim: string
          data_inicio: string
          id?: number
          motivo: string
          quarto_id: number
        }
        Update: {
          criado_em?: string
          criado_por?: string
          data_fim?: string
          data_inicio?: string
          id?: number
          motivo?: string
          quarto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'bloqueios_criado_por_fkey'
            columns: ['criado_por']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bloqueios_quarto_id_fkey'
            columns: ['quarto_id']
            isOneToOne: false
            referencedRelation: 'quartos'
            referencedColumns: ['id']
          },
        ]
      }
      config_pousada: {
        Row: {
          adulto_valor_desconto: number
          adulto_valor_full: number
          adulto_valor_normal: number
          crianca_idade_max: number
          crianca_valor_desconto: number
          crianca_valor_full: number
          crianca_valor_normal: number
          id: number
        }
        Insert: {
          adulto_valor_desconto: number
          adulto_valor_full: number
          adulto_valor_normal: number
          crianca_idade_max?: number
          crianca_valor_desconto: number
          crianca_valor_full: number
          crianca_valor_normal: number
          id?: number
        }
        Update: {
          adulto_valor_desconto?: number
          adulto_valor_full?: number
          adulto_valor_normal?: number
          crianca_idade_max?: number
          crianca_valor_desconto?: number
          crianca_valor_full?: number
          crianca_valor_normal?: number
          id?: number
        }
        Relationships: []
      }
      despesas_extras: {
        Row: {
          descricao: string
          id: number
          lancada_em: string
          lancada_por: string
          quantidade: number
          reserva_id: number
          valor_unitario: number
        }
        Insert: {
          descricao: string
          id?: number
          lancada_em?: string
          lancada_por: string
          quantidade?: number
          reserva_id: number
          valor_unitario: number
        }
        Update: {
          descricao?: string
          id?: number
          lancada_em?: string
          lancada_por?: string
          quantidade?: number
          reserva_id?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: 'despesas_extras_lancada_por_fkey'
            columns: ['lancada_por']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'despesas_extras_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'despesas_extras_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas_financeiro'
            referencedColumns: ['id']
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
        }
        Relationships: []
      }
      hospedes: {
        Row: {
          documento: string | null
          email: string | null
          id: number
          nome: string
          telefone: string | null
        }
        Insert: {
          documento?: string | null
          email?: string | null
          id?: number
          nome: string
          telefone?: string | null
        }
        Update: {
          documento?: string | null
          email?: string | null
          id?: number
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          id: number
          metodo: string
          observacao: string | null
          recebido_em: string
          recebido_por: string
          reserva_id: number
          valor: number
        }
        Insert: {
          id?: number
          metodo: string
          observacao?: string | null
          recebido_em?: string
          recebido_por: string
          reserva_id: number
          valor: number
        }
        Update: {
          id?: number
          metodo?: string
          observacao?: string | null
          recebido_em?: string
          recebido_por?: string
          reserva_id?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pagamentos_recebido_por_fkey'
            columns: ['recebido_por']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagamentos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pagamentos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas_financeiro'
            referencedColumns: ['id']
          },
        ]
      }
      quartos: {
        Row: {
          ativo: boolean
          camas_casal: number
          camas_solteiro: number
          capacidade_max: number
          id: number
          nome: string
          observacoes: string | null
        }
        Insert: {
          ativo?: boolean
          camas_casal?: number
          camas_solteiro?: number
          capacidade_max: number
          id?: number
          nome: string
          observacoes?: string | null
        }
        Update: {
          ativo?: boolean
          camas_casal?: number
          camas_solteiro?: number
          capacidade_max?: number
          id?: number
          nome?: string
          observacoes?: string | null
        }
        Relationships: []
      }
      reserva_eventos: {
        Row: {
          descricao: string
          funcionario_id: string | null
          id: number
          ocorrido_em: string
          reserva_id: number
          tipo: string
        }
        Insert: {
          descricao: string
          funcionario_id?: string | null
          id?: number
          ocorrido_em?: string
          reserva_id: number
          tipo: string
        }
        Update: {
          descricao?: string
          funcionario_id?: string | null
          id?: number
          ocorrido_em?: string
          reserva_id?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reserva_eventos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reserva_eventos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reserva_eventos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas_financeiro'
            referencedColumns: ['id']
          },
        ]
      }
      reserva_segmentos: {
        Row: {
          cancelado: boolean
          data_fim: string
          data_inicio: string
          id: number
          quarto_id: number
          reserva_id: number
        }
        Insert: {
          cancelado?: boolean
          data_fim: string
          data_inicio: string
          id?: number
          quarto_id: number
          reserva_id: number
        }
        Update: {
          cancelado?: boolean
          data_fim?: string
          data_inicio?: string
          id?: number
          quarto_id?: number
          reserva_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'reserva_segmentos_quarto_id_fkey'
            columns: ['quarto_id']
            isOneToOne: false
            referencedRelation: 'quartos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reserva_segmentos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reserva_segmentos_reserva_id_fkey'
            columns: ['reserva_id']
            isOneToOne: false
            referencedRelation: 'reservas_financeiro'
            referencedColumns: ['id']
          },
        ]
      }
      reservas: {
        Row: {
          adultos: number
          criada_em: string
          criada_por: string
          criancas: number
          data_checkin: string
          data_checkout: string
          hora_chegada_prevista: string | null
          hospede_id: number
          id: number
          nivel_preco: string
          observacoes: string | null
          status: string
          valor_total: number
        }
        Insert: {
          adultos?: number
          criada_em?: string
          criada_por: string
          criancas?: number
          data_checkin: string
          data_checkout: string
          hora_chegada_prevista?: string | null
          hospede_id: number
          id?: number
          nivel_preco?: string
          observacoes?: string | null
          status?: string
          valor_total: number
        }
        Update: {
          adultos?: number
          criada_em?: string
          criada_por?: string
          criancas?: number
          data_checkin?: string
          data_checkout?: string
          hora_chegada_prevista?: string | null
          hospede_id?: number
          id?: number
          nivel_preco?: string
          observacoes?: string | null
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'reservas_criada_por_fkey'
            columns: ['criada_por']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservas_hospede_id_fkey'
            columns: ['hospede_id']
            isOneToOne: false
            referencedRelation: 'hospedes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      reservas_financeiro: {
        Row: {
          id: number | null
          situacao: string | null
          total_despesas: number | null
          total_pago: number | null
          valor_final: number | null
          valor_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      criar_reserva: {
        Args: {
          p_adultos: number
          p_checkin: string
          p_checkout: string
          p_criancas: number
          p_hora_chegada?: string
          p_hospede_id?: number
          p_hospede_nome?: string
          p_hospede_telefone?: string
          p_nivel: string
          p_quarto_id: number
          p_sinal_metodo?: string
          p_sinal_valor?: number
          p_valor_total: number
        }
        Returns: number
      }
      dearmor: { Args: { '': string }; Returns: string }
      formatar_brl: { Args: { v: number }; Returns: string }
      funcionario_ativo: { Args: never; Returns: boolean }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { '': string }; Returns: string }
      pgp_armor_headers: {
        Args: { '': string }
        Returns: Record<string, unknown>[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
