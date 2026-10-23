export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          center_id: string;
          charged: number;
          class_slot_id: string | null;
          enrollment_id: string;
          free: boolean;
          id: string;
          kind: Database["public"]["Enums"]["session_kind"];
          marked_at: string;
          marked_by: string | null;
          note: string | null;
          org_id: string;
          session_date: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        ComputedFields: never;
        Insert: {
          center_id: string;
          charged?: number;
          class_slot_id?: string | null;
          enrollment_id: string;
          free?: boolean;
          id?: string;
          kind?: Database["public"]["Enums"]["session_kind"];
          marked_at?: string;
          marked_by?: string | null;
          note?: string | null;
          org_id: string;
          session_date: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        Update: {
          center_id?: string;
          charged?: number;
          class_slot_id?: string | null;
          enrollment_id?: string;
          free?: boolean;
          id?: string;
          kind?: Database["public"]["Enums"]["session_kind"];
          marked_at?: string;
          marked_by?: string | null;
          note?: string | null;
          org_id?: string;
          session_date?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_class_slot_id_fkey";
            columns: ["class_slot_id"];
            isOneToOne: false;
            referencedRelation: "class_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          changes: Json | null;
          created_at: string;
          id: number;
          org_id: string;
          row_id: string | null;
          table_name: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          changes?: Json | null;
          created_at?: string;
          id?: never;
          org_id: string;
          row_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          changes?: Json | null;
          created_at?: string;
          id?: never;
          org_id?: string;
          row_id?: string | null;
          table_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      center_closures: {
        Row: {
          center_id: string | null;
          end_date: string;
          id: string;
          name: string;
          org_id: string;
          start_date: string;
        };
        ComputedFields: never;
        Insert: {
          center_id?: string | null;
          end_date: string;
          id?: string;
          name: string;
          org_id: string;
          start_date: string;
        };
        Update: {
          center_id?: string | null;
          end_date?: string;
          id?: string;
          name?: string;
          org_id?: string;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "center_closures_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "center_closures_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      center_secrets: {
        Row: {
          center_id: string;
          checkin_secret: string;
          org_id: string;
        };
        ComputedFields: never;
        Insert: {
          center_id: string;
          checkin_secret?: string;
          org_id: string;
        };
        Update: {
          center_id?: string;
          checkin_secret?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "center_secrets_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: true;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "center_secrets_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      centers: {
        Row: {
          address: string | null;
          bank_account: string | null;
          bank_bin: string | null;
          bank_holder: string | null;
          course_rules: string | null;
          created_at: string;
          id: string;
          name: string;
          org_id: string;
          phone: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          bank_account?: string | null;
          bank_bin?: string | null;
          bank_holder?: string | null;
          course_rules?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          org_id: string;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          bank_account?: string | null;
          bank_bin?: string | null;
          bank_holder?: string | null;
          course_rules?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          org_id?: string;
          phone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "centers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      class_slots: {
        Row: {
          active: boolean;
          center_id: string;
          course_id: string | null;
          created_at: string;
          end_time: string;
          id: string;
          max_students: number | null;
          name: string;
          org_id: string;
          room_id: string | null;
          start_time: string;
          teacher_id: string | null;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          center_id: string;
          course_id?: string | null;
          created_at?: string;
          end_time: string;
          id?: string;
          max_students?: number | null;
          name: string;
          org_id: string;
          room_id?: string | null;
          start_time: string;
          teacher_id?: string | null;
          weekday: number;
        };
        Update: {
          active?: boolean;
          center_id?: string;
          course_id?: string | null;
          created_at?: string;
          end_time?: string;
          id?: string;
          max_students?: number | null;
          name?: string;
          org_id?: string;
          room_id?: string | null;
          start_time?: string;
          teacher_id?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "class_slots_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_slots_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_slots_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_slots_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          active: boolean;
          chess_level: Database["public"]["Enums"]["chess_level"] | null;
          created_at: string;
          description: string | null;
          id: string;
          max_excused_absences: number | null;
          name: string;
          org_id: string;
          price: number;
          total_lessons: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          chess_level?: Database["public"]["Enums"]["chess_level"] | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          max_excused_absences?: number | null;
          name: string;
          org_id: string;
          price?: number;
          total_lessons: number;
        };
        Update: {
          active?: boolean;
          chess_level?: Database["public"]["Enums"]["chess_level"] | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          max_excused_absences?: number | null;
          name?: string;
          org_id?: string;
          price?: number;
          total_lessons?: number;
        };
        Relationships: [
          {
            foreignKeyName: "courses_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollment_schedules: {
        Row: {
          class_slot_id: string;
          enrollment_id: string;
          org_id: string;
        };
        ComputedFields: never;
        Insert: {
          class_slot_id: string;
          enrollment_id: string;
          org_id: string;
        };
        Update: {
          class_slot_id?: string;
          enrollment_id?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollment_schedules_class_slot_id_fkey";
            columns: ["class_slot_id"];
            isOneToOne: false;
            referencedRelation: "class_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollment_schedules_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollment_schedules_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          course_id: string;
          created_at: string;
          excused_waived: number;
          expected_end_date: string | null;
          id: string;
          org_id: string;
          price: number;
          start_date: string;
          status: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          total_lessons: number;
          used_lessons: number;
        };
        ComputedFields: never;
        Insert: {
          course_id: string;
          created_at?: string;
          excused_waived?: number;
          expected_end_date?: string | null;
          id?: string;
          org_id: string;
          price?: number;
          start_date?: string;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          total_lessons: number;
          used_lessons?: number;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          excused_waived?: number;
          expected_end_date?: string | null;
          id?: string;
          org_id?: string;
          price?: number;
          start_date?: string;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_id?: string;
          total_lessons?: number;
          used_lessons?: number;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          center_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          org_id: string;
          spent_on: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          category?: string;
          center_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          org_id: string;
          spent_on?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          center_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          org_id?: string;
          spent_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          center_ids: string[] | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          token: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          center_ids?: string[] | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          center_ids?: string[] | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          org_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_counters: {
        Row: {
          last_number: number;
          org_id: string;
        };
        ComputedFields: never;
        Insert: {
          last_number?: number;
          org_id: string;
        };
        Update: {
          last_number?: number;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_counters_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_lines: {
        Row: {
          amount: number | null;
          course_id: string | null;
          description: string;
          enrollment_id: string | null;
          id: string;
          invoice_id: string;
          org_id: string;
          position: number;
          quantity: number;
          unit_price: number;
        };
        ComputedFields: never;
        Insert: {
          amount?: never;
          course_id?: string | null;
          description: string;
          enrollment_id?: string | null;
          id?: string;
          invoice_id: string;
          org_id: string;
          position?: number;
          quantity?: number;
          unit_price: number;
        };
        Update: {
          amount?: never;
          course_id?: string | null;
          description?: string;
          enrollment_id?: string | null;
          id?: string;
          invoice_id?: string;
          org_id?: string;
          position?: number;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_lines_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_lines_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_lines_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          center_id: string;
          created_at: string;
          created_by: string | null;
          discount: number;
          due_date: string | null;
          id: string;
          internal_note: string | null;
          issue_date: string;
          note: string | null;
          number: string;
          org_id: string;
          paid_amount: number;
          status: Database["public"]["Enums"]["invoice_status"];
          student_id: string | null;
          subtotal: number;
          total: number;
          transfer_ref: string;
        };
        ComputedFields: never;
        Insert: {
          center_id: string;
          created_at?: string;
          created_by?: string | null;
          discount?: number;
          due_date?: string | null;
          id?: string;
          internal_note?: string | null;
          issue_date?: string;
          note?: string | null;
          number: string;
          org_id: string;
          paid_amount?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          student_id?: string | null;
          subtotal?: number;
          total?: number;
          transfer_ref: string;
        };
        Update: {
          center_id?: string;
          created_at?: string;
          created_by?: string | null;
          discount?: number;
          due_date?: string | null;
          id?: string;
          internal_note?: string | null;
          issue_date?: string;
          note?: string | null;
          number?: string;
          org_id?: string;
          paid_amount?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          student_id?: string | null;
          subtotal?: number;
          total?: number;
          transfer_ref?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "invoices_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "invoices_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      leads: {
        Row: {
          center_id: string | null;
          created_at: string;
          created_by: string | null;
          entry_level: Database["public"]["Enums"]["chess_level"] | null;
          id: string;
          notes: string | null;
          org_id: string;
          parent_name: string;
          parent_phone: string | null;
          source: string | null;
          status: Database["public"]["Enums"]["lead_status"];
          student_birthday: string | null;
          student_id: string | null;
          student_name: string | null;
        };
        ComputedFields: never;
        Insert: {
          center_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          entry_level?: Database["public"]["Enums"]["chess_level"] | null;
          id?: string;
          notes?: string | null;
          org_id: string;
          parent_name: string;
          parent_phone?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          student_birthday?: string | null;
          student_id?: string | null;
          student_name?: string | null;
        };
        Update: {
          center_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          entry_level?: Database["public"]["Enums"]["chess_level"] | null;
          id?: string;
          notes?: string | null;
          org_id?: string;
          parent_name?: string;
          parent_phone?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["lead_status"];
          student_birthday?: string | null;
          student_id?: string | null;
          student_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "leads_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "leads_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      level_history: {
        Row: {
          changed_on: string;
          created_by: string | null;
          from_level: Database["public"]["Enums"]["chess_level"] | null;
          id: string;
          note: string | null;
          org_id: string;
          student_id: string;
          to_level: Database["public"]["Enums"]["chess_level"];
        };
        ComputedFields: never;
        Insert: {
          changed_on?: string;
          created_by?: string | null;
          from_level?: Database["public"]["Enums"]["chess_level"] | null;
          id?: string;
          note?: string | null;
          org_id: string;
          student_id: string;
          to_level: Database["public"]["Enums"]["chess_level"];
        };
        Update: {
          changed_on?: string;
          created_by?: string | null;
          from_level?: Database["public"]["Enums"]["chess_level"] | null;
          id?: string;
          note?: string | null;
          org_id?: string;
          student_id?: string;
          to_level?: Database["public"]["Enums"]["chess_level"];
        };
        Relationships: [
          {
            foreignKeyName: "level_history_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "level_history_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "level_history_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "level_history_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "level_history_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      memberships: {
        Row: {
          center_ids: string[] | null;
          created_at: string;
          display_name: string | null;
          id: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          center_ids?: string[] | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          center_ids?: string[] | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      message_templates: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          kind: string;
          org_id: string;
          title: string;
          zns_template_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          kind: string;
          org_id: string;
          title: string;
          zns_template_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          org_id?: string;
          title?: string;
          zns_template_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_templates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications_outbox: {
        Row: {
          attempts: number;
          channel: Database["public"]["Enums"]["notify_channel"];
          created_at: string;
          dedupe_key: string;
          id: string;
          kind: string;
          last_error: string | null;
          org_id: string;
          payload: NonNullable<Json>;
          recipient: string | null;
          sent_at: string | null;
          status: string;
          student_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          attempts?: number;
          channel: Database["public"]["Enums"]["notify_channel"];
          created_at?: string;
          dedupe_key: string;
          id?: string;
          kind: string;
          last_error?: string | null;
          org_id: string;
          payload?: NonNullable<Json>;
          recipient?: string | null;
          sent_at?: string | null;
          status?: string;
          student_id?: string | null;
        };
        Update: {
          attempts?: number;
          channel?: Database["public"]["Enums"]["notify_channel"];
          created_at?: string;
          dedupe_key?: string;
          id?: string;
          kind?: string;
          last_error?: string | null;
          org_id?: string;
          payload?: NonNullable<Json>;
          recipient?: string | null;
          sent_at?: string | null;
          status?: string;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_outbox_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_outbox_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_outbox_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "notifications_outbox_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "notifications_outbox_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          business_type: string;
          company_name: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          invoice_email: string | null;
          invoice_prefix: string;
          logo_url: string | null;
          low_remaining_threshold: number;
          name: string;
          phone: string | null;
          tax_address: string | null;
          tax_code: string | null;
          timezone: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          business_type?: string;
          company_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_email?: string | null;
          invoice_prefix?: string;
          logo_url?: string | null;
          low_remaining_threshold?: number;
          name: string;
          phone?: string | null;
          tax_address?: string | null;
          tax_code?: string | null;
          timezone?: string;
        };
        Update: {
          address?: string | null;
          business_type?: string;
          company_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_email?: string | null;
          invoice_prefix?: string;
          logo_url?: string | null;
          low_remaining_threshold?: number;
          name?: string;
          phone?: string | null;
          tax_address?: string | null;
          tax_code?: string | null;
          timezone?: string;
        };
        Relationships: [];
      };
      pauses: {
        Row: {
          end_date: string;
          enrollment_id: string;
          id: string;
          org_id: string;
          reason: string | null;
          start_date: string;
        };
        ComputedFields: never;
        Insert: {
          end_date: string;
          enrollment_id: string;
          id?: string;
          org_id: string;
          reason?: string | null;
          start_date: string;
        };
        Update: {
          end_date?: string;
          enrollment_id?: string;
          id?: string;
          org_id?: string;
          reason?: string | null;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pauses_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pauses_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          external_id: string | null;
          id: string;
          invoice_id: string | null;
          method: Database["public"]["Enums"]["payment_method"];
          org_id: string;
          paid_at: string;
          reference: string | null;
          source: string;
          student_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          external_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          method?: Database["public"]["Enums"]["payment_method"];
          org_id: string;
          paid_at?: string;
          reference?: string | null;
          source?: string;
          student_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          external_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          method?: Database["public"]["Enums"]["payment_method"];
          org_id?: string;
          paid_at?: string;
          reference?: string | null;
          source?: string;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      push_tokens: {
        Row: {
          platform: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          platform: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          platform?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      renewal_followups: {
        Row: {
          following_up: boolean;
          invoice_id: string | null;
          invoice_sent: boolean;
          note: string | null;
          org_id: string;
          paid: boolean;
          student_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          following_up?: boolean;
          invoice_id?: string | null;
          invoice_sent?: boolean;
          note?: string | null;
          org_id: string;
          paid?: boolean;
          student_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          following_up?: boolean;
          invoice_id?: string | null;
          invoice_sent?: boolean;
          note?: string | null;
          org_id?: string;
          paid?: boolean;
          student_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "renewal_followups_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "renewal_followups_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "renewal_followups_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "renewal_followups_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "renewal_followups_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      rooms: {
        Row: {
          capacity: number | null;
          center_id: string;
          created_at: string;
          id: string;
          name: string;
          org_id: string;
        };
        ComputedFields: never;
        Insert: {
          capacity?: number | null;
          center_id: string;
          created_at?: string;
          id?: string;
          name: string;
          org_id: string;
        };
        Update: {
          capacity?: number | null;
          center_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      student_reviews: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          org_id: string;
          student_id: string;
          visible_to_parent: boolean;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          org_id: string;
          student_id: string;
          visible_to_parent?: boolean;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          student_id?: string;
          visible_to_parent?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "student_reviews_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_consecutive_absences";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "student_reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_low_remaining";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "student_reviews_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "v_student_remaining";
            referencedColumns: ["student_id"];
          },
        ];
      };
      students: {
        Row: {
          address: string | null;
          birthday: string | null;
          center_id: string;
          chess_level: Database["public"]["Enums"]["chess_level"];
          created_at: string;
          created_by: string | null;
          enrolled_on: string;
          full_name: string;
          id: string;
          notes: string | null;
          org_id: string;
          parent_access_enabled: boolean;
          parent_email: string | null;
          parent_last_viewed_at: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          parent_token: string;
          photo_url: string | null;
          rating: number | null;
          status: Database["public"]["Enums"]["student_status"];
          status_changed_at: string;
          stopped_reason: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          birthday?: string | null;
          center_id: string;
          chess_level?: Database["public"]["Enums"]["chess_level"];
          created_at?: string;
          created_by?: string | null;
          enrolled_on?: string;
          full_name: string;
          id?: string;
          notes?: string | null;
          org_id: string;
          parent_access_enabled?: boolean;
          parent_email?: string | null;
          parent_last_viewed_at?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          parent_token?: string;
          photo_url?: string | null;
          rating?: number | null;
          status?: Database["public"]["Enums"]["student_status"];
          status_changed_at?: string;
          stopped_reason?: string | null;
        };
        Update: {
          address?: string | null;
          birthday?: string | null;
          center_id?: string;
          chess_level?: Database["public"]["Enums"]["chess_level"];
          created_at?: string;
          created_by?: string | null;
          enrolled_on?: string;
          full_name?: string;
          id?: string;
          notes?: string | null;
          org_id?: string;
          parent_access_enabled?: boolean;
          parent_email?: string | null;
          parent_last_viewed_at?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          parent_token?: string;
          photo_url?: string | null;
          rating?: number | null;
          status?: Database["public"]["Enums"]["student_status"];
          status_changed_at?: string;
          stopped_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          org_id: string;
          plan: string;
          status: Database["public"]["Enums"]["subscription_status"];
          student_limit: number;
          trial_ends_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          org_id: string;
          plan?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          student_limit?: number;
          trial_ends_at?: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          org_id?: string;
          plan?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          student_limit?: number;
          trial_ends_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_checkins: {
        Row: {
          center_id: string;
          checked_in_at: string;
          class_slot_id: string | null;
          id: string;
          late_minutes: number;
          org_id: string;
          session_date: string;
          teacher_id: string;
          verified_by: string;
        };
        ComputedFields: never;
        Insert: {
          center_id: string;
          checked_in_at?: string;
          class_slot_id?: string | null;
          id?: string;
          late_minutes?: number;
          org_id: string;
          session_date?: string;
          teacher_id: string;
          verified_by?: string;
        };
        Update: {
          center_id?: string;
          checked_in_at?: string;
          class_slot_id?: string | null;
          id?: string;
          late_minutes?: number;
          org_id?: string;
          session_date?: string;
          teacher_id?: string;
          verified_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_checkins_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teacher_checkins_class_slot_id_fkey";
            columns: ["class_slot_id"];
            isOneToOne: false;
            referencedRelation: "class_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teacher_checkins_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_pay_rates: {
        Row: {
          mode: Database["public"]["Enums"]["pay_mode"];
          org_id: string;
          session_rate: number;
          student_rate: number;
          teacher_id: string;
          threshold: number;
        };
        ComputedFields: never;
        Insert: {
          mode?: Database["public"]["Enums"]["pay_mode"];
          org_id: string;
          session_rate?: number;
          student_rate?: number;
          teacher_id: string;
          threshold?: number;
        };
        Update: {
          mode?: Database["public"]["Enums"]["pay_mode"];
          org_id?: string;
          session_rate?: number;
          student_rate?: number;
          teacher_id?: string;
          threshold?: number;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_pay_rates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_consecutive_absences: {
        Row: {
          center_id: string | null;
          full_name: string | null;
          last_absence_date: string | null;
          org_id: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          student_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "students_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      v_low_remaining: {
        Row: {
          active_enrollments: number | null;
          center_id: string | null;
          chess_level: Database["public"]["Enums"]["chess_level"] | null;
          following_up: boolean | null;
          followup_note: string | null;
          full_name: string | null;
          invoice_sent: boolean | null;
          org_id: string | null;
          paid: boolean | null;
          parent_name: string | null;
          parent_phone: string | null;
          remaining_lessons: number | null;
          student_id: string | null;
          threshold: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "students_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      v_student_remaining: {
        Row: {
          active_enrollments: number | null;
          center_id: string | null;
          chess_level: Database["public"]["Enums"]["chess_level"] | null;
          full_name: string | null;
          org_id: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          remaining_lessons: number | null;
          student_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "students_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string };
      can_access_center: {
        Args: { p_center: string; p_org: string };
        Returns: boolean;
      };
      create_invoice: {
        Args: {
          p_center_id: string;
          p_discount?: number;
          p_due_date?: string;
          p_lines: Json;
          p_note?: string;
          p_student_id: string;
        };
        Returns: {
          center_id: string;
          created_at: string;
          created_by: string | null;
          discount: number;
          due_date: string | null;
          id: string;
          internal_note: string | null;
          issue_date: string;
          note: string | null;
          number: string;
          org_id: string;
          paid_amount: number;
          status: Database["public"]["Enums"]["invoice_status"];
          student_id: string | null;
          subtotal: number;
          total: number;
          transfer_ref: string;
        };
        SetofOptions: {
          from: "*";
          to: "invoices";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_organization: {
        Args: { p_center_name?: string; p_name: string };
        Returns: string;
      };
      current_checkin_code: { Args: { p_center_id: string }; Returns: Json };
      enqueue_daily_notifications: {
        Args: { p_today?: string };
        Returns: number;
      };
      get_parent_portal: {
        Args: { p_phone_suffix: string; p_token: string };
        Returns: Json;
      };
      has_org_role: {
        Args: {
          p_org: string;
          p_roles: Database["public"]["Enums"]["member_role"][];
        };
        Returns: boolean;
      };
      is_org_admin: { Args: { p_org: string }; Returns: boolean };
      is_org_member: { Args: { p_org: string }; Returns: boolean };
      mark_attendance: {
        Args: {
          p_class_slot_id?: string;
          p_enrollment_id: string;
          p_free?: boolean;
          p_kind?: Database["public"]["Enums"]["session_kind"];
          p_note?: string;
          p_session_date: string;
          p_status: Database["public"]["Enums"]["attendance_status"];
        };
        Returns: {
          center_id: string;
          charged: number;
          class_slot_id: string | null;
          enrollment_id: string;
          free: boolean;
          id: string;
          kind: Database["public"]["Enums"]["session_kind"];
          marked_at: string;
          marked_by: string | null;
          note: string | null;
          org_id: string;
          session_date: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "attendance";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      recompute_enrollment_usage: {
        Args: { p_enrollment: string };
        Returns: {
          course_id: string;
          created_at: string;
          excused_waived: number;
          expected_end_date: string | null;
          id: string;
          org_id: string;
          price: number;
          start_date: string;
          status: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          total_lessons: number;
          used_lessons: number;
        };
        SetofOptions: {
          from: "*";
          to: "enrollments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      record_bank_transfer: {
        Args: {
          p_amount: number;
          p_content: string;
          p_external_id: string;
          p_paid_at?: string;
        };
        Returns: string;
      };
      refresh_invoice: { Args: { p_invoice: string }; Returns: undefined };
      rotating_code: {
        Args: { p_center: string; p_counter: number; p_secret: string };
        Returns: string;
      };
      teacher_checkin: {
        Args: { p_center_id: string; p_class_slot_id?: string; p_code: string };
        Returns: {
          center_id: string;
          checked_in_at: string;
          class_slot_id: string | null;
          id: string;
          late_minutes: number;
          org_id: string;
          session_date: string;
          teacher_id: string;
          verified_by: string;
        };
        SetofOptions: {
          from: "*";
          to: "teacher_checkins";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      touch_parent_portal: { Args: { p_token: string }; Returns: undefined };
      unmark_attendance: {
        Args: { p_attendance_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      attendance_status: "present" | "excused" | "unexcused";
      chess_level: "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
      enrollment_status: "active" | "paused" | "completed" | "stopped";
      invoice_status: "unpaid" | "partial" | "paid" | "void";
      lead_status: "new" | "caring" | "registered" | "lost";
      member_role: "owner" | "admin" | "teacher";
      notify_channel: "zalo_zns" | "push" | "email";
      pay_mode: "per_session" | "per_student" | "flex";
      payment_method: "transfer" | "cash" | "card" | "other";
      session_kind: "regular" | "makeup" | "single";
      student_status: "active" | "paused" | "stopped";
      subscription_status: "trialing" | "active" | "past_due" | "expired";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "excused", "unexcused"],
      chess_level: ["pawn", "knight", "bishop", "rook", "queen", "king"],
      enrollment_status: ["active", "paused", "completed", "stopped"],
      invoice_status: ["unpaid", "partial", "paid", "void"],
      lead_status: ["new", "caring", "registered", "lost"],
      member_role: ["owner", "admin", "teacher"],
      notify_channel: ["zalo_zns", "push", "email"],
      pay_mode: ["per_session", "per_student", "flex"],
      payment_method: ["transfer", "cash", "card", "other"],
      session_kind: ["regular", "makeup", "single"],
      student_status: ["active", "paused", "stopped"],
      subscription_status: ["trialing", "active", "past_due", "expired"],
    },
  },
} as const;
