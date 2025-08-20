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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          concern: string
          created_at: string
          doctor_id: string | null
          id: string
          name: string
          phone: string
          pin: number
          reason: string
          serial_number: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          concern: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          name: string
          phone: string
          pin: number
          reason: string
          serial_number: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          concern?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          name?: string
          phone?: string
          pin?: number
          reason?: string
          serial_number?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          availability_date: string
          break_end: string
          break_start: string
          created_at: string
          doctor_id: string | null
          end_time: string
          id: string
          location: string | null
          max_appointments: number
          start_time: string
          updated_at: string
        }
        Insert: {
          availability_date: string
          break_end?: string
          break_start?: string
          created_at?: string
          doctor_id?: string | null
          end_time?: string
          id?: string
          location?: string | null
          max_appointments?: number
          start_time?: string
          updated_at?: string
        }
        Update: {
          availability_date?: string
          break_end?: string
          break_start?: string
          created_at?: string
          doctor_id?: string | null
          end_time?: string
          id?: string
          location?: string | null
          max_appointments?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          auth_user_id: string | null
          created_at: string
          degree: string
          designation: string | null
          experience: string
          id: string
          is_active: boolean
          name: string
          password_hash: string
          specialties: string[] | null
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          degree: string
          designation?: string | null
          experience: string
          id?: string
          is_active?: boolean
          name: string
          password_hash: string
          specialties?: string[] | null
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          degree?: string
          designation?: string | null
          experience?: string
          id?: string
          is_active?: boolean
          name?: string
          password_hash?: string
          specialties?: string[] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          admin_id: string | null
          created_at: string
          doctor_id: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          appointment_id: string
          consultation_notes: string | null
          created_at: string
          doctor_id: string
          id: string
          prescription_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id: string
          consultation_notes?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          prescription_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string
          consultation_notes?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          prescription_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          concern: string
          created_at: string
          id: string
          is_admin: boolean | null
          is_blocked: boolean | null
          name: string
          password: string | null
          phone: string
          pin: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          concern: string
          created_at?: string
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          name: string
          password?: string | null
          phone: string
          pin: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          concern?: string
          created_at?: string
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          name?: string
          password?: string | null
          phone?: string
          pin?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_admin: {
        Args: { user_password: string; user_pin: string }
        Returns: {
          is_admin: boolean
          user_id: string
          user_name: string
        }[]
      }
      authenticate_user_by_pin: {
        Args: { user_phone: string; user_pin: string }
        Returns: {
          user_concern: string
          user_id: string
          user_name: string
        }[]
      }
      count_total_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      grant_admin_access: {
        Args: { user_pin: string }
        Returns: boolean
      }
      is_user_owner: {
        Args: { record_user_id: string }
        Returns: boolean
      }
      reschedule_appointments_for_doctor: {
        Args: {
          p_availability_date: string
          p_break_end: string
          p_break_start: string
          p_doctor_id: string
          p_start_time: string
        }
        Returns: undefined
      }
      revoke_admin_access: {
        Args: { user_pin: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
