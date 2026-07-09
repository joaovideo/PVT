export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
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
      tarifas: {
        Row: {
          adultos: number
          criancas: number
          id: number
          quarto_id: number
          valor_diaria: number
        }
        Insert: {
          adultos: number
          criancas?: number
          id?: number
          quarto_id: number
          valor_diaria: number
        }
        Update: {
          adultos?: number
          criancas?: number
          id?: number
          quarto_id?: number
          valor_diaria?: number
        }
        Relationships: [
          {
            foreignKeyName: 'tarifas_quarto_id_fkey'
            columns: ['quarto_id']
            isOneToOne: false
            referencedRelation: 'quartos'
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
          total_pago: number | null
          valor_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      funcionario_ativo: { Args: never; Returns: boolean }
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
