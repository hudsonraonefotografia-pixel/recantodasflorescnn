export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_requests: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cashback_points: {
        Row: {
          display_name: string | null
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      category_multipliers: {
        Row: {
          category_name: string
          created_at: string
          id: string
          points_per_real: number
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          points_per_real?: number
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          points_per_real?: number
        }
        Relationships: []
      }
      farm_points_monthly: {
        Row: {
          display_name: string | null
          id: string
          month: number
          points: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          display_name?: string | null
          id?: string
          month: number
          points?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          display_name?: string | null
          id?: string
          month?: number
          points?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          cpf_cnpj: string
          created_at: string
          endereco: string
          id: string
          nome_completo: string
          nome_estabelecimento: string
          ponto_referencia: string | null
          seguimento: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf_cnpj: string
          created_at?: string
          endereco: string
          id?: string
          nome_completo: string
          nome_estabelecimento: string
          ponto_referencia?: string | null
          seguimento: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string
          endereco?: string
          id?: string
          nome_completo?: string
          nome_estabelecimento?: string
          ponto_referencia?: string | null
          seguimento?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_requests: {
        Row: {
          cep: string | null
          cidade: string
          created_at: string
          endereco: string | null
          finalidade: string
          id: string
          nome_completo: string
          quantidade_media: string
          status: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          cep?: string | null
          cidade: string
          created_at?: string
          endereco?: string | null
          finalidade?: string
          id?: string
          nome_completo: string
          quantidade_media: string
          status?: string
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          cep?: string | null
          cidade?: string
          created_at?: string
          endereco?: string | null
          finalidade?: string
          id?: string
          nome_completo?: string
          quantidade_media?: string
          status?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria: string | null
          codigo_barras: string | null
          created_at: string
          descricao: string | null
          estoque: number
          id: string
          lote: string | null
          nome: string
          preco: number
          preco_parceiro: number | null
          qr_code_id: string | null
          sort_order: number
          unit_type: string
          updated_at: string
          validade: string | null
          visivel_cliente: boolean
          visivel_parceiro: boolean
        }
        Insert: {
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          estoque?: number
          id?: string
          lote?: string | null
          nome: string
          preco: number
          preco_parceiro?: number | null
          qr_code_id?: string | null
          sort_order?: number
          unit_type?: string
          updated_at?: string
          validade?: string | null
          visivel_cliente?: boolean
          visivel_parceiro?: boolean
        }
        Update: {
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          estoque?: number
          id?: string
          lote?: string | null
          nome?: string
          preco?: number
          preco_parceiro?: number | null
          qr_code_id?: string | null
          sort_order?: number
          unit_type?: string
          updated_at?: string
          validade?: string | null
          visivel_cliente?: boolean
          visivel_parceiro?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_cashback: number
          avatar_url: string | null
          cep: string | null
          cidade: string | null
          created_at: string
          display_name: string | null
          endereco: string | null
          id: string
          ponto_referencia: string | null
          referral_code: string | null
          referred_by: string | null
          total_points: number
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          available_cashback?: number
          avatar_url?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          display_name?: string | null
          endereco?: string | null
          id?: string
          ponto_referencia?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          available_cashback?: number
          avatar_url?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          display_name?: string | null
          endereco?: string | null
          id?: string
          ponto_referencia?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          created_at: string
          id: string
          items: Json
          payment_method: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          payment_method: string
          status?: string
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      special_events: {
        Row: {
          active: boolean
          bonus_points: number | null
          config: Json
          created_at: string
          description: string
          end_date: string
          event_type: string
          id: string
          start_date: string
          target_points: number | null
          title: string
        }
        Insert: {
          active?: boolean
          bonus_points?: number | null
          config?: Json
          created_at?: string
          description: string
          end_date: string
          event_type: string
          id?: string
          start_date: string
          target_points?: number | null
          title: string
        }
        Update: {
          active?: boolean
          bonus_points?: number | null
          config?: Json
          created_at?: string
          description?: string
          end_date?: string
          event_type?: string
          id?: string
          start_date?: string
          target_points?: number | null
          title?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          image_url: string | null
          message: string
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message: string
          status?: string
          subject: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mission_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          progress: number
          target: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          progress?: number
          target?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          progress?: number
          target?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "weekly_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          quantity: number
          subscription_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          quantity: number
          subscription_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          quantity?: number
          subscription_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vapid_keys: {
        Row: {
          created_at: string
          id: number
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string
          id?: number
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string
          id?: number
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
      weekly_missions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          mission_type: string
          reward_points: number
          target_value: Json
          title: string
          week_end: string
          week_start: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          mission_type: string
          reward_points: number
          target_value?: Json
          title: string
          week_end: string
          week_start: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          mission_type?: string
          reward_points?: number
          target_value?: Json
          title?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
