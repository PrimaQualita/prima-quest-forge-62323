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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          category: string
          content: string | null
          correct_answer: string
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          quiz_options: Json
          quiz_question: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: string | null
          correct_answer: string
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          quiz_options: Json
          quiz_question: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          correct_answer?: string
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          quiz_options?: Json
          quiz_question?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          month: number
          uploaded_by: string | null
          year: number
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          month: number
          uploaded_by?: string | null
          year: number
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          month?: number
          uploaded_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "management_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          document_id: string
          employee_id: string
          id: string
          quiz_answered: boolean | null
          quiz_correct: boolean | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          document_id: string
          employee_id: string
          id?: string
          quiz_answered?: boolean | null
          quiz_correct?: boolean | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          document_id?: string
          employee_id?: string
          id?: string
          quiz_answered?: boolean | null
          quiz_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_acknowledgments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acknowledgments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      due_diligence_questions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          no_points: number
          question: string
          question_order: number
          updated_at: string | null
          yes_points: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          no_points?: number
          question: string
          question_order: number
          updated_at?: string | null
          yes_points?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          no_points?: number
          question?: string
          question_order?: number
          updated_at?: string | null
          yes_points?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          birth_date: string
          cpf: string
          created_at: string | null
          department: string | null
          email: string
          id: string
          is_manager: boolean | null
          job_title: string | null
          management_contract_id: string | null
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          birth_date: string
          cpf: string
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          is_manager?: boolean | null
          job_title?: string | null
          management_contract_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          birth_date?: string
          cpf?: string
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          is_manager?: boolean | null
          job_title?: string | null
          management_contract_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_management_contract_id_fkey"
            columns: ["management_contract_id"]
            isOneToOne: false
            referencedRelation: "management_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      management_contracts: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          renewal_date: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          renewal_date?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          renewal_date?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string
          cpf: string
          created_at: string | null
          first_login: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          birth_date: string
          cpf: string
          created_at?: string | null
          first_login?: boolean | null
          id: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string
          cpf?: string
          created_at?: string | null
          first_login?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_due_diligence: {
        Row: {
          certificate_expires_at: string | null
          certificate_file_path: string | null
          certificate_url: string | null
          cnpj: string
          company_name: string
          created_at: string | null
          email: string
          id: string
          kpmg_report_file_path: string | null
          owner: string
          partners: string | null
          phone: string
          rejection_reason: string | null
          responses: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          total_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          certificate_expires_at?: string | null
          certificate_file_path?: string | null
          certificate_url?: string | null
          cnpj: string
          company_name: string
          created_at?: string | null
          email: string
          id?: string
          kpmg_report_file_path?: string | null
          owner: string
          partners?: string | null
          phone: string
          rejection_reason?: string | null
          responses?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          certificate_expires_at?: string | null
          certificate_file_path?: string | null
          certificate_url?: string | null
          cnpj?: string
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          kpmg_report_file_path?: string | null
          owner?: string
          partners?: string | null
          phone?: string
          rejection_reason?: string | null
          responses?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      training_assessments: {
        Row: {
          answers: Json | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          employee_id: string
          id: string
          questions: Json
          score: number | null
          training_id: string
        }
        Insert: {
          answers?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          questions: Json
          score?: number | null
          training_id: string
        }
        Update: {
          answers?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          questions?: Json
          score?: number | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assessments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          training_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          training_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          training_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_documents_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_participations: {
        Row: {
          completed: boolean | null
          completion_date: string | null
          created_at: string | null
          employee_id: string
          id: string
          training_id: string
        }
        Insert: {
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          training_id: string
        }
        Update: {
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_participations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_participations_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          options: Json
          question: string
          training_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          options: Json
          question: string
          training_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          options?: Json
          question?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_questions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          title: string
          training_id: string
          updated_at: string | null
          url: string
          video_order: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title: string
          training_id: string
          updated_at?: string | null
          url: string
          video_order?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          title?: string
          training_id?: string
          updated_at?: string | null
          url?: string
          video_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_trail: boolean | null
          passing_score: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_trail?: boolean | null
          passing_score?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_trail?: boolean | null
          passing_score?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          completed: boolean
          created_at: string
          employee_id: string
          id: string
          last_watched_at: string | null
          progress_percentage: number
          training_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          employee_id: string
          id?: string
          last_watched_at?: string | null
          progress_percentage?: number
          training_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          employee_id?: string
          id?: string
          last_watched_at?: string | null
          progress_percentage?: number
          training_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_video_progress_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_video_progress_training"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_video_progress_video"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
