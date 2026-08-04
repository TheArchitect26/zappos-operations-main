export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bi_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          alert_type: string;
          company_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          severity: string;
          title: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type: string;
          company_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          severity: string;
          title: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          severity?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_alerts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "bi_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_dashboard_layouts: {
        Row: {
          active: boolean;
          company_id: string;
          config: Json;
          created_at: string;
          department_id: string | null;
          id: string;
          layout_type: string;
          name: string;
          owner_id: string | null;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          config?: Json;
          created_at?: string;
          department_id?: string | null;
          id?: string;
          layout_type: string;
          name: string;
          owner_id?: string | null;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          config?: Json;
          created_at?: string;
          department_id?: string | null;
          id?: string;
          layout_type?: string;
          name?: string;
          owner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bi_dashboard_layouts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_dashboard_widgets: {
        Row: {
          company_id: string;
          config: Json;
          id: string;
          kpi_id: string | null;
          layout_id: string;
          position: Json;
          widget_type: string;
        };
        Insert: {
          company_id: string;
          config?: Json;
          id?: string;
          kpi_id?: string | null;
          layout_id: string;
          position?: Json;
          widget_type: string;
        };
        Update: {
          company_id?: string;
          config?: Json;
          id?: string;
          kpi_id?: string | null;
          layout_id?: string;
          position?: Json;
          widget_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_dashboard_widgets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_dashboard_widgets_kpi_id_fkey";
            columns: ["kpi_id"];
            isOneToOne: false;
            referencedRelation: "bi_kpi_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_dashboard_widgets_layout_id_fkey";
            columns: ["layout_id"];
            isOneToOne: false;
            referencedRelation: "bi_dashboard_layouts";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_data_quality_issues: {
        Row: {
          company_id: string;
          details: Json;
          detected_at: string;
          domain: string;
          id: string;
          issue_type: string;
          status: string;
        };
        Insert: {
          company_id: string;
          details?: Json;
          detected_at?: string;
          domain: string;
          id?: string;
          issue_type: string;
          status?: string;
        };
        Update: {
          company_id?: string;
          details?: Json;
          detected_at?: string;
          domain?: string;
          id?: string;
          issue_type?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_data_quality_issues_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_kpi_definitions: {
        Row: {
          active: boolean;
          calculation_type: string;
          code: string;
          company_id: string;
          data_source: string;
          description: string | null;
          domain: string;
          effective_date: string;
          id: string;
          name: string;
          owner_role: string | null;
          refresh_frequency: string;
          target_direction: string;
          unit: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          calculation_type: string;
          code: string;
          company_id: string;
          data_source: string;
          description?: string | null;
          domain: string;
          effective_date?: string;
          id?: string;
          name: string;
          owner_role?: string | null;
          refresh_frequency: string;
          target_direction: string;
          unit: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          calculation_type?: string;
          code?: string;
          company_id?: string;
          data_source?: string;
          description?: string | null;
          domain?: string;
          effective_date?: string;
          id?: string;
          name?: string;
          owner_role?: string | null;
          refresh_frequency?: string;
          target_direction?: string;
          unit?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bi_kpi_definitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_kpi_snapshots: {
        Row: {
          calculated_at: string;
          calculated_value: number | null;
          calculation_version: number;
          company_id: string;
          data_freshness: string;
          id: string;
          kpi_id: string;
          period_end: string;
          period_start: string;
          scope_id: string | null;
          scope_type: string;
          source_row_count: number | null;
          status: string;
          target_value: number | null;
        };
        Insert: {
          calculated_at?: string;
          calculated_value?: number | null;
          calculation_version?: number;
          company_id: string;
          data_freshness: string;
          id?: string;
          kpi_id: string;
          period_end: string;
          period_start: string;
          scope_id?: string | null;
          scope_type: string;
          source_row_count?: number | null;
          status: string;
          target_value?: number | null;
        };
        Update: {
          calculated_at?: string;
          calculated_value?: number | null;
          calculation_version?: number;
          company_id?: string;
          data_freshness?: string;
          id?: string;
          kpi_id?: string;
          period_end?: string;
          period_start?: string;
          scope_id?: string | null;
          scope_type?: string;
          source_row_count?: number | null;
          status?: string;
          target_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "bi_kpi_snapshots_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_kpi_snapshots_kpi_id_fkey";
            columns: ["kpi_id"];
            isOneToOne: false;
            referencedRelation: "bi_kpi_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_kpi_targets: {
        Row: {
          approval_status: string;
          company_id: string;
          critical_threshold: number | null;
          effective_date: string;
          end_date: string | null;
          id: string;
          kpi_id: string;
          owner_id: string | null;
          scope_id: string | null;
          scope_type: string;
          target_value: number | null;
          warning_threshold: number | null;
        };
        Insert: {
          approval_status?: string;
          company_id: string;
          critical_threshold?: number | null;
          effective_date: string;
          end_date?: string | null;
          id?: string;
          kpi_id: string;
          owner_id?: string | null;
          scope_id?: string | null;
          scope_type: string;
          target_value?: number | null;
          warning_threshold?: number | null;
        };
        Update: {
          approval_status?: string;
          company_id?: string;
          critical_threshold?: number | null;
          effective_date?: string;
          end_date?: string | null;
          id?: string;
          kpi_id?: string;
          owner_id?: string | null;
          scope_id?: string | null;
          scope_type?: string;
          target_value?: number | null;
          warning_threshold?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "bi_kpi_targets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_kpi_targets_kpi_id_fkey";
            columns: ["kpi_id"];
            isOneToOne: false;
            referencedRelation: "bi_kpi_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_report_commentary: {
        Row: {
          approved_by: string | null;
          body: string;
          commentary_type: string;
          company_id: string;
          created_at: string;
          id: string;
          owner_id: string | null;
          report_id: string | null;
          reviewed_by: string | null;
          sign_off_date: string | null;
        };
        Insert: {
          approved_by?: string | null;
          body: string;
          commentary_type: string;
          company_id: string;
          created_at?: string;
          id?: string;
          owner_id?: string | null;
          report_id?: string | null;
          reviewed_by?: string | null;
          sign_off_date?: string | null;
        };
        Update: {
          approved_by?: string | null;
          body?: string;
          commentary_type?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          owner_id?: string | null;
          report_id?: string | null;
          reviewed_by?: string | null;
          sign_off_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bi_report_commentary_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_report_commentary_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "bi_saved_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_report_datasets: {
        Row: {
          access_roles: string[];
          active: boolean;
          allowed_aggregations: Json;
          allowed_fields: Json;
          allowed_filters: Json;
          code: string;
          company_id: string;
          domain: string;
          id: string;
          name: string;
          sensitivity: string;
        };
        Insert: {
          access_roles?: string[];
          active?: boolean;
          allowed_aggregations?: Json;
          allowed_fields?: Json;
          allowed_filters?: Json;
          code: string;
          company_id: string;
          domain: string;
          id?: string;
          name: string;
          sensitivity?: string;
        };
        Update: {
          access_roles?: string[];
          active?: boolean;
          allowed_aggregations?: Json;
          allowed_fields?: Json;
          allowed_filters?: Json;
          code?: string;
          company_id?: string;
          domain?: string;
          id?: string;
          name?: string;
          sensitivity?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_report_datasets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_report_exports: {
        Row: {
          company_id: string;
          created_at: string;
          format: string;
          id: string;
          metadata: Json;
          report_run_id: string;
          requested_by: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          format: string;
          id?: string;
          metadata?: Json;
          report_run_id: string;
          requested_by?: string | null;
          status: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          format?: string;
          id?: string;
          metadata?: Json;
          report_run_id?: string;
          requested_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_report_exports_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_report_exports_report_run_id_fkey";
            columns: ["report_run_id"];
            isOneToOne: false;
            referencedRelation: "bi_report_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_report_runs: {
        Row: {
          company_id: string;
          error_message: string | null;
          generated_at: string | null;
          id: string;
          report_id: string;
          row_count: number | null;
          source_period: Json;
          status: string;
        };
        Insert: {
          company_id: string;
          error_message?: string | null;
          generated_at?: string | null;
          id?: string;
          report_id: string;
          row_count?: number | null;
          source_period?: Json;
          status: string;
        };
        Update: {
          company_id?: string;
          error_message?: string | null;
          generated_at?: string | null;
          id?: string;
          report_id?: string;
          row_count?: number | null;
          source_period?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_report_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_report_runs_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "bi_saved_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_report_schedules: {
        Row: {
          active: boolean;
          company_id: string;
          delivery_format: string;
          frequency: string;
          id: string;
          last_generated_at: string | null;
          next_due_at: string | null;
          recipients_metadata: Json;
          report_id: string;
          status: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          delivery_format: string;
          frequency: string;
          id?: string;
          last_generated_at?: string | null;
          next_due_at?: string | null;
          recipients_metadata?: Json;
          report_id: string;
          status?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          delivery_format?: string;
          frequency?: string;
          id?: string;
          last_generated_at?: string | null;
          next_due_at?: string | null;
          recipients_metadata?: Json;
          report_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_report_schedules_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_report_schedules_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "bi_saved_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_report_signoffs: {
        Row: {
          approved_by: string | null;
          company_id: string;
          id: string;
          report_id: string;
          reviewed_by: string | null;
          signed_at: string | null;
          status: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          id?: string;
          report_id: string;
          reviewed_by?: string | null;
          signed_at?: string | null;
          status: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          id?: string;
          report_id?: string;
          reviewed_by?: string | null;
          signed_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_report_signoffs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_report_signoffs_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: true;
            referencedRelation: "bi_saved_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_saved_reports: {
        Row: {
          aggregations_config: Json;
          archived: boolean;
          columns_config: Json;
          company_id: string;
          created_at: string;
          dataset_code: string;
          department_id: string | null;
          domain: string;
          filters_config: Json;
          id: string;
          name: string;
          owner_id: string | null;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          aggregations_config?: Json;
          archived?: boolean;
          columns_config?: Json;
          company_id: string;
          created_at?: string;
          dataset_code: string;
          department_id?: string | null;
          domain: string;
          filters_config?: Json;
          id?: string;
          name: string;
          owner_id?: string | null;
          updated_at?: string;
          visibility: string;
        };
        Update: {
          aggregations_config?: Json;
          archived?: boolean;
          columns_config?: Json;
          company_id?: string;
          created_at?: string;
          dataset_code?: string;
          department_id?: string | null;
          domain?: string;
          filters_config?: Json;
          id?: string;
          name?: string;
          owner_id?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_saved_reports_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_scorecard_items: {
        Row: {
          company_id: string;
          display_order: number;
          drill_down_config: Json;
          id: string;
          kpi_id: string;
          scorecard_id: string;
        };
        Insert: {
          company_id: string;
          display_order?: number;
          drill_down_config?: Json;
          id?: string;
          kpi_id: string;
          scorecard_id: string;
        };
        Update: {
          company_id?: string;
          display_order?: number;
          drill_down_config?: Json;
          id?: string;
          kpi_id?: string;
          scorecard_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_scorecard_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_scorecard_items_kpi_id_fkey";
            columns: ["kpi_id"];
            isOneToOne: false;
            referencedRelation: "bi_kpi_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_scorecard_items_scorecard_id_fkey";
            columns: ["scorecard_id"];
            isOneToOne: false;
            referencedRelation: "bi_scorecards";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_scorecards: {
        Row: {
          active: boolean;
          company_id: string;
          department_id: string | null;
          domain: string;
          id: string;
          name: string;
          owner_id: string | null;
          visibility: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          department_id?: string | null;
          domain: string;
          id?: string;
          name: string;
          owner_id?: string | null;
          visibility: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          department_id?: string | null;
          domain?: string;
          id?: string;
          name?: string;
          owner_id?: string | null;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_scorecards_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bi_user_scopes: {
        Row: {
          company_id: string;
          created_at: string;
          department_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          department_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          department_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bi_user_scopes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bi_user_scopes_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "hr_departments";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_analysis_inputs: {
        Row: {
          brain_run_id: string;
          company_id: string;
          created_at: string;
          dataset_contract_version_id: string | null;
          event_id: string | null;
          id: string;
          metadata: Json;
        };
        Insert: {
          brain_run_id: string;
          company_id: string;
          created_at?: string;
          dataset_contract_version_id?: string | null;
          event_id?: string | null;
          id?: string;
          metadata?: Json;
        };
        Update: {
          brain_run_id?: string;
          company_id?: string;
          created_at?: string;
          dataset_contract_version_id?: string | null;
          event_id?: string | null;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_analysis_inputs_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: true;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_analysis_inputs_company_id_dataset_contract_version__fkey";
            columns: ["company_id", "dataset_contract_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_dataset_contract_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_analysis_inputs_company_id_event_id_fkey";
            columns: ["company_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "integration_event_bus";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_analysis_outputs: {
        Row: {
          brain_run_id: string;
          company_id: string;
          created_at: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          brain_run_id: string;
          company_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          brain_run_id?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_analysis_outputs_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: true;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_benchmarks: {
        Row: {
          benchmark_category: string;
          company_id: string;
          created_at: string;
          evaluation_dataset_id: string;
          generated_at: string;
          id: string;
          metrics: Json;
          outcome_metric_status: string;
          replay_run_id: string | null;
          rule_version_id: string | null;
        };
        Insert: {
          benchmark_category: string;
          company_id: string;
          created_at?: string;
          evaluation_dataset_id: string;
          generated_at?: string;
          id?: string;
          metrics?: Json;
          outcome_metric_status?: string;
          replay_run_id?: string | null;
          rule_version_id?: string | null;
        };
        Update: {
          benchmark_category?: string;
          company_id?: string;
          created_at?: string;
          evaluation_dataset_id?: string;
          generated_at?: string;
          id?: string;
          metrics?: Json;
          outcome_metric_status?: string;
          replay_run_id?: string | null;
          rule_version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "brain_benchmarks_company_id_evaluation_dataset_id_fkey";
            columns: ["company_id", "evaluation_dataset_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_datasets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_benchmarks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_benchmarks_company_id_replay_run_id_fkey";
            columns: ["company_id", "replay_run_id"];
            isOneToOne: false;
            referencedRelation: "brain_replay_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_benchmarks_company_id_rule_version_id_fkey";
            columns: ["company_id", "rule_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_calibration_proposals: {
        Row: {
          company_id: string;
          confidence_score: number;
          created_at: string;
          decided_at: string | null;
          decision_reason: string | null;
          id: string;
          proposed_adjustment: Json;
          proposed_by: string | null;
          reviewer_id: string | null;
          rule_version_id: string;
          status: string;
          supporting_feedback: Json;
          supporting_outcomes: Json;
        };
        Insert: {
          company_id: string;
          confidence_score: number;
          created_at?: string;
          decided_at?: string | null;
          decision_reason?: string | null;
          id?: string;
          proposed_adjustment: Json;
          proposed_by?: string | null;
          reviewer_id?: string | null;
          rule_version_id: string;
          status?: string;
          supporting_feedback?: Json;
          supporting_outcomes?: Json;
        };
        Update: {
          company_id?: string;
          confidence_score?: number;
          created_at?: string;
          decided_at?: string | null;
          decision_reason?: string | null;
          id?: string;
          proposed_adjustment?: Json;
          proposed_by?: string | null;
          reviewer_id?: string | null;
          rule_version_id?: string;
          status?: string;
          supporting_feedback?: Json;
          supporting_outcomes?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_calibration_proposals_company_id_rule_version_id_fkey";
            columns: ["company_id", "rule_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_capability_flags: {
        Row: {
          capability_code: string;
          company_id: string;
          created_at: string;
          effective_at: string | null;
          enabled: boolean;
          environment: string | null;
          expires_at: string | null;
          id: string;
          owner_id: string | null;
          reason: string;
          reviewer_id: string | null;
          updated_at: string;
        };
        Insert: {
          capability_code: string;
          company_id: string;
          created_at?: string;
          effective_at?: string | null;
          enabled?: boolean;
          environment?: string | null;
          expires_at?: string | null;
          id?: string;
          owner_id?: string | null;
          reason: string;
          reviewer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          capability_code?: string;
          company_id?: string;
          created_at?: string;
          effective_at?: string | null;
          enabled?: boolean;
          environment?: string | null;
          expires_at?: string | null;
          id?: string;
          owner_id?: string | null;
          reason?: string;
          reviewer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_capability_flags_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_change_records: {
        Row: {
          approved_by: string | null;
          audit_metadata: Json;
          change_type: string;
          company_id: string;
          created_at: string;
          environment: string;
          id: string;
          implementation_status: string;
          incident_id: string | null;
          planned_end_at: string | null;
          planned_start_at: string | null;
          reason: string;
          release_bundle_id: string | null;
          requested_by: string;
          reviewed_by: string | null;
          risk_classification: string;
          rollback_plan: string;
          scope: string;
          updated_at: string;
          validation_status: string;
        };
        Insert: {
          approved_by?: string | null;
          audit_metadata?: Json;
          change_type: string;
          company_id: string;
          created_at?: string;
          environment: string;
          id?: string;
          implementation_status?: string;
          incident_id?: string | null;
          planned_end_at?: string | null;
          planned_start_at?: string | null;
          reason: string;
          release_bundle_id?: string | null;
          requested_by: string;
          reviewed_by?: string | null;
          risk_classification: string;
          rollback_plan: string;
          scope: string;
          updated_at?: string;
          validation_status?: string;
        };
        Update: {
          approved_by?: string | null;
          audit_metadata?: Json;
          change_type?: string;
          company_id?: string;
          created_at?: string;
          environment?: string;
          id?: string;
          implementation_status?: string;
          incident_id?: string | null;
          planned_end_at?: string | null;
          planned_start_at?: string | null;
          reason?: string;
          release_bundle_id?: string | null;
          requested_by?: string;
          reviewed_by?: string | null;
          risk_classification?: string;
          rollback_plan?: string;
          scope?: string;
          updated_at?: string;
          validation_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_change_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_change_records_company_id_release_bundle_id_fkey";
            columns: ["company_id", "release_bundle_id"];
            isOneToOne: false;
            referencedRelation: "brain_release_bundles";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_change_records_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "brain_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_confidence_policies: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          minimum_display: number;
          minimum_persist: number;
          minimum_recommendation: number;
          policy_code: string;
          policy_metadata: Json;
          status: string;
          version: number;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          minimum_display: number;
          minimum_persist: number;
          minimum_recommendation: number;
          policy_code: string;
          policy_metadata?: Json;
          status?: string;
          version: number;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          minimum_display?: number;
          minimum_persist?: number;
          minimum_recommendation?: number;
          policy_code?: string;
          policy_metadata?: Json;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_confidence_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_consumer_checkpoints: {
        Row: {
          company_id: string;
          consumer_code: string;
          created_at: string;
          event_stream: string;
          failure_count: number;
          id: string;
          last_error_metadata: Json;
          last_event_id: string | null;
          last_event_timestamp: string | null;
          last_processed_at: string | null;
          processing_status: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          consumer_code: string;
          created_at?: string;
          event_stream?: string;
          failure_count?: number;
          id?: string;
          last_error_metadata?: Json;
          last_event_id?: string | null;
          last_event_timestamp?: string | null;
          last_processed_at?: string | null;
          processing_status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          consumer_code?: string;
          created_at?: string;
          event_stream?: string;
          failure_count?: number;
          id?: string;
          last_error_metadata?: Json;
          last_event_id?: string | null;
          last_event_timestamp?: string | null;
          last_processed_at?: string | null;
          processing_status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_consumer_checkpoints_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_consumers: {
        Row: {
          backlog_count: number | null;
          company_id: string;
          concurrency_limit: number;
          consumer_code: string;
          created_at: string;
          current_lag_seconds: number | null;
          dlq_count: number;
          draining: boolean;
          error_rate_percent: number | null;
          event_subscriptions: Json;
          health_state: string;
          id: string;
          last_heartbeat_at: string | null;
          last_successful_event_at: string | null;
          owner_id: string | null;
          paused: boolean;
          processing_mode: string;
          rate_limit_per_minute: number;
          supported_event_versions: Json;
          updated_at: string;
          version: string;
        };
        Insert: {
          backlog_count?: number | null;
          company_id: string;
          concurrency_limit?: number;
          consumer_code: string;
          created_at?: string;
          current_lag_seconds?: number | null;
          dlq_count?: number;
          draining?: boolean;
          error_rate_percent?: number | null;
          event_subscriptions?: Json;
          health_state?: string;
          id?: string;
          last_heartbeat_at?: string | null;
          last_successful_event_at?: string | null;
          owner_id?: string | null;
          paused?: boolean;
          processing_mode: string;
          rate_limit_per_minute?: number;
          supported_event_versions?: Json;
          updated_at?: string;
          version: string;
        };
        Update: {
          backlog_count?: number | null;
          company_id?: string;
          concurrency_limit?: number;
          consumer_code?: string;
          created_at?: string;
          current_lag_seconds?: number | null;
          dlq_count?: number;
          draining?: boolean;
          error_rate_percent?: number | null;
          event_subscriptions?: Json;
          health_state?: string;
          id?: string;
          last_heartbeat_at?: string | null;
          last_successful_event_at?: string | null;
          owner_id?: string | null;
          paused?: boolean;
          processing_mode?: string;
          rate_limit_per_minute?: number;
          supported_event_versions?: Json;
          updated_at?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_consumers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_dataset_contract_versions: {
        Row: {
          allowed_event_types: Json;
          allowed_fields: Json;
          company_id: string;
          created_at: string;
          created_by: string | null;
          dataset_contract_id: string;
          effective_at: string | null;
          id: string;
          restricted_fields: Json;
          retired_at: string | null;
          status: string;
          version: number;
        };
        Insert: {
          allowed_event_types?: Json;
          allowed_fields?: Json;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          dataset_contract_id: string;
          effective_at?: string | null;
          id?: string;
          restricted_fields?: Json;
          retired_at?: string | null;
          status?: string;
          version: number;
        };
        Update: {
          allowed_event_types?: Json;
          allowed_fields?: Json;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          dataset_contract_id?: string;
          effective_at?: string | null;
          id?: string;
          restricted_fields?: Json;
          retired_at?: string | null;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_dataset_contract_versio_company_id_dataset_contract__fkey";
            columns: ["company_id", "dataset_contract_id"];
            isOneToOne: false;
            referencedRelation: "brain_dataset_contracts";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_dataset_contracts: {
        Row: {
          business_domain: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          data_classification: string;
          dataset_code: string;
          enabled: boolean;
          freshness_requirement_minutes: number;
          id: string;
          minimum_role: Database["public"]["Enums"]["app_role"];
          owning_module: string;
          purpose: string;
          retention_days: number;
          updated_at: string;
          use_cases: Json;
        };
        Insert: {
          business_domain: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          data_classification: string;
          dataset_code: string;
          enabled?: boolean;
          freshness_requirement_minutes: number;
          id?: string;
          minimum_role?: Database["public"]["Enums"]["app_role"];
          owning_module: string;
          purpose: string;
          retention_days: number;
          updated_at?: string;
          use_cases?: Json;
        };
        Update: {
          business_domain?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          data_classification?: string;
          dataset_code?: string;
          enabled?: boolean;
          freshness_requirement_minutes?: number;
          id?: string;
          minimum_role?: Database["public"]["Enums"]["app_role"];
          owning_module?: string;
          purpose?: string;
          retention_days?: number;
          updated_at?: string;
          use_cases?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_dataset_contracts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_deployment_records: {
        Row: {
          approved_by: string | null;
          company_id: string;
          completed_at: string | null;
          configuration_hash: string | null;
          created_at: string;
          deployed_by: string | null;
          environment: string;
          failure_metadata: Json;
          health_check_result: string;
          id: string;
          migration_version: string | null;
          release_bundle_id: string | null;
          rollback_target_id: string | null;
          runtime_version_id: string | null;
          source_revision_metadata: Json;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          completed_at?: string | null;
          configuration_hash?: string | null;
          created_at?: string;
          deployed_by?: string | null;
          environment: string;
          failure_metadata?: Json;
          health_check_result?: string;
          id?: string;
          migration_version?: string | null;
          release_bundle_id?: string | null;
          rollback_target_id?: string | null;
          runtime_version_id?: string | null;
          source_revision_metadata?: Json;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          completed_at?: string | null;
          configuration_hash?: string | null;
          created_at?: string;
          deployed_by?: string | null;
          environment?: string;
          failure_metadata?: Json;
          health_check_result?: string;
          id?: string;
          migration_version?: string | null;
          release_bundle_id?: string | null;
          rollback_target_id?: string | null;
          runtime_version_id?: string | null;
          source_revision_metadata?: Json;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_deployment_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_deployment_records_company_id_release_bundle_id_fkey";
            columns: ["company_id", "release_bundle_id"];
            isOneToOne: false;
            referencedRelation: "brain_release_bundles";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_deployment_records_company_id_rollback_target_id_fkey";
            columns: ["company_id", "rollback_target_id"];
            isOneToOne: false;
            referencedRelation: "brain_deployment_records";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_deployment_records_company_id_runtime_version_id_fkey";
            columns: ["company_id", "runtime_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_runtime_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_drift_records: {
        Row: {
          business_domain: string;
          company_id: string;
          created_at: string;
          drift_type: string;
          evaluation_dataset_id: string | null;
          first_detected_at: string;
          id: string;
          last_detected_at: string;
          measurement_metadata: Json;
          occurrence_count: number;
          recommendation: string;
          review_status: string;
          severity: string;
        };
        Insert: {
          business_domain: string;
          company_id: string;
          created_at?: string;
          drift_type: string;
          evaluation_dataset_id?: string | null;
          first_detected_at?: string;
          id?: string;
          last_detected_at?: string;
          measurement_metadata?: Json;
          occurrence_count?: number;
          recommendation: string;
          review_status?: string;
          severity: string;
        };
        Update: {
          business_domain?: string;
          company_id?: string;
          created_at?: string;
          drift_type?: string;
          evaluation_dataset_id?: string | null;
          first_detected_at?: string;
          id?: string;
          last_detected_at?: string;
          measurement_metadata?: Json;
          occurrence_count?: number;
          recommendation?: string;
          review_status?: string;
          severity?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_drift_records_company_id_evaluation_dataset_id_fkey";
            columns: ["company_id", "evaluation_dataset_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_datasets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_drift_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_evaluation_datasets: {
        Row: {
          business_domain: string;
          company_id: string;
          coverage_percent: number | null;
          created_at: string;
          data_quality_percent: number | null;
          dataset_code: string;
          dataset_contract_id: string;
          dataset_contract_version_id: string;
          evaluation_status: string;
          freshness_status: string;
          id: string;
          label_availability: string;
          name: string;
          owner_id: string | null;
          period_end: string;
          period_start: string;
          record_count: number;
          snapshot_hash: string;
          snapshot_reference: Json;
          version: number;
        };
        Insert: {
          business_domain: string;
          company_id: string;
          coverage_percent?: number | null;
          created_at?: string;
          data_quality_percent?: number | null;
          dataset_code: string;
          dataset_contract_id: string;
          dataset_contract_version_id: string;
          evaluation_status?: string;
          freshness_status: string;
          id?: string;
          label_availability: string;
          name: string;
          owner_id?: string | null;
          period_end: string;
          period_start: string;
          record_count: number;
          snapshot_hash: string;
          snapshot_reference?: Json;
          version?: number;
        };
        Update: {
          business_domain?: string;
          company_id?: string;
          coverage_percent?: number | null;
          created_at?: string;
          data_quality_percent?: number | null;
          dataset_code?: string;
          dataset_contract_id?: string;
          dataset_contract_version_id?: string;
          evaluation_status?: string;
          freshness_status?: string;
          id?: string;
          label_availability?: string;
          name?: string;
          owner_id?: string | null;
          period_end?: string;
          period_start?: string;
          record_count?: number;
          snapshot_hash?: string;
          snapshot_reference?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_evaluation_datasets_company_id_dataset_contract_id_fkey";
            columns: ["company_id", "dataset_contract_id"];
            isOneToOne: false;
            referencedRelation: "brain_dataset_contracts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_evaluation_datasets_company_id_dataset_contract_vers_fkey";
            columns: ["company_id", "dataset_contract_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_dataset_contract_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_evaluation_datasets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_evaluation_reports: {
        Row: {
          company_id: string;
          comparison_metadata: Json;
          created_at: string;
          evaluation_dataset_id: string | null;
          generated_at: string;
          generated_by: string | null;
          id: string;
          replay_run_id: string | null;
          report_status: string;
          report_type: string;
        };
        Insert: {
          company_id: string;
          comparison_metadata?: Json;
          created_at?: string;
          evaluation_dataset_id?: string | null;
          generated_at?: string;
          generated_by?: string | null;
          id?: string;
          replay_run_id?: string | null;
          report_status?: string;
          report_type: string;
        };
        Update: {
          company_id?: string;
          comparison_metadata?: Json;
          created_at?: string;
          evaluation_dataset_id?: string | null;
          generated_at?: string;
          generated_by?: string | null;
          id?: string;
          replay_run_id?: string | null;
          report_status?: string;
          report_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_evaluation_reports_company_id_evaluation_dataset_id_fkey";
            columns: ["company_id", "evaluation_dataset_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_datasets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_evaluation_reports_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_evaluation_reports_company_id_replay_run_id_fkey";
            columns: ["company_id", "replay_run_id"];
            isOneToOne: false;
            referencedRelation: "brain_replay_runs";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_event_consumptions: {
        Row: {
          brain_run_id: string | null;
          company_id: string;
          consumer_code: string;
          created_at: string;
          error_metadata: Json;
          event_id: string;
          event_version: number;
          id: string;
          idempotency_key: string;
          insight_count: number;
          phase22_dead_letter_queue_id: string | null;
          phase22_retry_queue_id: string | null;
          processing_completed_at: string | null;
          processing_started_at: string | null;
          result_type: string | null;
          retry_metadata: Json;
          status: string;
        };
        Insert: {
          brain_run_id?: string | null;
          company_id: string;
          consumer_code: string;
          created_at?: string;
          error_metadata?: Json;
          event_id: string;
          event_version: number;
          id?: string;
          idempotency_key: string;
          insight_count?: number;
          phase22_dead_letter_queue_id?: string | null;
          phase22_retry_queue_id?: string | null;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          result_type?: string | null;
          retry_metadata?: Json;
          status?: string;
        };
        Update: {
          brain_run_id?: string | null;
          company_id?: string;
          consumer_code?: string;
          created_at?: string;
          error_metadata?: Json;
          event_id?: string;
          event_version?: number;
          id?: string;
          idempotency_key?: string;
          insight_count?: number;
          phase22_dead_letter_queue_id?: string | null;
          phase22_retry_queue_id?: string | null;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          result_type?: string | null;
          retry_metadata?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_event_consumptions_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_event_consumptions_company_id_event_id_fkey";
            columns: ["company_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "integration_event_bus";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_event_consumptions_phase22_dead_letter_queue_id_fkey";
            columns: ["phase22_dead_letter_queue_id"];
            isOneToOne: false;
            referencedRelation: "integration_dead_letter_queue";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_event_consumptions_phase22_retry_queue_id_fkey";
            columns: ["phase22_retry_queue_id"];
            isOneToOne: false;
            referencedRelation: "integration_retry_queue";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_event_contracts: {
        Row: {
          active: boolean;
          allowed_sensitivities: Json;
          allowed_source_modules: Json;
          code: string;
          company_id: string | null;
          created_at: string;
          direction: string;
          event_type: string;
          event_version: number;
          experimental: boolean;
          id: string;
          payload_schema: Json;
        };
        Insert: {
          active?: boolean;
          allowed_sensitivities?: Json;
          allowed_source_modules?: Json;
          code: string;
          company_id?: string | null;
          created_at?: string;
          direction: string;
          event_type: string;
          event_version: number;
          experimental?: boolean;
          id?: string;
          payload_schema?: Json;
        };
        Update: {
          active?: boolean;
          allowed_sensitivities?: Json;
          allowed_source_modules?: Json;
          code?: string;
          company_id?: string | null;
          created_at?: string;
          direction?: string;
          event_type?: string;
          event_version?: number;
          experimental?: boolean;
          id?: string;
          payload_schema?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_event_contracts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_evidence_conflicts: {
        Row: {
          brain_run_id: string | null;
          company_id: string;
          conflicting_fields: Json;
          created_at: string;
          freshness_difference_minutes: number | null;
          id: string;
          preferred_source: string | null;
          reliability_difference: number | null;
          resolution_status: string;
          sources: Json;
        };
        Insert: {
          brain_run_id?: string | null;
          company_id: string;
          conflicting_fields?: Json;
          created_at?: string;
          freshness_difference_minutes?: number | null;
          id?: string;
          preferred_source?: string | null;
          reliability_difference?: number | null;
          resolution_status?: string;
          sources?: Json;
        };
        Update: {
          brain_run_id?: string | null;
          company_id?: string;
          conflicting_fields?: Json;
          created_at?: string;
          freshness_difference_minutes?: number | null;
          id?: string;
          preferred_source?: string | null;
          reliability_difference?: number | null;
          resolution_status?: string;
          sources?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_evidence_conflicts_brain_run_id_fkey";
            columns: ["brain_run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_evidence_conflicts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_experimental_models: {
        Row: {
          company_id: string;
          compatible_dataset_contracts: Json;
          created_at: string;
          evaluation_history: Json;
          experimental: boolean;
          experimental_status: string;
          id: string;
          model_code: string;
          model_registry_id: string | null;
          model_type: string;
          model_version: string;
          name: string;
          owner_id: string | null;
          promotion_eligibility: string;
          safety_status: string;
        };
        Insert: {
          company_id: string;
          compatible_dataset_contracts?: Json;
          created_at?: string;
          evaluation_history?: Json;
          experimental?: boolean;
          experimental_status?: string;
          id?: string;
          model_code: string;
          model_registry_id?: string | null;
          model_type: string;
          model_version: string;
          name: string;
          owner_id?: string | null;
          promotion_eligibility?: string;
          safety_status?: string;
        };
        Update: {
          company_id?: string;
          compatible_dataset_contracts?: Json;
          created_at?: string;
          evaluation_history?: Json;
          experimental?: boolean;
          experimental_status?: string;
          id?: string;
          model_code?: string;
          model_registry_id?: string | null;
          model_type?: string;
          model_version?: string;
          name?: string;
          owner_id?: string | null;
          promotion_eligibility?: string;
          safety_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_experimental_models_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_experimental_models_model_registry_id_fkey";
            columns: ["model_registry_id"];
            isOneToOne: false;
            referencedRelation: "brain_model_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_explanations: {
        Row: {
          brain_insight_id: string | null;
          brain_run_id: string | null;
          company_id: string;
          created_at: string;
          id: string;
          structured_explanation: Json;
        };
        Insert: {
          brain_insight_id?: string | null;
          brain_run_id?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          structured_explanation: Json;
        };
        Update: {
          brain_insight_id?: string | null;
          brain_run_id?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          structured_explanation?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_explanations_company_id_brain_insight_id_fkey";
            columns: ["company_id", "brain_insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_explanations_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_feature_calculations: {
        Row: {
          calculated_at: string;
          company_id: string;
          created_at: string;
          data_freshness: string;
          data_quality: number;
          evidence_count: number;
          feature_version_id: string;
          id: string;
          input_hash: string;
          metadata: Json;
          period_end: string | null;
          period_start: string | null;
          source_domain: string;
          source_entity_id: string | null;
          source_entity_type: string | null;
          status: string;
          unit: string | null;
          value_metadata: Json;
        };
        Insert: {
          calculated_at?: string;
          company_id: string;
          created_at?: string;
          data_freshness: string;
          data_quality: number;
          evidence_count?: number;
          feature_version_id: string;
          id?: string;
          input_hash: string;
          metadata?: Json;
          period_end?: string | null;
          period_start?: string | null;
          source_domain: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          status: string;
          unit?: string | null;
          value_metadata?: Json;
        };
        Update: {
          calculated_at?: string;
          company_id?: string;
          created_at?: string;
          data_freshness?: string;
          data_quality?: number;
          evidence_count?: number;
          feature_version_id?: string;
          id?: string;
          input_hash?: string;
          metadata?: Json;
          period_end?: string | null;
          period_start?: string | null;
          source_domain?: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          status?: string;
          unit?: string | null;
          value_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_feature_calculations_company_id_feature_version_id_fkey";
            columns: ["company_id", "feature_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_feature_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_feature_registry: {
        Row: {
          business_domain: string;
          company_id: string;
          created_at: string;
          dataset_contract_id: string | null;
          description: string;
          experimental: boolean;
          feature_code: string;
          id: string;
          name: string;
          owner_id: string | null;
        };
        Insert: {
          business_domain: string;
          company_id: string;
          created_at?: string;
          dataset_contract_id?: string | null;
          description: string;
          experimental?: boolean;
          feature_code: string;
          id?: string;
          name: string;
          owner_id?: string | null;
        };
        Update: {
          business_domain?: string;
          company_id?: string;
          created_at?: string;
          dataset_contract_id?: string | null;
          description?: string;
          experimental?: boolean;
          feature_code?: string;
          id?: string;
          name?: string;
          owner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "brain_feature_registry_company_id_dataset_contract_id_fkey";
            columns: ["company_id", "dataset_contract_id"];
            isOneToOne: false;
            referencedRelation: "brain_dataset_contracts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_feature_registry_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_feature_versions: {
        Row: {
          calculation_type: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          data_quality_requirement: number;
          effective_at: string | null;
          feature_id: string;
          freshness_requirement_minutes: number;
          id: string;
          minimum_records: number;
          output_type: string;
          retired_at: string | null;
          source_fields: Json;
          status: string;
          unit: string | null;
          version: number;
          window_metadata: Json;
        };
        Insert: {
          calculation_type: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          data_quality_requirement?: number;
          effective_at?: string | null;
          feature_id: string;
          freshness_requirement_minutes?: number;
          id?: string;
          minimum_records?: number;
          output_type: string;
          retired_at?: string | null;
          source_fields?: Json;
          status?: string;
          unit?: string | null;
          version: number;
          window_metadata?: Json;
        };
        Update: {
          calculation_type?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          data_quality_requirement?: number;
          effective_at?: string | null;
          feature_id?: string;
          freshness_requirement_minutes?: number;
          id?: string;
          minimum_records?: number;
          output_type?: string;
          retired_at?: string | null;
          source_fields?: Json;
          status?: string;
          unit?: string | null;
          version?: number;
          window_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_feature_versions_company_id_feature_id_fkey";
            columns: ["company_id", "feature_id"];
            isOneToOne: false;
            referencedRelation: "brain_feature_registry";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_incidents: {
        Row: {
          affected_companies: Json;
          affected_consumers: Json;
          affected_runs: Json;
          affected_schedules: Json;
          commander_id: string | null;
          company_id: string;
          component: string;
          created_at: string;
          detected_at: string;
          environment: string;
          id: string;
          impact: string | null;
          incident_type: string;
          mitigation: string | null;
          owner_id: string | null;
          post_incident_review_required: boolean;
          related_alerts: Json;
          related_dlq_entries: Json;
          resolution: string | null;
          resolved_at: string | null;
          root_cause_status: string;
          severity: string;
          status: string;
          summary: string;
          updated_at: string;
        };
        Insert: {
          affected_companies?: Json;
          affected_consumers?: Json;
          affected_runs?: Json;
          affected_schedules?: Json;
          commander_id?: string | null;
          company_id: string;
          component: string;
          created_at?: string;
          detected_at?: string;
          environment: string;
          id?: string;
          impact?: string | null;
          incident_type: string;
          mitigation?: string | null;
          owner_id?: string | null;
          post_incident_review_required?: boolean;
          related_alerts?: Json;
          related_dlq_entries?: Json;
          resolution?: string | null;
          resolved_at?: string | null;
          root_cause_status?: string;
          severity: string;
          status?: string;
          summary: string;
          updated_at?: string;
        };
        Update: {
          affected_companies?: Json;
          affected_consumers?: Json;
          affected_runs?: Json;
          affected_schedules?: Json;
          commander_id?: string | null;
          company_id?: string;
          component?: string;
          created_at?: string;
          detected_at?: string;
          environment?: string;
          id?: string;
          impact?: string | null;
          incident_type?: string;
          mitigation?: string | null;
          owner_id?: string | null;
          post_incident_review_required?: boolean;
          related_alerts?: Json;
          related_dlq_entries?: Json;
          resolution?: string | null;
          resolved_at?: string | null;
          root_cause_status?: string;
          severity?: string;
          status?: string;
          summary?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_incidents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_insight_correlations: {
        Row: {
          company_id: string;
          confidence_score: number;
          correlation_type: string;
          created_at: string;
          evidence_strength: number;
          explanation: string;
          id: string;
          related_insight_ids: Json;
          related_source_records: Json;
          shared_entity: string | null;
          shared_window: Json;
        };
        Insert: {
          company_id: string;
          confidence_score: number;
          correlation_type: string;
          created_at?: string;
          evidence_strength: number;
          explanation: string;
          id?: string;
          related_insight_ids: Json;
          related_source_records?: Json;
          shared_entity?: string | null;
          shared_window?: Json;
        };
        Update: {
          company_id?: string;
          confidence_score?: number;
          correlation_type?: string;
          created_at?: string;
          evidence_strength?: number;
          explanation?: string;
          id?: string;
          related_insight_ids?: Json;
          related_source_records?: Json;
          shared_entity?: string | null;
          shared_window?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_insight_correlations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_intelligence_quality: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          measurement_metadata: Json;
          observed_at: string;
          quality_type: string;
          resolved_at: string | null;
          severity: string;
          status: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          measurement_metadata?: Json;
          observed_at?: string;
          quality_type: string;
          resolved_at?: string | null;
          severity: string;
          status?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          measurement_metadata?: Json;
          observed_at?: string;
          quality_type?: string;
          resolved_at?: string | null;
          severity?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_intelligence_quality_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_job_attempts: {
        Row: {
          attempt_number: number;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          duration_ms: number | null;
          error_classification: string | null;
          error_metadata: Json;
          id: string;
          job_id: string;
          phase22_dlq_id: string | null;
          phase22_retry_id: string | null;
          started_at: string | null;
          status: string;
          worker_id: string | null;
        };
        Insert: {
          attempt_number: number;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error_classification?: string | null;
          error_metadata?: Json;
          id?: string;
          job_id: string;
          phase22_dlq_id?: string | null;
          phase22_retry_id?: string | null;
          started_at?: string | null;
          status: string;
          worker_id?: string | null;
        };
        Update: {
          attempt_number?: number;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error_classification?: string | null;
          error_metadata?: Json;
          id?: string;
          job_id?: string;
          phase22_dlq_id?: string | null;
          phase22_retry_id?: string | null;
          started_at?: string | null;
          status?: string;
          worker_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "brain_job_attempts_company_id_job_id_fkey";
            columns: ["company_id", "job_id"];
            isOneToOne: false;
            referencedRelation: "brain_jobs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_job_attempts_phase22_dlq_id_fkey";
            columns: ["phase22_dlq_id"];
            isOneToOne: false;
            referencedRelation: "integration_dead_letter_queue";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_job_attempts_phase22_retry_id_fkey";
            columns: ["phase22_retry_id"];
            isOneToOne: false;
            referencedRelation: "integration_retry_queue";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_jobs: {
        Row: {
          attempt_count: number;
          available_at: string;
          brain_run_id: string | null;
          cancelled_at: string | null;
          causation_id: string | null;
          claim_expires_at: string | null;
          claimed_at: string | null;
          claimed_by: string | null;
          company_id: string;
          completed_at: string | null;
          correlation_id: string | null;
          created_at: string;
          dataset_contract_id: string | null;
          dry_run: boolean;
          environment: string;
          error_classification: string | null;
          error_metadata: Json;
          execution_classification: string;
          experimental: boolean;
          failed_at: string | null;
          feature_version_ids: Json;
          id: string;
          idempotency_key: string;
          input_hash: string;
          job_type: string;
          maximum_attempts: number;
          output_hash: string | null;
          phase22_dlq_id: string | null;
          phase22_retry_id: string | null;
          priority: number;
          recovery_of_job_id: string | null;
          requested_by: string | null;
          resource_metadata: Json;
          rule_pack_code: string | null;
          rule_version_ids: Json;
          schedule_id: string | null;
          started_at: string | null;
          status: string;
          trigger_event_id: string | null;
          trigger_type: string;
          updated_at: string;
        };
        Insert: {
          attempt_count?: number;
          available_at?: string;
          brain_run_id?: string | null;
          cancelled_at?: string | null;
          causation_id?: string | null;
          claim_expires_at?: string | null;
          claimed_at?: string | null;
          claimed_by?: string | null;
          company_id: string;
          completed_at?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          dataset_contract_id?: string | null;
          dry_run?: boolean;
          environment: string;
          error_classification?: string | null;
          error_metadata?: Json;
          execution_classification: string;
          experimental?: boolean;
          failed_at?: string | null;
          feature_version_ids?: Json;
          id?: string;
          idempotency_key: string;
          input_hash: string;
          job_type: string;
          maximum_attempts?: number;
          output_hash?: string | null;
          phase22_dlq_id?: string | null;
          phase22_retry_id?: string | null;
          priority?: number;
          recovery_of_job_id?: string | null;
          requested_by?: string | null;
          resource_metadata?: Json;
          rule_pack_code?: string | null;
          rule_version_ids?: Json;
          schedule_id?: string | null;
          started_at?: string | null;
          status?: string;
          trigger_event_id?: string | null;
          trigger_type: string;
          updated_at?: string;
        };
        Update: {
          attempt_count?: number;
          available_at?: string;
          brain_run_id?: string | null;
          cancelled_at?: string | null;
          causation_id?: string | null;
          claim_expires_at?: string | null;
          claimed_at?: string | null;
          claimed_by?: string | null;
          company_id?: string;
          completed_at?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          dataset_contract_id?: string | null;
          dry_run?: boolean;
          environment?: string;
          error_classification?: string | null;
          error_metadata?: Json;
          execution_classification?: string;
          experimental?: boolean;
          failed_at?: string | null;
          feature_version_ids?: Json;
          id?: string;
          idempotency_key?: string;
          input_hash?: string;
          job_type?: string;
          maximum_attempts?: number;
          output_hash?: string | null;
          phase22_dlq_id?: string | null;
          phase22_retry_id?: string | null;
          priority?: number;
          recovery_of_job_id?: string | null;
          requested_by?: string | null;
          resource_metadata?: Json;
          rule_pack_code?: string | null;
          rule_version_ids?: Json;
          schedule_id?: string | null;
          started_at?: string | null;
          status?: string;
          trigger_event_id?: string | null;
          trigger_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_jobs_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_jobs_company_id_dataset_contract_id_fkey";
            columns: ["company_id", "dataset_contract_id"];
            isOneToOne: false;
            referencedRelation: "brain_dataset_contracts";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_jobs_phase22_dlq_id_fkey";
            columns: ["phase22_dlq_id"];
            isOneToOne: false;
            referencedRelation: "integration_dead_letter_queue";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_jobs_phase22_retry_id_fkey";
            columns: ["phase22_retry_id"];
            isOneToOne: false;
            referencedRelation: "integration_retry_queue";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_jobs_schedule_fk";
            columns: ["company_id", "schedule_id"];
            isOneToOne: false;
            referencedRelation: "brain_schedules";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_jobs_trigger_event_id_fkey";
            columns: ["trigger_event_id"];
            isOneToOne: false;
            referencedRelation: "integration_event_bus";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_kill_switches: {
        Row: {
          active: boolean;
          company_id: string;
          created_at: string;
          environment: string;
          expires_at: string | null;
          id: string;
          owner_id: string;
          reason: string;
          released_at: string | null;
          released_by: string | null;
          scope_reference: string | null;
          scope_type: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          created_at?: string;
          environment: string;
          expires_at?: string | null;
          id?: string;
          owner_id: string;
          reason: string;
          released_at?: string | null;
          released_by?: string | null;
          scope_reference?: string | null;
          scope_type: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          created_at?: string;
          environment?: string;
          expires_at?: string | null;
          id?: string;
          owner_id?: string;
          reason?: string;
          released_at?: string | null;
          released_by?: string | null;
          scope_reference?: string | null;
          scope_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_kill_switches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_legacy_mappings: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          legacy_record_id: string;
          legacy_record_type: string;
          legacy_source: string;
          migrated_at: string | null;
          migration_status: string;
          reconciliation_notes: string | null;
          reconciliation_status: string;
          zappos_record_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          legacy_record_id: string;
          legacy_record_type: string;
          legacy_source: string;
          migrated_at?: string | null;
          migration_status?: string;
          reconciliation_notes?: string | null;
          reconciliation_status?: string;
          zappos_record_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          legacy_record_id?: string;
          legacy_record_type?: string;
          legacy_source?: string;
          migrated_at?: string | null;
          migration_status?: string;
          reconciliation_notes?: string | null;
          reconciliation_status?: string;
          zappos_record_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_legacy_mappings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_model_registry: {
        Row: {
          approved_domains: Json;
          capabilities: Json;
          company_id: string | null;
          context_metadata: Json;
          cost_metadata: Json;
          created_at: string;
          data_classification_limit: string;
          evaluation_status: string;
          experimental: boolean;
          id: string;
          model_code: string;
          model_name: string;
          model_version: string | null;
          provider_type: string;
          restricted_domains: Json;
          status: string;
        };
        Insert: {
          approved_domains?: Json;
          capabilities?: Json;
          company_id?: string | null;
          context_metadata?: Json;
          cost_metadata?: Json;
          created_at?: string;
          data_classification_limit: string;
          evaluation_status?: string;
          experimental?: boolean;
          id?: string;
          model_code: string;
          model_name: string;
          model_version?: string | null;
          provider_type: string;
          restricted_domains?: Json;
          status: string;
        };
        Update: {
          approved_domains?: Json;
          capabilities?: Json;
          company_id?: string | null;
          context_metadata?: Json;
          cost_metadata?: Json;
          created_at?: string;
          data_classification_limit?: string;
          evaluation_status?: string;
          experimental?: boolean;
          id?: string;
          model_code?: string;
          model_name?: string;
          model_version?: string | null;
          provider_type?: string;
          restricted_domains?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_model_registry_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_operational_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          alert_type: string;
          company_id: string;
          component: string | null;
          created_at: string;
          detected_at: string;
          environment: string;
          id: string;
          redacted_metadata: Json;
          resolved_at: string | null;
          severity: string;
          source_reference: string | null;
          status: string;
          title: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type: string;
          company_id: string;
          component?: string | null;
          created_at?: string;
          detected_at?: string;
          environment: string;
          id?: string;
          redacted_metadata?: Json;
          resolved_at?: string | null;
          severity: string;
          source_reference?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type?: string;
          company_id?: string;
          component?: string | null;
          created_at?: string;
          detected_at?: string;
          environment?: string;
          id?: string;
          redacted_metadata?: Json;
          resolved_at?: string | null;
          severity?: string;
          source_reference?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_operational_alerts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_operational_metrics: {
        Row: {
          company_id: string;
          component: string;
          environment: string;
          id: string;
          metadata: Json;
          metric_code: string;
          metric_value: number;
          recorded_at: string;
          runtime_version: string | null;
          unit: string;
          window_end: string;
          window_start: string;
        };
        Insert: {
          company_id: string;
          component: string;
          environment: string;
          id?: string;
          metadata?: Json;
          metric_code: string;
          metric_value: number;
          recorded_at?: string;
          runtime_version?: string | null;
          unit: string;
          window_end: string;
          window_start: string;
        };
        Update: {
          company_id?: string;
          component?: string;
          environment?: string;
          id?: string;
          metadata?: Json;
          metric_code?: string;
          metric_value?: number;
          recorded_at?: string;
          runtime_version?: string | null;
          unit?: string;
          window_end?: string;
          window_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_operational_metrics_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_outcome_records: {
        Row: {
          attribution_confidence: number | null;
          company_id: string;
          created_at: string;
          evidence: Json;
          id: string;
          outcome_date: string | null;
          outcome_type: string;
          recommendation_id: string | null;
          reviewer_id: string | null;
        };
        Insert: {
          attribution_confidence?: number | null;
          company_id: string;
          created_at?: string;
          evidence?: Json;
          id?: string;
          outcome_date?: string | null;
          outcome_type: string;
          recommendation_id?: string | null;
          reviewer_id?: string | null;
        };
        Update: {
          attribution_confidence?: number | null;
          company_id?: string;
          created_at?: string;
          evidence?: Json;
          id?: string;
          outcome_date?: string | null;
          outcome_type?: string;
          recommendation_id?: string | null;
          reviewer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "brain_outcome_records_recommendation_id_fkey";
            columns: ["recommendation_id"];
            isOneToOne: false;
            referencedRelation: "brain_recommendations";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_privacy_reviews: {
        Row: {
          company_id: string;
          created_at: string;
          data_classification: string;
          decision_note: string | null;
          environment: string;
          expires_at: string | null;
          id: string;
          purpose: string;
          reviewed_at: string | null;
          reviewer_id: string | null;
          status: string;
          subject_id: string | null;
          subject_type: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          data_classification: string;
          decision_note?: string | null;
          environment: string;
          expires_at?: string | null;
          id?: string;
          purpose: string;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          status?: string;
          subject_id?: string | null;
          subject_type: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          data_classification?: string;
          decision_note?: string | null;
          environment?: string;
          expires_at?: string | null;
          id?: string;
          purpose?: string;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          status?: string;
          subject_id?: string | null;
          subject_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_privacy_reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_promotion_candidates: {
        Row: {
          candidate_reference: Json;
          candidate_type: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          decided_at: string | null;
          decided_by: string | null;
          decision_note: string | null;
          decision_status: string;
          eligibility_status: string;
          experimental_model_id: string | null;
          id: string;
          metric_snapshot: Json;
          thresholds: Json;
        };
        Insert: {
          candidate_reference?: Json;
          candidate_type: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_note?: string | null;
          decision_status?: string;
          eligibility_status: string;
          experimental_model_id?: string | null;
          id?: string;
          metric_snapshot?: Json;
          thresholds?: Json;
        };
        Update: {
          candidate_reference?: Json;
          candidate_type?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_note?: string | null;
          decision_status?: string;
          eligibility_status?: string;
          experimental_model_id?: string | null;
          id?: string;
          metric_snapshot?: Json;
          thresholds?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "brain_promotion_candidates_company_id_experimental_model_i_fkey";
            columns: ["company_id", "experimental_model_id"];
            isOneToOne: false;
            referencedRelation: "brain_experimental_models";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_promotion_candidates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_prompt_registry: {
        Row: {
          company_id: string | null;
          created_at: string;
          domain: string;
          experimental: boolean;
          id: string;
          intended_request_type: string;
          name: string;
          owner_id: string | null;
          prompt_code: string;
          purpose: string;
          safety_classification: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          domain: string;
          experimental?: boolean;
          id?: string;
          intended_request_type: string;
          name: string;
          owner_id?: string | null;
          prompt_code: string;
          purpose: string;
          safety_classification: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          domain?: string;
          experimental?: boolean;
          id?: string;
          intended_request_type?: string;
          name?: string;
          owner_id?: string | null;
          prompt_code?: string;
          purpose?: string;
          safety_classification?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_prompt_registry_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_prompt_versions: {
        Row: {
          allowed_dataset_contracts: Json;
          created_at: string;
          expected_input_schema: Json;
          expected_output_schema: Json;
          id: string;
          prompt_id: string;
          restricted_fields: Json;
          reviewer_id: string | null;
          status: string;
          version: number;
        };
        Insert: {
          allowed_dataset_contracts?: Json;
          created_at?: string;
          expected_input_schema?: Json;
          expected_output_schema?: Json;
          id?: string;
          prompt_id: string;
          restricted_fields?: Json;
          reviewer_id?: string | null;
          status?: string;
          version: number;
        };
        Update: {
          allowed_dataset_contracts?: Json;
          created_at?: string;
          expected_input_schema?: Json;
          expected_output_schema?: Json;
          id?: string;
          prompt_id?: string;
          restricted_fields?: Json;
          reviewer_id?: string | null;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_prompt_versions_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "brain_prompt_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_query_definitions: {
        Row: {
          active: boolean;
          company_id: string;
          created_at: string;
          filters_schema: Json;
          id: string;
          intent: string;
          owner_id: string | null;
          query_code: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          created_at?: string;
          filters_schema?: Json;
          id?: string;
          intent: string;
          owner_id?: string | null;
          query_code: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          created_at?: string;
          filters_schema?: Json;
          id?: string;
          intent?: string;
          owner_id?: string | null;
          query_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_query_definitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_query_executions: {
        Row: {
          company_id: string;
          created_at: string;
          executed_by: string | null;
          filters_metadata: Json;
          id: string;
          query_definition_id: string;
          result_count: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          executed_by?: string | null;
          filters_metadata?: Json;
          id?: string;
          query_definition_id: string;
          result_count?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          executed_by?: string | null;
          filters_metadata?: Json;
          id?: string;
          query_definition_id?: string;
          result_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_query_executions_company_id_query_definition_id_fkey";
            columns: ["company_id", "query_definition_id"];
            isOneToOne: false;
            referencedRelation: "brain_query_definitions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_readiness_checks: {
        Row: {
          check_code: string;
          checked_at: string | null;
          checked_by: string | null;
          company_id: string;
          created_at: string;
          environment: string;
          evidence_metadata: Json;
          id: string;
          release_bundle_id: string | null;
          required: boolean;
          state: string;
        };
        Insert: {
          check_code: string;
          checked_at?: string | null;
          checked_by?: string | null;
          company_id: string;
          created_at?: string;
          environment: string;
          evidence_metadata?: Json;
          id?: string;
          release_bundle_id?: string | null;
          required?: boolean;
          state?: string;
        };
        Update: {
          check_code?: string;
          checked_at?: string | null;
          checked_by?: string | null;
          company_id?: string;
          created_at?: string;
          environment?: string;
          evidence_metadata?: Json;
          id?: string;
          release_bundle_id?: string | null;
          required?: boolean;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_readiness_checks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_readiness_checks_company_id_release_bundle_id_fkey";
            columns: ["company_id", "release_bundle_id"];
            isOneToOne: false;
            referencedRelation: "brain_release_bundles";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_recommendations: {
        Row: {
          brain_insight_id: string;
          company_id: string;
          confidence: string;
          created_at: string;
          domain_action_link_metadata: Json;
          evidence: Json;
          expires_at: string | null;
          generated_at: string;
          id: string;
          proposed_action_description: string;
          recommendation_type: string;
          review_note: string | null;
          review_status: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          risk_classification: string;
          target_domain: string;
        };
        Insert: {
          brain_insight_id: string;
          company_id: string;
          confidence: string;
          created_at?: string;
          domain_action_link_metadata?: Json;
          evidence?: Json;
          expires_at?: string | null;
          generated_at?: string;
          id?: string;
          proposed_action_description: string;
          recommendation_type: string;
          review_note?: string | null;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_classification: string;
          target_domain: string;
        };
        Update: {
          brain_insight_id?: string;
          company_id?: string;
          confidence?: string;
          created_at?: string;
          domain_action_link_metadata?: Json;
          evidence?: Json;
          expires_at?: string | null;
          generated_at?: string;
          id?: string;
          proposed_action_description?: string;
          recommendation_type?: string;
          review_note?: string | null;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_classification?: string;
          target_domain?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_recommendations_company_id_brain_insight_id_fkey";
            columns: ["company_id", "brain_insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_release_bundle_items: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          item_reference: string;
          item_type: string;
          release_bundle_id: string;
          version_reference: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          item_reference: string;
          item_type: string;
          release_bundle_id: string;
          version_reference?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          item_reference?: string;
          item_type?: string;
          release_bundle_id?: string;
          version_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "brain_release_bundle_items_company_id_release_bundle_id_fkey";
            columns: ["company_id", "release_bundle_id"];
            isOneToOne: false;
            referencedRelation: "brain_release_bundles";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_release_bundles: {
        Row: {
          approver_id: string | null;
          benchmark_id: string | null;
          bundle_code: string;
          company_id: string;
          compatibility_checks: Json;
          created_at: string;
          effective_at: string | null;
          environment: string;
          id: string;
          owner_id: string;
          promotion_candidate_id: string | null;
          release_notes: string;
          reviewer_id: string | null;
          risk_classification: string;
          rollback_plan: string;
          rollback_target_id: string | null;
          safety_evaluation_id: string | null;
          staging_verification: Json;
          status: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          approver_id?: string | null;
          benchmark_id?: string | null;
          bundle_code: string;
          company_id: string;
          compatibility_checks?: Json;
          created_at?: string;
          effective_at?: string | null;
          environment: string;
          id?: string;
          owner_id: string;
          promotion_candidate_id?: string | null;
          release_notes: string;
          reviewer_id?: string | null;
          risk_classification: string;
          rollback_plan: string;
          rollback_target_id?: string | null;
          safety_evaluation_id?: string | null;
          staging_verification?: Json;
          status?: string;
          updated_at?: string;
          version: string;
        };
        Update: {
          approver_id?: string | null;
          benchmark_id?: string | null;
          bundle_code?: string;
          company_id?: string;
          compatibility_checks?: Json;
          created_at?: string;
          effective_at?: string | null;
          environment?: string;
          id?: string;
          owner_id?: string;
          promotion_candidate_id?: string | null;
          release_notes?: string;
          reviewer_id?: string | null;
          risk_classification?: string;
          rollback_plan?: string;
          rollback_target_id?: string | null;
          safety_evaluation_id?: string | null;
          staging_verification?: Json;
          status?: string;
          updated_at?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_release_bundles_benchmark_id_fkey";
            columns: ["benchmark_id"];
            isOneToOne: false;
            referencedRelation: "brain_benchmarks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_release_bundles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_release_bundles_promotion_candidate_id_fkey";
            columns: ["promotion_candidate_id"];
            isOneToOne: false;
            referencedRelation: "brain_promotion_candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_release_bundles_safety_evaluation_id_fkey";
            columns: ["safety_evaluation_id"];
            isOneToOne: false;
            referencedRelation: "brain_safety_evaluations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_release_rollback_target_fk";
            columns: ["company_id", "rollback_target_id"];
            isOneToOne: false;
            referencedRelation: "brain_release_bundles";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_replay_runs: {
        Row: {
          company_id: string;
          comparison_report_id: string | null;
          completed_at: string | null;
          created_at: string;
          error_summary: string | null;
          evaluation_dataset_id: string;
          feature_version_ids: Json;
          id: string;
          period_end: string;
          period_start: string;
          requested_at: string;
          requested_by: string | null;
          result_summary: Json;
          rules_used: Json;
          runtime_ms: number | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          comparison_report_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          error_summary?: string | null;
          evaluation_dataset_id: string;
          feature_version_ids?: Json;
          id?: string;
          period_end: string;
          period_start: string;
          requested_at?: string;
          requested_by?: string | null;
          result_summary?: Json;
          rules_used?: Json;
          runtime_ms?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          company_id?: string;
          comparison_report_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          error_summary?: string | null;
          evaluation_dataset_id?: string;
          feature_version_ids?: Json;
          id?: string;
          period_end?: string;
          period_start?: string;
          requested_at?: string;
          requested_by?: string | null;
          result_summary?: Json;
          rules_used?: Json;
          runtime_ms?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_replay_comparison_report_fk";
            columns: ["company_id", "comparison_report_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_reports";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_replay_runs_company_id_evaluation_dataset_id_fkey";
            columns: ["company_id", "evaluation_dataset_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_datasets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_replay_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_resource_limits: {
        Row: {
          action_on_exceed: string;
          company_id: string;
          created_at: string;
          environment: string;
          id: string;
          limit_type: string;
          maximum_value: number;
          owner_id: string | null;
          reviewer_id: string | null;
          updated_at: string;
        };
        Insert: {
          action_on_exceed: string;
          company_id: string;
          created_at?: string;
          environment: string;
          id?: string;
          limit_type: string;
          maximum_value: number;
          owner_id?: string | null;
          reviewer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          action_on_exceed?: string;
          company_id?: string;
          created_at?: string;
          environment?: string;
          id?: string;
          limit_type?: string;
          maximum_value?: number;
          owner_id?: string | null;
          reviewer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_resource_limits_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_retention_policies: {
        Row: {
          approved_by: string | null;
          audit_requirement: boolean;
          company_id: string;
          created_at: string;
          data_classification: string;
          experimental: boolean;
          id: string;
          legal_hold: boolean;
          legal_requirement_metadata: Json;
          lifecycle_state: string;
          operational_need: string;
          record_type: string;
          retention_days: number;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          audit_requirement?: boolean;
          company_id: string;
          created_at?: string;
          data_classification: string;
          experimental?: boolean;
          id?: string;
          legal_hold?: boolean;
          legal_requirement_metadata?: Json;
          lifecycle_state?: string;
          operational_need: string;
          record_type: string;
          retention_days: number;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          audit_requirement?: boolean;
          company_id?: string;
          created_at?: string;
          data_classification?: string;
          experimental?: boolean;
          id?: string;
          legal_hold?: boolean;
          legal_requirement_metadata?: Json;
          lifecycle_state?: string;
          operational_need?: string;
          record_type?: string;
          retention_days?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_retention_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_rule_evaluations: {
        Row: {
          brain_run_id: string | null;
          company_id: string;
          condition_results: Json;
          conditions_evaluated: Json;
          confidence_inputs: Json;
          created_at: string;
          duration_ms: number;
          evaluated_at: string;
          evidence: Json;
          features_used: Json;
          id: string;
          input_hash: string;
          output_hash: string;
          recommendation_eligible: boolean;
          rule_version_id: string;
          severity: string | null;
          subject_id: string | null;
          subject_type: string;
          triggered: boolean;
        };
        Insert: {
          brain_run_id?: string | null;
          company_id: string;
          condition_results?: Json;
          conditions_evaluated?: Json;
          confidence_inputs?: Json;
          created_at?: string;
          duration_ms?: number;
          evaluated_at?: string;
          evidence?: Json;
          features_used?: Json;
          id?: string;
          input_hash: string;
          output_hash: string;
          recommendation_eligible?: boolean;
          rule_version_id: string;
          severity?: string | null;
          subject_id?: string | null;
          subject_type: string;
          triggered: boolean;
        };
        Update: {
          brain_run_id?: string | null;
          company_id?: string;
          condition_results?: Json;
          conditions_evaluated?: Json;
          confidence_inputs?: Json;
          created_at?: string;
          duration_ms?: number;
          evaluated_at?: string;
          evidence?: Json;
          features_used?: Json;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          recommendation_eligible?: boolean;
          rule_version_id?: string;
          severity?: string | null;
          subject_id?: string | null;
          subject_type?: string;
          triggered?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "brain_rule_evaluations_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_rule_evaluations_company_id_rule_version_id_fkey";
            columns: ["company_id", "rule_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_rule_performance: {
        Row: {
          accuracy_percent: number | null;
          company_id: string;
          confirmed_count: number;
          created_at: string;
          evaluated_at: string;
          feedback_count: number;
          id: string;
          metadata: Json;
          rejected_count: number;
          rule_version_id: string;
          trigger_count: number;
        };
        Insert: {
          accuracy_percent?: number | null;
          company_id: string;
          confirmed_count?: number;
          created_at?: string;
          evaluated_at?: string;
          feedback_count?: number;
          id?: string;
          metadata?: Json;
          rejected_count?: number;
          rule_version_id: string;
          trigger_count?: number;
        };
        Update: {
          accuracy_percent?: number | null;
          company_id?: string;
          confirmed_count?: number;
          created_at?: string;
          evaluated_at?: string;
          feedback_count?: number;
          id?: string;
          metadata?: Json;
          rejected_count?: number;
          rule_version_id?: string;
          trigger_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_rule_performance_company_id_rule_version_id_fkey";
            columns: ["company_id", "rule_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_rule_registry: {
        Row: {
          company_id: string;
          created_at: string;
          description: string;
          domain: string;
          experimental: boolean;
          id: string;
          name: string;
          owner_id: string | null;
          rule_code: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description: string;
          domain: string;
          experimental?: boolean;
          id?: string;
          name: string;
          owner_id?: string | null;
          rule_code: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string;
          domain?: string;
          experimental?: boolean;
          id?: string;
          name?: string;
          owner_id?: string | null;
          rule_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_rule_registry_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_rule_versions: {
        Row: {
          company_id: string;
          confidence_policy: Json;
          created_at: string;
          created_by: string | null;
          effective_at: string | null;
          evidence_requirements: Json;
          id: string;
          input_contract: Json;
          output_contract: Json;
          retired_at: string | null;
          rule_id: string;
          severity_logic: Json;
          status: string;
          version: number;
        };
        Insert: {
          company_id: string;
          confidence_policy?: Json;
          created_at?: string;
          created_by?: string | null;
          effective_at?: string | null;
          evidence_requirements?: Json;
          id?: string;
          input_contract?: Json;
          output_contract?: Json;
          retired_at?: string | null;
          rule_id: string;
          severity_logic?: Json;
          status?: string;
          version: number;
        };
        Update: {
          company_id?: string;
          confidence_policy?: Json;
          created_at?: string;
          created_by?: string | null;
          effective_at?: string | null;
          evidence_requirements?: Json;
          id?: string;
          input_contract?: Json;
          output_contract?: Json;
          retired_at?: string | null;
          rule_id?: string;
          severity_logic?: Json;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_rule_versions_company_id_rule_id_fkey";
            columns: ["company_id", "rule_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_registry";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_runtime_versions: {
        Row: {
          approved_by: string | null;
          company_id: string;
          created_at: string;
          environment: string;
          id: string;
          minimum_runtime_version: string | null;
          owner_id: string | null;
          reviewer_id: string | null;
          service_identity_reference: string | null;
          source_revision_metadata: Json;
          status: string;
          version_code: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          environment: string;
          id?: string;
          minimum_runtime_version?: string | null;
          owner_id?: string | null;
          reviewer_id?: string | null;
          service_identity_reference?: string | null;
          source_revision_metadata?: Json;
          status?: string;
          version_code: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          environment?: string;
          id?: string;
          minimum_runtime_version?: string | null;
          owner_id?: string | null;
          reviewer_id?: string | null;
          service_identity_reference?: string | null;
          source_revision_metadata?: Json;
          status?: string;
          version_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_runtime_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_safety_evaluations: {
        Row: {
          advisory_only: boolean;
          advisory_recommendation: string;
          company_id: string;
          created_at: string;
          evaluation_dataset_id: string | null;
          experimental_model_id: string | null;
          generated_at: string;
          id: string;
          metrics: Json;
          replay_run_id: string | null;
          safety_category: string;
          severity: string;
        };
        Insert: {
          advisory_only?: boolean;
          advisory_recommendation: string;
          company_id: string;
          created_at?: string;
          evaluation_dataset_id?: string | null;
          experimental_model_id?: string | null;
          generated_at?: string;
          id?: string;
          metrics?: Json;
          replay_run_id?: string | null;
          safety_category: string;
          severity: string;
        };
        Update: {
          advisory_only?: boolean;
          advisory_recommendation?: string;
          company_id?: string;
          created_at?: string;
          evaluation_dataset_id?: string | null;
          experimental_model_id?: string | null;
          generated_at?: string;
          id?: string;
          metrics?: Json;
          replay_run_id?: string | null;
          safety_category?: string;
          severity?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_safety_evaluations_company_id_evaluation_dataset_id_fkey";
            columns: ["company_id", "evaluation_dataset_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_datasets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_safety_evaluations_company_id_experimental_model_id_fkey";
            columns: ["company_id", "experimental_model_id"];
            isOneToOne: false;
            referencedRelation: "brain_experimental_models";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_safety_evaluations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_safety_evaluations_company_id_replay_run_id_fkey";
            columns: ["company_id", "replay_run_id"];
            isOneToOne: false;
            referencedRelation: "brain_replay_runs";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_schedule_runs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          error_metadata: Json;
          id: string;
          job_id: string | null;
          overlap_action: string | null;
          schedule_id: string;
          scheduled_for: string;
          started_at: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          error_metadata?: Json;
          id?: string;
          job_id?: string | null;
          overlap_action?: string | null;
          schedule_id: string;
          scheduled_for: string;
          started_at?: string | null;
          status: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          error_metadata?: Json;
          id?: string;
          job_id?: string | null;
          overlap_action?: string | null;
          schedule_id?: string;
          scheduled_for?: string;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_schedule_runs_company_id_job_id_fkey";
            columns: ["company_id", "job_id"];
            isOneToOne: false;
            referencedRelation: "brain_jobs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_schedule_runs_company_id_schedule_id_fkey";
            columns: ["company_id", "schedule_id"];
            isOneToOne: false;
            referencedRelation: "brain_schedules";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_schedules: {
        Row: {
          analysis_type: string;
          catch_up_policy: string;
          company_id: string;
          created_at: string;
          dataset_contract_ids: Json;
          enabled: boolean;
          end_at: string | null;
          environment: string;
          experimental: boolean;
          id: string;
          last_scheduled_at: string | null;
          maximum_concurrent_runs: number;
          maximum_runtime_seconds: number;
          name: string;
          next_scheduled_at: string | null;
          overlap_policy: string;
          owner_id: string | null;
          production_approval_status: string;
          purpose: string;
          readiness_status: string;
          reviewer_id: string | null;
          rule_pack_code: string | null;
          schedule_code: string;
          schedule_expression: string | null;
          schedule_kind: string;
          start_at: string | null;
          time_zone: string;
          updated_at: string;
        };
        Insert: {
          analysis_type: string;
          catch_up_policy?: string;
          company_id: string;
          created_at?: string;
          dataset_contract_ids?: Json;
          enabled?: boolean;
          end_at?: string | null;
          environment: string;
          experimental?: boolean;
          id?: string;
          last_scheduled_at?: string | null;
          maximum_concurrent_runs?: number;
          maximum_runtime_seconds?: number;
          name: string;
          next_scheduled_at?: string | null;
          overlap_policy?: string;
          owner_id?: string | null;
          production_approval_status?: string;
          purpose: string;
          readiness_status?: string;
          reviewer_id?: string | null;
          rule_pack_code?: string | null;
          schedule_code: string;
          schedule_expression?: string | null;
          schedule_kind: string;
          start_at?: string | null;
          time_zone?: string;
          updated_at?: string;
        };
        Update: {
          analysis_type?: string;
          catch_up_policy?: string;
          company_id?: string;
          created_at?: string;
          dataset_contract_ids?: Json;
          enabled?: boolean;
          end_at?: string | null;
          environment?: string;
          experimental?: boolean;
          id?: string;
          last_scheduled_at?: string | null;
          maximum_concurrent_runs?: number;
          maximum_runtime_seconds?: number;
          name?: string;
          next_scheduled_at?: string | null;
          overlap_policy?: string;
          owner_id?: string | null;
          production_approval_status?: string;
          purpose?: string;
          readiness_status?: string;
          reviewer_id?: string | null;
          rule_pack_code?: string | null;
          schedule_code?: string;
          schedule_expression?: string | null;
          schedule_kind?: string;
          start_at?: string | null;
          time_zone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_schedules_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_service_health: {
        Row: {
          backlog_count: number | null;
          checked_at: string;
          company_id: string;
          component: string;
          created_at: string;
          dependency_health: Json;
          deployment_identifier: string | null;
          environment: string;
          error_rate_percent: number | null;
          health_state: string;
          id: string;
          lag_seconds: number | null;
          last_failure_at: string | null;
          last_success_at: string | null;
          metadata: Json;
          runtime_version: string | null;
          throughput_per_minute: number | null;
        };
        Insert: {
          backlog_count?: number | null;
          checked_at?: string;
          company_id: string;
          component: string;
          created_at?: string;
          dependency_health?: Json;
          deployment_identifier?: string | null;
          environment: string;
          error_rate_percent?: number | null;
          health_state: string;
          id?: string;
          lag_seconds?: number | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          metadata?: Json;
          runtime_version?: string | null;
          throughput_per_minute?: number | null;
        };
        Update: {
          backlog_count?: number | null;
          checked_at?: string;
          company_id?: string;
          component?: string;
          created_at?: string;
          dependency_health?: Json;
          deployment_identifier?: string | null;
          environment?: string;
          error_rate_percent?: number | null;
          health_state?: string;
          id?: string;
          lag_seconds?: number | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          metadata?: Json;
          runtime_version?: string | null;
          throughput_per_minute?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "brain_service_health_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_service_identities: {
        Row: {
          allowed_capabilities: Json;
          company_id: string;
          created_at: string;
          environment: string;
          id: string;
          identity_code: string;
          last_rotated_at: string | null;
          rotation_due_at: string | null;
          secret_reference: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          allowed_capabilities?: Json;
          company_id: string;
          created_at?: string;
          environment: string;
          id?: string;
          identity_code: string;
          last_rotated_at?: string | null;
          rotation_due_at?: string | null;
          secret_reference: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          allowed_capabilities?: Json;
          company_id?: string;
          created_at?: string;
          environment?: string;
          id?: string;
          identity_code?: string;
          last_rotated_at?: string | null;
          rotation_due_at?: string | null;
          secret_reference?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_service_identities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_shadow_results: {
        Row: {
          agreement: boolean;
          company_id: string;
          confidence_difference: number | null;
          created_at: string;
          evaluation_dataset_id: string;
          experimental_model_id: string | null;
          experimental_result: Json;
          experimental_rule_version_id: string | null;
          id: string;
          production_result: Json;
          production_rule_version_id: string | null;
          replay_run_id: string | null;
          runtime_difference_ms: number | null;
          subject_reference: string;
        };
        Insert: {
          agreement: boolean;
          company_id: string;
          confidence_difference?: number | null;
          created_at?: string;
          evaluation_dataset_id: string;
          experimental_model_id?: string | null;
          experimental_result?: Json;
          experimental_rule_version_id?: string | null;
          id?: string;
          production_result?: Json;
          production_rule_version_id?: string | null;
          replay_run_id?: string | null;
          runtime_difference_ms?: number | null;
          subject_reference: string;
        };
        Update: {
          agreement?: boolean;
          company_id?: string;
          confidence_difference?: number | null;
          created_at?: string;
          evaluation_dataset_id?: string;
          experimental_model_id?: string | null;
          experimental_result?: Json;
          experimental_rule_version_id?: string | null;
          id?: string;
          production_result?: Json;
          production_rule_version_id?: string | null;
          replay_run_id?: string | null;
          runtime_difference_ms?: number | null;
          subject_reference?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_shadow_results_company_id_evaluation_dataset_id_fkey";
            columns: ["company_id", "evaluation_dataset_id"];
            isOneToOne: false;
            referencedRelation: "brain_evaluation_datasets";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_shadow_results_company_id_experimental_model_id_fkey";
            columns: ["company_id", "experimental_model_id"];
            isOneToOne: false;
            referencedRelation: "brain_experimental_models";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_shadow_results_company_id_experimental_rule_version__fkey";
            columns: ["company_id", "experimental_rule_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_shadow_results_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_shadow_results_company_id_production_rule_version_id_fkey";
            columns: ["company_id", "production_rule_version_id"];
            isOneToOne: false;
            referencedRelation: "brain_rule_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_shadow_results_company_id_replay_run_id_fkey";
            columns: ["company_id", "replay_run_id"];
            isOneToOne: false;
            referencedRelation: "brain_replay_runs";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_slo_definitions: {
        Row: {
          breach_threshold_percent: number;
          company_id: string;
          component: string;
          created_at: string;
          data_source: string;
          effective_at: string;
          environment: string;
          id: string;
          measurement_window_minutes: number;
          owner_id: string | null;
          slo_code: string;
          status: string;
          target_percent: number;
          warning_threshold_percent: number;
        };
        Insert: {
          breach_threshold_percent: number;
          company_id: string;
          component: string;
          created_at?: string;
          data_source: string;
          effective_at?: string;
          environment: string;
          id?: string;
          measurement_window_minutes: number;
          owner_id?: string | null;
          slo_code: string;
          status?: string;
          target_percent: number;
          warning_threshold_percent: number;
        };
        Update: {
          breach_threshold_percent?: number;
          company_id?: string;
          component?: string;
          created_at?: string;
          data_source?: string;
          effective_at?: string;
          environment?: string;
          id?: string;
          measurement_window_minutes?: number;
          owner_id?: string | null;
          slo_code?: string;
          status?: string;
          target_percent?: number;
          warning_threshold_percent?: number;
        };
        Relationships: [
          {
            foreignKeyName: "brain_slo_definitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      brain_trace_records: {
        Row: {
          brain_run_id: string | null;
          company_id: string;
          completed_at: string | null;
          component: string;
          created_at: string;
          duration_ms: number | null;
          environment: string;
          error_classification: string | null;
          id: string;
          job_id: string | null;
          metadata: Json;
          operation: string;
          parent_span_id: string | null;
          redaction_state: string;
          span_id: string;
          started_at: string;
          status: string;
          trace_id: string;
        };
        Insert: {
          brain_run_id?: string | null;
          company_id: string;
          completed_at?: string | null;
          component: string;
          created_at?: string;
          duration_ms?: number | null;
          environment: string;
          error_classification?: string | null;
          id?: string;
          job_id?: string | null;
          metadata?: Json;
          operation: string;
          parent_span_id?: string | null;
          redaction_state?: string;
          span_id: string;
          started_at: string;
          status: string;
          trace_id: string;
        };
        Update: {
          brain_run_id?: string | null;
          company_id?: string;
          completed_at?: string | null;
          component?: string;
          created_at?: string;
          duration_ms?: number | null;
          environment?: string;
          error_classification?: string | null;
          id?: string;
          job_id?: string | null;
          metadata?: Json;
          operation?: string;
          parent_span_id?: string | null;
          redaction_state?: string;
          span_id?: string;
          started_at?: string;
          status?: string;
          trace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_trace_records_company_id_brain_run_id_fkey";
            columns: ["company_id", "brain_run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_trace_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brain_trace_records_company_id_job_id_fkey";
            columns: ["company_id", "job_id"];
            isOneToOne: false;
            referencedRelation: "brain_jobs";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      brain_worker_heartbeats: {
        Row: {
          company_id: string;
          created_at: string;
          current_job_id: string | null;
          drain_state: string;
          environment: string;
          health_state: string;
          host_metadata: Json;
          id: string;
          jobs_completed: number;
          jobs_failed: number;
          last_heartbeat_at: string;
          process_metadata: Json;
          runtime_version: string;
          started_at: string;
          updated_at: string;
          worker_id: string;
          worker_type: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          current_job_id?: string | null;
          drain_state?: string;
          environment: string;
          health_state?: string;
          host_metadata?: Json;
          id?: string;
          jobs_completed?: number;
          jobs_failed?: number;
          last_heartbeat_at?: string;
          process_metadata?: Json;
          runtime_version: string;
          started_at?: string;
          updated_at?: string;
          worker_id: string;
          worker_type: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          current_job_id?: string | null;
          drain_state?: string;
          environment?: string;
          health_state?: string;
          host_metadata?: Json;
          id?: string;
          jobs_completed?: number;
          jobs_failed?: number;
          last_heartbeat_at?: string;
          process_metadata?: Json;
          runtime_version?: string;
          started_at?: string;
          updated_at?: string;
          worker_id?: string;
          worker_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brain_worker_heartbeats_company_id_current_job_id_fkey";
            columns: ["company_id", "current_job_id"];
            isOneToOne: false;
            referencedRelation: "brain_jobs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "brain_worker_heartbeats_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      command_centre_layouts: {
        Row: {
          collapsed_widgets: Json;
          company_id: string;
          updated_at: string;
          user_id: string;
          widget_order: Json;
          widget_sizes: Json;
        };
        Insert: {
          collapsed_widgets?: Json;
          company_id: string;
          updated_at?: string;
          user_id: string;
          widget_order?: Json;
          widget_sizes?: Json;
        };
        Update: {
          collapsed_widgets?: Json;
          company_id?: string;
          updated_at?: string;
          user_id?: string;
          widget_order?: Json;
          widget_sizes?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "command_centre_layouts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      command_centre_notifications: {
        Row: {
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          priority: string;
          source: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          priority?: string;
          source: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          priority?: string;
          source?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "command_centre_notifications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      command_centre_watchlists: {
        Row: {
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          position: number;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          position?: number;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          position?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "command_centre_watchlists_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      communication_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "communication_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      communication_delivery_attempts: {
        Row: {
          attempt_number: number;
          company_id: string;
          created_at: string;
          failure_code: string | null;
          failure_detail_metadata: Json;
          id: string;
          message_id: string;
          phase22_dlq_id: string | null;
          phase22_retry_id: string | null;
          provider: string | null;
          provider_confirmed_at: string | null;
          provider_reference: string | null;
          state: string;
        };
        Insert: {
          attempt_number: number;
          company_id: string;
          created_at?: string;
          failure_code?: string | null;
          failure_detail_metadata?: Json;
          id?: string;
          message_id: string;
          phase22_dlq_id?: string | null;
          phase22_retry_id?: string | null;
          provider?: string | null;
          provider_confirmed_at?: string | null;
          provider_reference?: string | null;
          state: string;
        };
        Update: {
          attempt_number?: number;
          company_id?: string;
          created_at?: string;
          failure_code?: string | null;
          failure_detail_metadata?: Json;
          id?: string;
          message_id?: string;
          phase22_dlq_id?: string | null;
          phase22_retry_id?: string | null;
          provider?: string | null;
          provider_confirmed_at?: string | null;
          provider_reference?: string | null;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communication_delivery_attempts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communication_delivery_attempts_message_company_fk";
            columns: ["message_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "communication_messages";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "communication_delivery_attempts_phase22_dlq_id_fkey";
            columns: ["phase22_dlq_id"];
            isOneToOne: false;
            referencedRelation: "integration_dead_letter_queue";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communication_delivery_attempts_phase22_retry_id_fkey";
            columns: ["phase22_retry_id"];
            isOneToOne: false;
            referencedRelation: "integration_retry_queue";
            referencedColumns: ["id"];
          },
        ];
      };
      communication_messages: {
        Row: {
          attachments: Json;
          body: string;
          channel: string;
          company_id: string;
          created_at: string;
          delivery_state: string;
          direction: string;
          edited_at: string | null;
          id: string;
          mentions: Json;
          parent_id: string | null;
          provider_reference: string | null;
          sender_id: string | null;
          template_version_id: string | null;
          thread_id: string;
          visibility: string;
        };
        Insert: {
          attachments?: Json;
          body: string;
          channel: string;
          company_id: string;
          created_at?: string;
          delivery_state?: string;
          direction?: string;
          edited_at?: string | null;
          id?: string;
          mentions?: Json;
          parent_id?: string | null;
          provider_reference?: string | null;
          sender_id?: string | null;
          template_version_id?: string | null;
          thread_id: string;
          visibility: string;
        };
        Update: {
          attachments?: Json;
          body?: string;
          channel?: string;
          company_id?: string;
          created_at?: string;
          delivery_state?: string;
          direction?: string;
          edited_at?: string | null;
          id?: string;
          mentions?: Json;
          parent_id?: string | null;
          provider_reference?: string | null;
          sender_id?: string | null;
          template_version_id?: string | null;
          thread_id?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communication_messages_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communication_messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "communication_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communication_messages_thread_company_fk";
            columns: ["thread_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "communication_threads";
            referencedColumns: ["id", "company_id"];
          },
        ];
      };
      communication_participants: {
        Row: {
          added_by: string;
          branch_id: string | null;
          can_reply: boolean;
          company_id: string;
          created_at: string;
          external_entity_id: string | null;
          id: string;
          last_read_at: string | null;
          participant_type: string;
          role_name: string | null;
          team_key: string | null;
          thread_id: string;
          user_id: string | null;
        };
        Insert: {
          added_by: string;
          branch_id?: string | null;
          can_reply?: boolean;
          company_id: string;
          created_at?: string;
          external_entity_id?: string | null;
          id?: string;
          last_read_at?: string | null;
          participant_type: string;
          role_name?: string | null;
          team_key?: string | null;
          thread_id: string;
          user_id?: string | null;
        };
        Update: {
          added_by?: string;
          branch_id?: string | null;
          can_reply?: boolean;
          company_id?: string;
          created_at?: string;
          external_entity_id?: string | null;
          id?: string;
          last_read_at?: string | null;
          participant_type?: string;
          role_name?: string | null;
          team_key?: string | null;
          thread_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "communication_participants_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communication_participants_thread_company_fk";
            columns: ["thread_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "communication_threads";
            referencedColumns: ["id", "company_id"];
          },
        ];
      };
      communication_preferences: {
        Row: {
          channel: string;
          company_id: string;
          created_at: string;
          emergency_override_allowed: boolean;
          enabled: boolean;
          id: string;
          language: string;
          marketing_consent: boolean;
          opted_out_at: string | null;
          quiet_hours: Json;
          subject_id: string;
          subject_type: string;
          timezone: string;
          transactional_allowed: boolean;
          updated_at: string;
        };
        Insert: {
          channel: string;
          company_id: string;
          created_at?: string;
          emergency_override_allowed?: boolean;
          enabled?: boolean;
          id?: string;
          language?: string;
          marketing_consent?: boolean;
          opted_out_at?: string | null;
          quiet_hours?: Json;
          subject_id: string;
          subject_type: string;
          timezone?: string;
          transactional_allowed?: boolean;
          updated_at?: string;
        };
        Update: {
          channel?: string;
          company_id?: string;
          created_at?: string;
          emergency_override_allowed?: boolean;
          enabled?: boolean;
          id?: string;
          language?: string;
          marketing_consent?: boolean;
          opted_out_at?: string | null;
          quiet_hours?: Json;
          subject_id?: string;
          subject_type?: string;
          timezone?: string;
          transactional_allowed?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communication_preferences_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      communication_template_versions: {
        Row: {
          approved_at: string | null;
          body: string;
          company_id: string;
          created_at: string;
          id: string;
          language: string;
          reviewer_id: string | null;
          status: string;
          subject: string | null;
          template_id: string;
          variables: Json;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          body: string;
          company_id: string;
          created_at?: string;
          id?: string;
          language?: string;
          reviewer_id?: string | null;
          status?: string;
          subject?: string | null;
          template_id: string;
          variables?: Json;
          version: number;
        };
        Update: {
          approved_at?: string | null;
          body?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          language?: string;
          reviewer_id?: string | null;
          status?: string;
          subject?: string | null;
          template_id?: string;
          variables?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "communication_template_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communication_template_versions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "communication_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      communication_templates: {
        Row: {
          approved_use_cases: Json;
          audience: string;
          channel: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          status: string;
        };
        Insert: {
          approved_use_cases?: Json;
          audience: string;
          channel: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          status?: string;
        };
        Update: {
          approved_use_cases?: Json;
          audience?: string;
          channel?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communication_templates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      communication_threads: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          id: string;
          last_activity_at: string;
          owner_id: string | null;
          priority: string;
          related_entity_id: string | null;
          related_entity_type: string;
          source_id: string | null;
          source_type: string | null;
          status: string;
          subject: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          last_activity_at?: string;
          owner_id?: string | null;
          priority?: string;
          related_entity_id?: string | null;
          related_entity_type: string;
          source_id?: string | null;
          source_type?: string | null;
          status?: string;
          subject: string;
          updated_at?: string;
          visibility: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          last_activity_at?: string;
          owner_id?: string | null;
          priority?: string;
          related_entity_id?: string | null;
          related_entity_type?: string;
          source_id?: string | null;
          source_type?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communication_threads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"];
          country: string | null;
          created_at: string;
          created_by: string | null;
          document_expiry_warning_days: number;
          fleet_size: Database["public"]["Enums"]["fleet_size"] | null;
          id: string;
          name: string;
          terminology: Database["public"]["Enums"]["terminology"];
          updated_at: string;
        };
        Insert: {
          business_type?: Database["public"]["Enums"]["business_type"];
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_expiry_warning_days?: number;
          fleet_size?: Database["public"]["Enums"]["fleet_size"] | null;
          id?: string;
          name: string;
          terminology?: Database["public"]["Enums"]["terminology"];
          updated_at?: string;
        };
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"];
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_expiry_warning_days?: number;
          fleet_size?: Database["public"]["Enums"]["fleet_size"] | null;
          id?: string;
          name?: string;
          terminology?: Database["public"]["Enums"]["terminology"];
          updated_at?: string;
        };
        Relationships: [];
      };
      company_experience_settings: {
        Row: {
          company_id: string;
          industry_pack: string;
          navigation_config: Json;
          terminology: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          industry_pack?: string;
          navigation_config?: Json;
          terminology?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string;
          industry_pack?: string;
          navigation_config?: Json;
          terminology?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_experience_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      company_members: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_audit_findings: {
        Row: {
          audit_id: string;
          company_id: string;
          created_at: string;
          details: string;
          due_date: string | null;
          finding_type: string;
          id: string;
          severity: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          audit_id: string;
          company_id: string;
          created_at?: string;
          details: string;
          due_date?: string | null;
          finding_type: string;
          id?: string;
          severity?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          audit_id?: string;
          company_id?: string;
          created_at?: string;
          details?: string;
          due_date?: string | null;
          finding_type?: string;
          id?: string;
          severity?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_audit_findings_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "compliance_audits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_audit_findings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_audits: {
        Row: {
          audit_type: string;
          authority_name: string | null;
          checklist: Json;
          company_id: string;
          completed_date: string | null;
          created_at: string;
          document_id: string | null;
          evidence_metadata: Json;
          id: string;
          lead_auditor_id: string | null;
          planned_date: string | null;
          scope: string;
          status: Database["public"]["Enums"]["compliance_audit_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          audit_type: string;
          authority_name?: string | null;
          checklist?: Json;
          company_id: string;
          completed_date?: string | null;
          created_at?: string;
          document_id?: string | null;
          evidence_metadata?: Json;
          id?: string;
          lead_auditor_id?: string | null;
          planned_date?: string | null;
          scope: string;
          status?: Database["public"]["Enums"]["compliance_audit_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          audit_type?: string;
          authority_name?: string | null;
          checklist?: Json;
          company_id?: string;
          completed_date?: string | null;
          created_at?: string;
          document_id?: string | null;
          evidence_metadata?: Json;
          id?: string;
          lead_auditor_id?: string | null;
          planned_date?: string | null;
          scope?: string;
          status?: Database["public"]["Enums"]["compliance_audit_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_audits_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_audits_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_capa_actions: {
        Row: {
          audit_finding_id: string | null;
          closed_at: string | null;
          company_id: string;
          corrective_action: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          incident_id: string | null;
          issue: string;
          owner_id: string | null;
          preventive_action: string | null;
          risk_id: string | null;
          root_cause: string | null;
          status: Database["public"]["Enums"]["compliance_capa_status"];
          updated_at: string;
          verification_notes: string | null;
          verified_by: string | null;
        };
        Insert: {
          audit_finding_id?: string | null;
          closed_at?: string | null;
          company_id: string;
          corrective_action?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          incident_id?: string | null;
          issue: string;
          owner_id?: string | null;
          preventive_action?: string | null;
          risk_id?: string | null;
          root_cause?: string | null;
          status?: Database["public"]["Enums"]["compliance_capa_status"];
          updated_at?: string;
          verification_notes?: string | null;
          verified_by?: string | null;
        };
        Update: {
          audit_finding_id?: string | null;
          closed_at?: string | null;
          company_id?: string;
          corrective_action?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          incident_id?: string | null;
          issue?: string;
          owner_id?: string | null;
          preventive_action?: string | null;
          risk_id?: string | null;
          root_cause?: string | null;
          status?: Database["public"]["Enums"]["compliance_capa_status"];
          updated_at?: string;
          verification_notes?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_capa_actions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_capa_actions_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "compliance_incidents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_capa_actions_risk_id_fkey";
            columns: ["risk_id"];
            isOneToOne: false;
            referencedRelation: "compliance_risks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_capa_finding_fk";
            columns: ["audit_finding_id"];
            isOneToOne: false;
            referencedRelation: "compliance_audit_findings";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_documents: {
        Row: {
          company_id: string;
          created_at: string;
          document_id: string | null;
          document_type: string;
          effective_date: string | null;
          id: string;
          metadata: Json;
          owner_id: string | null;
          review_date: string | null;
          status: Database["public"]["Enums"]["compliance_record_status"];
          title: string;
          updated_at: string;
          version_label: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          document_id?: string | null;
          document_type: string;
          effective_date?: string | null;
          id?: string;
          metadata?: Json;
          owner_id?: string | null;
          review_date?: string | null;
          status?: Database["public"]["Enums"]["compliance_record_status"];
          title: string;
          updated_at?: string;
          version_label?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          document_id?: string | null;
          document_type?: string;
          effective_date?: string | null;
          id?: string;
          metadata?: Json;
          owner_id?: string | null;
          review_date?: string | null;
          status?: Database["public"]["Enums"]["compliance_record_status"];
          title?: string;
          updated_at?: string;
          version_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_documents_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_environmental_records: {
        Row: {
          company_id: string;
          created_at: string;
          description: string;
          evidence_metadata: Json;
          id: string;
          occurred_on: string;
          quantity: number | null;
          record_type: string;
          status: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description: string;
          evidence_metadata?: Json;
          id?: string;
          occurred_on?: string;
          quantity?: number | null;
          record_type: string;
          status?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string;
          evidence_metadata?: Json;
          id?: string;
          occurred_on?: string;
          quantity?: number | null;
          record_type?: string;
          status?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_environmental_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_incidents: {
        Row: {
          closed_at: string | null;
          company_id: string;
          corrective_action_summary: string | null;
          created_at: string;
          description: string;
          driver_id: string | null;
          evidence_metadata: Json;
          id: string;
          incident_type: string;
          location: string | null;
          occurred_at: string;
          reporter_id: string | null;
          root_cause: string | null;
          severity: string;
          status: Database["public"]["Enums"]["compliance_incident_status"];
          title: string;
          updated_at: string;
          vehicle_id: string | null;
          verified_by: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          closed_at?: string | null;
          company_id: string;
          corrective_action_summary?: string | null;
          created_at?: string;
          description: string;
          driver_id?: string | null;
          evidence_metadata?: Json;
          id?: string;
          incident_type: string;
          location?: string | null;
          occurred_at?: string;
          reporter_id?: string | null;
          root_cause?: string | null;
          severity?: string;
          status?: Database["public"]["Enums"]["compliance_incident_status"];
          title: string;
          updated_at?: string;
          vehicle_id?: string | null;
          verified_by?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          closed_at?: string | null;
          company_id?: string;
          corrective_action_summary?: string | null;
          created_at?: string;
          description?: string;
          driver_id?: string | null;
          evidence_metadata?: Json;
          id?: string;
          incident_type?: string;
          location?: string | null;
          occurred_at?: string;
          reporter_id?: string | null;
          root_cause?: string | null;
          severity?: string;
          status?: Database["public"]["Enums"]["compliance_incident_status"];
          title?: string;
          updated_at?: string;
          vehicle_id?: string | null;
          verified_by?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_incidents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_incidents_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_incidents_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_insurance_policies: {
        Row: {
          claims_metadata: Json;
          company_id: string;
          coverage_metadata: Json;
          created_at: string;
          document_id: string | null;
          expires_on: string;
          id: string;
          insurance_type: string;
          insurer_name: string;
          policy_number: string;
          renewal_status: string;
          starts_on: string;
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          claims_metadata?: Json;
          company_id: string;
          coverage_metadata?: Json;
          created_at?: string;
          document_id?: string | null;
          expires_on: string;
          id?: string;
          insurance_type: string;
          insurer_name: string;
          policy_number: string;
          renewal_status?: string;
          starts_on: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          claims_metadata?: Json;
          company_id?: string;
          coverage_metadata?: Json;
          created_at?: string;
          document_id?: string | null;
          expires_on?: string;
          id?: string;
          insurance_type?: string;
          insurer_name?: string;
          policy_number?: string;
          renewal_status?: string;
          starts_on?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_insurance_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_insurance_policies_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_insurance_policies_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_permits: {
        Row: {
          authority_name: string | null;
          company_id: string;
          created_at: string;
          document_id: string | null;
          expires_on: string;
          id: string;
          issued_on: string | null;
          metadata: Json;
          permit_number: string;
          permit_type: string;
          renewal_status: string;
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          authority_name?: string | null;
          company_id: string;
          created_at?: string;
          document_id?: string | null;
          expires_on: string;
          id?: string;
          issued_on?: string | null;
          metadata?: Json;
          permit_number: string;
          permit_type: string;
          renewal_status?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          authority_name?: string | null;
          company_id?: string;
          created_at?: string;
          document_id?: string | null;
          expires_on?: string;
          id?: string;
          issued_on?: string | null;
          metadata?: Json;
          permit_number?: string;
          permit_type?: string;
          renewal_status?: string;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_permits_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_permits_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_permits_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_quality_records: {
        Row: {
          company_id: string;
          created_at: string;
          customer_id: string | null;
          details: string | null;
          id: string;
          job_id: string | null;
          record_type: string;
          score: number | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          customer_id?: string | null;
          details?: string | null;
          id?: string;
          job_id?: string | null;
          record_type: string;
          score?: number | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          customer_id?: string | null;
          details?: string | null;
          id?: string;
          job_id?: string | null;
          record_type?: string;
          score?: number | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_quality_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_records: {
        Row: {
          company_id: string;
          created_at: string;
          document_id: string | null;
          driver_id: string | null;
          employee_id: string | null;
          evidence_metadata: Json;
          expires_on: string | null;
          id: string;
          issued_on: string | null;
          notes: string | null;
          record_type: string;
          reference_number: string | null;
          status: Database["public"]["Enums"]["compliance_record_status"];
          subject_type: string;
          updated_at: string;
          vehicle_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          document_id?: string | null;
          driver_id?: string | null;
          employee_id?: string | null;
          evidence_metadata?: Json;
          expires_on?: string | null;
          id?: string;
          issued_on?: string | null;
          notes?: string | null;
          record_type: string;
          reference_number?: string | null;
          status?: Database["public"]["Enums"]["compliance_record_status"];
          subject_type: string;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          document_id?: string | null;
          driver_id?: string | null;
          employee_id?: string | null;
          evidence_metadata?: Json;
          expires_on?: string | null;
          id?: string;
          issued_on?: string | null;
          notes?: string | null;
          record_type?: string;
          reference_number?: string | null;
          status?: Database["public"]["Enums"]["compliance_record_status"];
          subject_type?: string;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_records_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_records_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_records_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_risks: {
        Row: {
          company_id: string;
          created_at: string;
          description: string;
          id: string;
          impact: number;
          likelihood: number;
          linked_entity_id: string | null;
          linked_entity_type: string | null;
          mitigation: string | null;
          owner_id: string | null;
          review_date: string | null;
          risk_type: string;
          status: Database["public"]["Enums"]["compliance_risk_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description: string;
          id?: string;
          impact: number;
          likelihood: number;
          linked_entity_id?: string | null;
          linked_entity_type?: string | null;
          mitigation?: string | null;
          owner_id?: string | null;
          review_date?: string | null;
          risk_type: string;
          status?: Database["public"]["Enums"]["compliance_risk_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          impact?: number;
          likelihood?: number;
          linked_entity_id?: string | null;
          linked_entity_type?: string | null;
          mitigation?: string | null;
          owner_id?: string | null;
          review_date?: string | null;
          risk_type?: string;
          status?: Database["public"]["Enums"]["compliance_risk_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_risks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_safety_inspections: {
        Row: {
          checklist: Json;
          company_id: string;
          corrective_action_summary: string | null;
          created_at: string;
          id: string;
          inspected_at: string;
          inspection_type: string;
          inspector_id: string | null;
          photo_metadata: Json;
          result: string;
          updated_at: string;
          vehicle_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          checklist?: Json;
          company_id: string;
          corrective_action_summary?: string | null;
          created_at?: string;
          id?: string;
          inspected_at?: string;
          inspection_type: string;
          inspector_id?: string | null;
          photo_metadata?: Json;
          result: string;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          checklist?: Json;
          company_id?: string;
          corrective_action_summary?: string | null;
          created_at?: string;
          id?: string;
          inspected_at?: string;
          inspection_type?: string;
          inspector_id?: string | null;
          photo_metadata?: Json;
          result?: string;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_safety_inspections_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compliance_safety_inspections_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_account_addresses: {
        Row: {
          account_id: string;
          address_line_1: string;
          address_line_2: string | null;
          address_type: string;
          city: string | null;
          company_id: string;
          country_code: string | null;
          created_at: string;
          id: string;
          is_primary: boolean;
          label: string;
          postal_code: string | null;
          region: string | null;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          address_line_1: string;
          address_line_2?: string | null;
          address_type: string;
          city?: string | null;
          company_id: string;
          country_code?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          label: string;
          postal_code?: string | null;
          region?: string | null;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          address_line_1?: string;
          address_line_2?: string | null;
          address_type?: string;
          city?: string | null;
          company_id?: string;
          country_code?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          label?: string;
          postal_code?: string | null;
          region?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_account_addresses_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_account_addresses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_account_financials: {
        Row: {
          account_id: string;
          company_id: string;
          created_at: string;
          direct_cost_amount: number;
          id: string;
          invoice_aging_days: number;
          outstanding_balance: number;
          period_end: string;
          period_start: string;
          revenue_amount: number;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          company_id: string;
          created_at?: string;
          direct_cost_amount?: number;
          id?: string;
          invoice_aging_days?: number;
          outstanding_balance?: number;
          period_end: string;
          period_start: string;
          revenue_amount?: number;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          company_id?: string;
          created_at?: string;
          direct_cost_amount?: number;
          id?: string;
          invoice_aging_days?: number;
          outstanding_balance?: number;
          period_end?: string;
          period_start?: string;
          revenue_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_account_financials_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_account_financials_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_accounts: {
        Row: {
          account_manager_id: string | null;
          account_name: string;
          account_status: string;
          account_type: string;
          company_id: string;
          created_at: string;
          credit_status: string;
          customer_id: string | null;
          customer_rating: number | null;
          id: string;
          industry: string | null;
          notes: string | null;
          parent_account_id: string | null;
          preferred_payment_terms: string | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          account_manager_id?: string | null;
          account_name: string;
          account_status?: string;
          account_type: string;
          company_id: string;
          created_at?: string;
          credit_status?: string;
          customer_id?: string | null;
          customer_rating?: number | null;
          id?: string;
          industry?: string | null;
          notes?: string | null;
          parent_account_id?: string | null;
          preferred_payment_terms?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          account_manager_id?: string | null;
          account_name?: string;
          account_status?: string;
          account_type?: string;
          company_id?: string;
          created_at?: string;
          credit_status?: string;
          customer_id?: string | null;
          customer_rating?: number | null;
          id?: string;
          industry?: string | null;
          notes?: string | null;
          parent_account_id?: string | null;
          preferred_payment_terms?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_accounts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_accounts_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_accounts_parent_account_id_fkey";
            columns: ["parent_account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_activities: {
        Row: {
          account_id: string | null;
          activity_type: string;
          body: string | null;
          company_id: string;
          contact_id: string | null;
          created_at: string;
          created_by: string | null;
          direction: string | null;
          external_metadata: Json;
          id: string;
          occurred_at: string;
          opportunity_id: string | null;
          subject: string;
        };
        Insert: {
          account_id?: string | null;
          activity_type: string;
          body?: string | null;
          company_id: string;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction?: string | null;
          external_metadata?: Json;
          id?: string;
          occurred_at?: string;
          opportunity_id?: string | null;
          subject: string;
        };
        Update: {
          account_id?: string | null;
          activity_type?: string;
          body?: string | null;
          company_id?: string;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction?: string | null;
          external_metadata?: Json;
          id?: string;
          occurred_at?: string;
          opportunity_id?: string | null;
          subject?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "crm_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_calendar_events: {
        Row: {
          account_id: string | null;
          attendee_ids: string[];
          company_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          event_type: string;
          id: string;
          opportunity_id: string | null;
          reminder_at: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          attendee_ids?: string[];
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          event_type: string;
          id?: string;
          opportunity_id?: string | null;
          reminder_at?: string | null;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          attendee_ids?: string[];
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          event_type?: string;
          id?: string;
          opportunity_id?: string | null;
          reminder_at?: string | null;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_calendar_events_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_calendar_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_calendar_events_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_cases: {
        Row: {
          account_id: string;
          assigned_to: string | null;
          category: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          escalation_level: number;
          first_response_at: string | null;
          id: string;
          priority: string;
          resolution: string | null;
          resolution_due_at: string | null;
          resolved_at: string | null;
          response_due_at: string | null;
          sla_id: string | null;
          source_request_id: string | null;
          status: Database["public"]["Enums"]["crm_case_status"];
          subject: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          assigned_to?: string | null;
          category: string;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          escalation_level?: number;
          first_response_at?: string | null;
          id?: string;
          priority?: string;
          resolution?: string | null;
          resolution_due_at?: string | null;
          resolved_at?: string | null;
          response_due_at?: string | null;
          sla_id?: string | null;
          source_request_id?: string | null;
          status?: Database["public"]["Enums"]["crm_case_status"];
          subject: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          assigned_to?: string | null;
          category?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          escalation_level?: number;
          first_response_at?: string | null;
          id?: string;
          priority?: string;
          resolution?: string | null;
          resolution_due_at?: string | null;
          resolved_at?: string | null;
          response_due_at?: string | null;
          sla_id?: string | null;
          source_request_id?: string | null;
          status?: Database["public"]["Enums"]["crm_case_status"];
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_cases_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cases_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cases_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cases_sla_id_fkey";
            columns: ["sla_id"];
            isOneToOne: false;
            referencedRelation: "crm_slas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_cases_source_request_id_fkey";
            columns: ["source_request_id"];
            isOneToOne: false;
            referencedRelation: "customer_service_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_contacts: {
        Row: {
          account_id: string;
          address: string | null;
          communication_preferences: Json;
          company_id: string;
          created_at: string;
          department: string | null;
          email: string | null;
          first_name: string;
          id: string;
          is_emergency_contact: boolean;
          is_primary: boolean;
          job_title: string | null;
          last_name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          account_id: string;
          address?: string | null;
          communication_preferences?: Json;
          company_id: string;
          created_at?: string;
          department?: string | null;
          email?: string | null;
          first_name: string;
          id?: string;
          is_emergency_contact?: boolean;
          is_primary?: boolean;
          job_title?: string | null;
          last_name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          account_id?: string;
          address?: string | null;
          communication_preferences?: Json;
          company_id?: string;
          created_at?: string;
          department?: string | null;
          email?: string | null;
          first_name?: string;
          id?: string;
          is_emergency_contact?: boolean;
          is_primary?: boolean;
          job_title?: string | null;
          last_name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_contracts: {
        Row: {
          account_id: string;
          commercial_terms: Json;
          company_id: string;
          contract_number: string;
          contract_type: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          parent_contract_id: string | null;
          renewal_reminder_at: string | null;
          signed_at: string | null;
          source_quote_id: string | null;
          status: Database["public"]["Enums"]["crm_contract_status"];
          termination_reason: string | null;
          updated_at: string;
          version_number: number;
        };
        Insert: {
          account_id: string;
          commercial_terms?: Json;
          company_id: string;
          contract_number: string;
          contract_type: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          parent_contract_id?: string | null;
          renewal_reminder_at?: string | null;
          signed_at?: string | null;
          source_quote_id?: string | null;
          status?: Database["public"]["Enums"]["crm_contract_status"];
          termination_reason?: string | null;
          updated_at?: string;
          version_number?: number;
        };
        Update: {
          account_id?: string;
          commercial_terms?: Json;
          company_id?: string;
          contract_number?: string;
          contract_type?: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          parent_contract_id?: string | null;
          renewal_reminder_at?: string | null;
          signed_at?: string | null;
          source_quote_id?: string | null;
          status?: Database["public"]["Enums"]["crm_contract_status"];
          termination_reason?: string | null;
          updated_at?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contracts_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contracts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contracts_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contracts_parent_contract_id_fkey";
            columns: ["parent_contract_id"];
            isOneToOne: false;
            referencedRelation: "crm_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contracts_source_quote_id_fkey";
            columns: ["source_quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_customer_documents: {
        Row: {
          account_id: string;
          company_id: string;
          contract_id: string | null;
          created_at: string;
          customer_visible: boolean;
          document_name: string;
          document_type: string;
          expires_at: string | null;
          file_metadata: Json;
          id: string;
          storage_object_id: string | null;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          account_id: string;
          company_id: string;
          contract_id?: string | null;
          created_at?: string;
          customer_visible?: boolean;
          document_name: string;
          document_type: string;
          expires_at?: string | null;
          file_metadata?: Json;
          id?: string;
          storage_object_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          account_id?: string;
          company_id?: string;
          contract_id?: string | null;
          created_at?: string;
          customer_visible?: boolean;
          document_name?: string;
          document_type?: string;
          expires_at?: string | null;
          file_metadata?: Json;
          id?: string;
          storage_object_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_customer_documents_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_customer_documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_customer_documents_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "crm_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_customer_documents_storage_object_id_fkey";
            columns: ["storage_object_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_customer_health: {
        Row: {
          account_id: string;
          company_id: string;
          complaint_count: number;
          customer_satisfaction: number | null;
          health_score: number;
          id: string;
          invoice_aging_days: number;
          late_deliveries: number;
          measured_at: string;
          measured_by: string | null;
          open_requests: number;
          recent_deliveries: number;
          recent_incidents: number;
          renewal_likelihood: number | null;
        };
        Insert: {
          account_id: string;
          company_id: string;
          complaint_count?: number;
          customer_satisfaction?: number | null;
          health_score: number;
          id?: string;
          invoice_aging_days?: number;
          late_deliveries?: number;
          measured_at?: string;
          measured_by?: string | null;
          open_requests?: number;
          recent_deliveries?: number;
          recent_incidents?: number;
          renewal_likelihood?: number | null;
        };
        Update: {
          account_id?: string;
          company_id?: string;
          complaint_count?: number;
          customer_satisfaction?: number | null;
          health_score?: number;
          id?: string;
          invoice_aging_days?: number;
          late_deliveries?: number;
          measured_at?: string;
          measured_by?: string | null;
          open_requests?: number;
          recent_deliveries?: number;
          recent_incidents?: number;
          renewal_likelihood?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_customer_health_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_customer_health_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_lead_stage_history: {
        Row: {
          changed_by: string | null;
          company_id: string;
          created_at: string;
          from_stage: Database["public"]["Enums"]["crm_lead_stage"] | null;
          id: string;
          lead_id: string;
          reason: string | null;
          to_stage: Database["public"]["Enums"]["crm_lead_stage"];
        };
        Insert: {
          changed_by?: string | null;
          company_id: string;
          created_at?: string;
          from_stage?: Database["public"]["Enums"]["crm_lead_stage"] | null;
          id?: string;
          lead_id: string;
          reason?: string | null;
          to_stage: Database["public"]["Enums"]["crm_lead_stage"];
        };
        Update: {
          changed_by?: string | null;
          company_id?: string;
          created_at?: string;
          from_stage?: Database["public"]["Enums"]["crm_lead_stage"] | null;
          id?: string;
          lead_id?: string;
          reason?: string | null;
          to_stage?: Database["public"]["Enums"]["crm_lead_stage"];
        };
        Relationships: [
          {
            foreignKeyName: "crm_lead_stage_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_lead_stage_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "crm_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_leads: {
        Row: {
          address: string | null;
          archived_at: string | null;
          assigned_to: string | null;
          company_id: string;
          company_name: string;
          contact_name: string | null;
          converted_account_id: string | null;
          created_at: string;
          email: string | null;
          estimated_monthly_value: number;
          id: string;
          lost_reason: string | null;
          notes: string | null;
          owner_id: string | null;
          phone: string | null;
          source: string;
          stage: Database["public"]["Enums"]["crm_lead_stage"];
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          address?: string | null;
          archived_at?: string | null;
          assigned_to?: string | null;
          company_id: string;
          company_name: string;
          contact_name?: string | null;
          converted_account_id?: string | null;
          created_at?: string;
          email?: string | null;
          estimated_monthly_value?: number;
          id?: string;
          lost_reason?: string | null;
          notes?: string | null;
          owner_id?: string | null;
          phone?: string | null;
          source: string;
          stage?: Database["public"]["Enums"]["crm_lead_stage"];
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          archived_at?: string | null;
          assigned_to?: string | null;
          company_id?: string;
          company_name?: string;
          contact_name?: string | null;
          converted_account_id?: string | null;
          created_at?: string;
          email?: string | null;
          estimated_monthly_value?: number;
          id?: string;
          lost_reason?: string | null;
          notes?: string | null;
          owner_id?: string | null;
          phone?: string | null;
          source?: string;
          stage?: Database["public"]["Enums"]["crm_lead_stage"];
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_leads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_leads_converted_account_id_fkey";
            columns: ["converted_account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_onboarding: {
        Row: {
          account_id: string;
          commercial_setup: Json;
          company_id: string;
          completed_at: string | null;
          contract_id: string | null;
          created_at: string;
          credit_review_status: string;
          id: string;
          lead_id: string | null;
          operations_setup: Json;
          owner_id: string | null;
          portal_invitation_id: string | null;
          quote_id: string | null;
          stage: Database["public"]["Enums"]["crm_onboarding_stage"];
          updated_at: string;
        };
        Insert: {
          account_id: string;
          commercial_setup?: Json;
          company_id: string;
          completed_at?: string | null;
          contract_id?: string | null;
          created_at?: string;
          credit_review_status?: string;
          id?: string;
          lead_id?: string | null;
          operations_setup?: Json;
          owner_id?: string | null;
          portal_invitation_id?: string | null;
          quote_id?: string | null;
          stage?: Database["public"]["Enums"]["crm_onboarding_stage"];
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          commercial_setup?: Json;
          company_id?: string;
          completed_at?: string | null;
          contract_id?: string | null;
          created_at?: string;
          credit_review_status?: string;
          id?: string;
          lead_id?: string | null;
          operations_setup?: Json;
          owner_id?: string | null;
          portal_invitation_id?: string | null;
          quote_id?: string | null;
          stage?: Database["public"]["Enums"]["crm_onboarding_stage"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_onboarding_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_onboarding_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_onboarding_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "crm_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_onboarding_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "crm_leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_onboarding_portal_invitation_id_fkey";
            columns: ["portal_invitation_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_invitations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_onboarding_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_opportunities: {
        Row: {
          account_id: string;
          closed_at: string | null;
          company_id: string;
          competitors: Json;
          created_at: string;
          expected_close_date: string | null;
          expected_value: number;
          id: string;
          lead_id: string | null;
          name: string;
          notes: string | null;
          owner_id: string | null;
          probability: number;
          stage: Database["public"]["Enums"]["crm_opportunity_stage"];
          updated_at: string;
          win_loss_reason: string | null;
        };
        Insert: {
          account_id: string;
          closed_at?: string | null;
          company_id: string;
          competitors?: Json;
          created_at?: string;
          expected_close_date?: string | null;
          expected_value?: number;
          id?: string;
          lead_id?: string | null;
          name: string;
          notes?: string | null;
          owner_id?: string | null;
          probability?: number;
          stage?: Database["public"]["Enums"]["crm_opportunity_stage"];
          updated_at?: string;
          win_loss_reason?: string | null;
        };
        Update: {
          account_id?: string;
          closed_at?: string | null;
          company_id?: string;
          competitors?: Json;
          created_at?: string;
          expected_close_date?: string | null;
          expected_value?: number;
          id?: string;
          lead_id?: string | null;
          name?: string;
          notes?: string | null;
          owner_id?: string | null;
          probability?: number;
          stage?: Database["public"]["Enums"]["crm_opportunity_stage"];
          updated_at?: string;
          win_loss_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_opportunities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "crm_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_opportunity_products: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          opportunity_id: string;
          product_service: string;
          quantity: number;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          opportunity_id: string;
          product_service: string;
          quantity?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          opportunity_id?: string;
          product_service?: string;
          quantity?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_opportunity_products_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_opportunity_products_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_opportunity_stage_history: {
        Row: {
          changed_by: string | null;
          company_id: string;
          created_at: string;
          from_stage: Database["public"]["Enums"]["crm_opportunity_stage"] | null;
          id: string;
          opportunity_id: string;
          probability: number;
          reason: string | null;
          to_stage: Database["public"]["Enums"]["crm_opportunity_stage"];
        };
        Insert: {
          changed_by?: string | null;
          company_id: string;
          created_at?: string;
          from_stage?: Database["public"]["Enums"]["crm_opportunity_stage"] | null;
          id?: string;
          opportunity_id: string;
          probability: number;
          reason?: string | null;
          to_stage: Database["public"]["Enums"]["crm_opportunity_stage"];
        };
        Update: {
          changed_by?: string | null;
          company_id?: string;
          created_at?: string;
          from_stage?: Database["public"]["Enums"]["crm_opportunity_stage"] | null;
          id?: string;
          opportunity_id?: string;
          probability?: number;
          reason?: string | null;
          to_stage?: Database["public"]["Enums"]["crm_opportunity_stage"];
        };
        Relationships: [
          {
            foreignKeyName: "crm_opportunity_stage_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_opportunity_stage_history_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_quote_lines: {
        Row: {
          company_id: string;
          created_at: string;
          description: string;
          discount_amount: number;
          id: string;
          line_total: number;
          line_type: string;
          quantity: number;
          quote_id: string;
          tax_rate: number;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description: string;
          discount_amount?: number;
          id?: string;
          line_total?: number;
          line_type: string;
          quantity?: number;
          quote_id: string;
          tax_rate?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string;
          discount_amount?: number;
          id?: string;
          line_total?: number;
          line_type?: string;
          quantity?: number;
          quote_id?: string;
          tax_rate?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_quote_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_quote_lines_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_quotes: {
        Row: {
          account_id: string;
          approval_required: boolean;
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: string;
          discount_amount: number;
          id: string;
          opportunity_id: string | null;
          parent_quote_id: string | null;
          pdf_metadata: Json;
          quote_number: string;
          quote_type: string;
          status: Database["public"]["Enums"]["crm_quote_status"];
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          updated_at: string;
          valid_from: string;
          valid_until: string;
          version_number: number;
        };
        Insert: {
          account_id: string;
          approval_required?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          discount_amount?: number;
          id?: string;
          opportunity_id?: string | null;
          parent_quote_id?: string | null;
          pdf_metadata?: Json;
          quote_number: string;
          quote_type: string;
          status?: Database["public"]["Enums"]["crm_quote_status"];
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          updated_at?: string;
          valid_from?: string;
          valid_until: string;
          version_number?: number;
        };
        Update: {
          account_id?: string;
          approval_required?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          discount_amount?: number;
          id?: string;
          opportunity_id?: string | null;
          parent_quote_id?: string | null;
          pdf_metadata?: Json;
          quote_number?: string;
          quote_type?: string;
          status?: Database["public"]["Enums"]["crm_quote_status"];
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          updated_at?: string;
          valid_from?: string;
          valid_until?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_quotes_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_quotes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_quotes_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_quotes_parent_quote_id_fkey";
            columns: ["parent_quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_rate_sheets: {
        Row: {
          account_id: string | null;
          company_id: string;
          created_at: string;
          currency_code: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          name: string;
          rate_data: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          company_id: string;
          created_at?: string;
          currency_code?: string;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          name: string;
          rate_data?: Json;
          status?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          company_id?: string;
          created_at?: string;
          currency_code?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          name?: string;
          rate_data?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_rate_sheets_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_rate_sheets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_sla_events: {
        Row: {
          case_id: string;
          company_id: string;
          details: Json;
          event_type: string;
          id: string;
          occurred_at: string;
        };
        Insert: {
          case_id: string;
          company_id: string;
          details?: Json;
          event_type: string;
          id?: string;
          occurred_at?: string;
        };
        Update: {
          case_id?: string;
          company_id?: string;
          details?: Json;
          event_type?: string;
          id?: string;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_sla_events_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "crm_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_sla_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_slas: {
        Row: {
          account_id: string | null;
          active: boolean;
          company_id: string;
          created_at: string;
          escalation_minutes: number | null;
          id: string;
          name: string;
          priority: string;
          resolution_minutes: number;
          response_minutes: number;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          active?: boolean;
          company_id: string;
          created_at?: string;
          escalation_minutes?: number | null;
          id?: string;
          name: string;
          priority: string;
          resolution_minutes: number;
          response_minutes: number;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          active?: boolean;
          company_id?: string;
          created_at?: string;
          escalation_minutes?: number | null;
          id?: string;
          name?: string;
          priority?: string;
          resolution_minutes?: number;
          response_minutes?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_slas_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_slas_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_tasks: {
        Row: {
          account_id: string | null;
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          id: string;
          opportunity_id: string | null;
          priority: string;
          recurrence_rule: string | null;
          recurring_parent_id: string | null;
          status: Database["public"]["Enums"]["crm_task_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          assigned_to?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          opportunity_id?: string | null;
          priority?: string;
          recurrence_rule?: string | null;
          recurring_parent_id?: string | null;
          status?: Database["public"]["Enums"]["crm_task_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          assigned_to?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          opportunity_id?: string | null;
          priority?: string;
          recurrence_rule?: string | null;
          recurring_parent_id?: string | null;
          status?: Database["public"]["Enums"]["crm_task_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tasks_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "crm_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_recurring_parent_id_fkey";
            columns: ["recurring_parent_id"];
            isOneToOne: false;
            referencedRelation: "crm_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_acknowledgements: {
        Row: {
          acknowledgement_type: string;
          company_id: string;
          created_at: string;
          customer_id: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          job_id: string | null;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          acknowledgement_type: string;
          company_id: string;
          created_at?: string;
          customer_id: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          job_id?: string | null;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          acknowledgement_type?: string;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          job_id?: string | null;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_acknowledgements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_acknowledgements_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_acknowledgements_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_document_links: {
        Row: {
          company_id: string;
          created_at: string;
          customer_id: string;
          document_id: string;
          job_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          customer_id: string;
          document_id: string;
          job_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          document_id?: string;
          job_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_document_links_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_document_links_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_document_links_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: true;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_document_links_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_api_keys: {
        Row: {
          branch_id: string | null;
          company_id: string;
          created_at: string;
          created_by: string;
          customer_id: string;
          id: string;
          key_prefix: string;
          key_type: string;
          last_used_at: string | null;
          name: string;
          revoked_at: string | null;
          rotated_at: string | null;
          scopes: Json;
          token_hash: string;
          usage_count: number;
        };
        Insert: {
          branch_id?: string | null;
          company_id: string;
          created_at?: string;
          created_by: string;
          customer_id: string;
          id?: string;
          key_prefix: string;
          key_type: string;
          last_used_at?: string | null;
          name: string;
          revoked_at?: string | null;
          rotated_at?: string | null;
          scopes?: Json;
          token_hash: string;
          usage_count?: number;
        };
        Update: {
          branch_id?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          id?: string;
          key_prefix?: string;
          key_type?: string;
          last_used_at?: string | null;
          name?: string;
          revoked_at?: string | null;
          rotated_at?: string | null;
          scopes?: Json;
          token_hash?: string;
          usage_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_api_keys_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_api_keys_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_api_keys_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_audit_logs: {
        Row: {
          company_id: string;
          created_at: string;
          customer_id: string | null;
          detail: string | null;
          entity_id: string | null;
          entity_type: string | null;
          event_type: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          customer_id?: string | null;
          detail?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          customer_id?: string | null;
          detail?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_audit_logs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_booking_requests: {
        Row: {
          branch_id: string | null;
          cancelled_at: string | null;
          cargo_summary: string;
          company_id: string;
          created_at: string;
          created_by: string;
          customer_id: string;
          customer_reference: string | null;
          delivery_summary: string;
          id: string;
          pickup_summary: string;
          request_type: string;
          requested_date: string | null;
          source_quote_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          cancelled_at?: string | null;
          cargo_summary: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          customer_id: string;
          customer_reference?: string | null;
          delivery_summary: string;
          id?: string;
          pickup_summary: string;
          request_type: string;
          requested_date?: string | null;
          source_quote_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          cancelled_at?: string | null;
          cargo_summary?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          customer_reference?: string | null;
          delivery_summary?: string;
          id?: string;
          pickup_summary?: string;
          request_type?: string;
          requested_date?: string | null;
          source_quote_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_booking_requests_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_booking_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_booking_requests_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_booking_requests_source_quote_id_fkey";
            columns: ["source_quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_branches: {
        Row: {
          active: boolean;
          branch_code: string;
          branch_type: string;
          company_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          name: string;
          parent_branch_id: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          branch_code: string;
          branch_type?: string;
          company_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          name: string;
          parent_branch_id?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          branch_code?: string;
          branch_type?: string;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          name?: string;
          parent_branch_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_branches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_branches_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_branches_parent_branch_id_fkey";
            columns: ["parent_branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_conversations: {
        Row: {
          assigned_department: string | null;
          branch_id: string | null;
          category: string;
          company_id: string;
          created_at: string;
          created_by: string;
          customer_id: string;
          id: string;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          assigned_department?: string | null;
          branch_id?: string | null;
          category: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          customer_id: string;
          id?: string;
          status?: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          assigned_department?: string | null;
          branch_id?: string | null;
          category?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          id?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_conversations_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_conversations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_conversations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_financial_documents: {
        Row: {
          amount: number | null;
          branch_id: string | null;
          company_id: string;
          created_at: string;
          currency: string;
          customer_id: string;
          document_id: string | null;
          document_type: string;
          due_date: string | null;
          id: string;
          issued_at: string | null;
          payment_reference: string | null;
          reference: string;
          status: string;
        };
        Insert: {
          amount?: number | null;
          branch_id?: string | null;
          company_id: string;
          created_at?: string;
          currency?: string;
          customer_id: string;
          document_id?: string | null;
          document_type: string;
          due_date?: string | null;
          id?: string;
          issued_at?: string | null;
          payment_reference?: string | null;
          reference: string;
          status: string;
        };
        Update: {
          amount?: number | null;
          branch_id?: string | null;
          company_id?: string;
          created_at?: string;
          currency?: string;
          customer_id?: string;
          document_id?: string | null;
          document_type?: string;
          due_date?: string | null;
          id?: string;
          issued_at?: string | null;
          payment_reference?: string | null;
          reference?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_financial_documents_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_financial_documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_financial_documents_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_financial_documents_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_invitations: {
        Row: {
          accepted_at: string | null;
          company_id: string;
          created_at: string;
          customer_id: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          invited_email: string;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["customer_portal_role"];
          status: Database["public"]["Enums"]["customer_portal_invitation_status"];
          token_hash: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          company_id: string;
          created_at?: string;
          customer_id: string;
          expires_at: string;
          id?: string;
          invited_by?: string | null;
          invited_email: string;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["customer_portal_role"];
          status?: Database["public"]["Enums"]["customer_portal_invitation_status"];
          token_hash: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          invited_email?: string;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["customer_portal_role"];
          status?: Database["public"]["Enums"]["customer_portal_invitation_status"];
          token_hash?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_invitations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_invitations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_membership_branches: {
        Row: {
          branch_id: string;
          can_view_all_branches: boolean;
          company_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          membership_id: string;
        };
        Insert: {
          branch_id: string;
          can_view_all_branches?: boolean;
          company_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          membership_id: string;
        };
        Update: {
          branch_id?: string;
          can_view_all_branches?: boolean;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          membership_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_membership_branches_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_membership_branches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_membership_branches_customer_id_branch_id_fkey";
            columns: ["customer_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["customer_id", "id"];
          },
          {
            foreignKeyName: "customer_portal_membership_branches_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_membership_branches_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_memberships: {
        Row: {
          accepted_at: string | null;
          company_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["customer_portal_role"];
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          company_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["customer_portal_role"];
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["customer_portal_role"];
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_memberships_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_memberships_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_messages: {
        Row: {
          attachment_document_id: string | null;
          body: string;
          company_id: string;
          conversation_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          read_at: string | null;
          sender_type: string;
          sender_user_id: string | null;
        };
        Insert: {
          attachment_document_id?: string | null;
          body: string;
          company_id: string;
          conversation_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          read_at?: string | null;
          sender_type: string;
          sender_user_id?: string | null;
        };
        Update: {
          attachment_document_id?: string | null;
          body?: string;
          company_id?: string;
          conversation_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          read_at?: string | null;
          sender_type?: string;
          sender_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_messages_attachment_document_id_fkey";
            columns: ["attachment_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_messages_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_messages_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_notifications: {
        Row: {
          body: string;
          branch_id: string | null;
          company_id: string;
          created_at: string;
          customer_id: string;
          delivery_channels: Json;
          delivery_state: Json;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          notification_type: string;
          read_at: string | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          branch_id?: string | null;
          company_id: string;
          created_at?: string;
          customer_id: string;
          delivery_channels?: Json;
          delivery_state?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          notification_type: string;
          read_at?: string | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          branch_id?: string | null;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          delivery_channels?: Json;
          delivery_state?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          notification_type?: string;
          read_at?: string | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_notifications_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_notifications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_notifications_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_preferences: {
        Row: {
          company_id: string;
          created_at: string;
          customer_id: string;
          delay_updates: boolean;
          delivery_updates: boolean;
          email_notifications: boolean | null;
          id: string;
          proof_updates: boolean;
          shipment_updates: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          customer_id: string;
          delay_updates?: boolean;
          delivery_updates?: boolean;
          email_notifications?: boolean | null;
          id?: string;
          proof_updates?: boolean;
          shipment_updates?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          delay_updates?: boolean;
          delivery_updates?: boolean;
          email_notifications?: boolean | null;
          id?: string;
          proof_updates?: boolean;
          shipment_updates?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_preferences_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_preferences_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_profiles: {
        Row: {
          billing_contacts: Json;
          company_id: string;
          customer_id: string;
          delivery_addresses: Json;
          language: string;
          logo_path: string | null;
          primary_colour: string | null;
          reference_numbers: Json;
          support_contacts: Json;
          timezone: string;
          updated_at: string;
          welcome_message: string | null;
        };
        Insert: {
          billing_contacts?: Json;
          company_id: string;
          customer_id: string;
          delivery_addresses?: Json;
          language?: string;
          logo_path?: string | null;
          primary_colour?: string | null;
          reference_numbers?: Json;
          support_contacts?: Json;
          timezone?: string;
          updated_at?: string;
          welcome_message?: string | null;
        };
        Update: {
          billing_contacts?: Json;
          company_id?: string;
          customer_id?: string;
          delivery_addresses?: Json;
          language?: string;
          logo_path?: string | null;
          primary_colour?: string | null;
          reference_numbers?: Json;
          support_contacts?: Json;
          timezone?: string;
          updated_at?: string;
          welcome_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_profiles_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: true;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_security_events: {
        Row: {
          company_id: string;
          customer_id: string;
          device_label: string | null;
          event_type: string;
          id: string;
          ip_metadata: Json;
          occurred_at: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          customer_id: string;
          device_label?: string | null;
          event_type: string;
          id?: string;
          ip_metadata?: Json;
          occurred_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          customer_id?: string;
          device_label?: string | null;
          event_type?: string;
          id?: string;
          ip_metadata?: Json;
          occurred_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_security_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_security_events_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_portal_zip_queries: {
        Row: {
          citations: Json;
          company_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          outcome: string;
          question_redacted: string;
          response_redacted: string;
          user_id: string;
        };
        Insert: {
          citations?: Json;
          company_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          outcome: string;
          question_redacted: string;
          response_redacted: string;
          user_id: string;
        };
        Update: {
          citations?: Json;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          outcome?: string;
          question_redacted?: string;
          response_redacted?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_portal_zip_queries_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_portal_zip_queries_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_service_requests: {
        Row: {
          assigned_department: string | null;
          assigned_to: string | null;
          category: string;
          company_id: string;
          created_at: string;
          created_by_user_id: string;
          customer_id: string;
          customer_visible_response: string | null;
          id: string;
          internal_notes: string | null;
          job_id: string | null;
          message: string | null;
          priority: Database["public"]["Enums"]["customer_service_request_priority"];
          resolved_at: string | null;
          status: Database["public"]["Enums"]["customer_service_request_status"];
          subject: string;
          updated_at: string;
        };
        Insert: {
          assigned_department?: string | null;
          assigned_to?: string | null;
          category: string;
          company_id: string;
          created_at?: string;
          created_by_user_id: string;
          customer_id: string;
          customer_visible_response?: string | null;
          id?: string;
          internal_notes?: string | null;
          job_id?: string | null;
          message?: string | null;
          priority?: Database["public"]["Enums"]["customer_service_request_priority"];
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["customer_service_request_status"];
          subject: string;
          updated_at?: string;
        };
        Update: {
          assigned_department?: string | null;
          assigned_to?: string | null;
          category?: string;
          company_id?: string;
          created_at?: string;
          created_by_user_id?: string;
          customer_id?: string;
          customer_visible_response?: string | null;
          id?: string;
          internal_notes?: string | null;
          job_id?: string | null;
          message?: string | null;
          priority?: Database["public"]["Enums"]["customer_service_request_priority"];
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["customer_service_request_status"];
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_service_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_service_requests_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_service_requests_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_shipment_locations: {
        Row: {
          company_id: string;
          customer_id: string;
          job_id: string;
          latitude: number;
          longitude: number;
          recorded_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          customer_id: string;
          job_id: string;
          latitude: number;
          longitude: number;
          recorded_at: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          customer_id?: string;
          job_id?: string;
          latitude?: number;
          longitude?: number;
          recorded_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_shipment_locations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_shipment_locations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_shipment_locations_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_shipment_settings: {
        Row: {
          company_id: string;
          customer_id: string;
          job_id: string;
          tracking_visibility: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          customer_id: string;
          job_id: string;
          tracking_visibility?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          customer_id?: string;
          job_id?: string;
          tracking_visibility?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_shipment_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_shipment_settings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_shipment_settings_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          company_id: string;
          contact_person: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          company_id: string;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          company_id?: string;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      device_bus_events: {
        Row: {
          company_id: string;
          created_at: string;
          device_id: string;
          event_type: string;
          fmi: number | null;
          id: string;
          metadata: Json;
          observed_at: string;
          received_at: string;
          severity: string;
          simulated: boolean;
          source: string;
          spn: number | null;
          tracking_session_id: string | null;
          unit: string | null;
          value: number | null;
          vehicle_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          device_id: string;
          event_type: string;
          fmi?: number | null;
          id?: string;
          metadata?: Json;
          observed_at: string;
          received_at?: string;
          severity?: string;
          simulated?: boolean;
          source: string;
          spn?: number | null;
          tracking_session_id?: string | null;
          unit?: string | null;
          value?: number | null;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          device_id?: string;
          event_type?: string;
          fmi?: number | null;
          id?: string;
          metadata?: Json;
          observed_at?: string;
          received_at?: string;
          severity?: string;
          simulated?: boolean;
          source?: string;
          spn?: number | null;
          tracking_session_id?: string | null;
          unit?: string | null;
          value?: number | null;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "device_bus_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_bus_events_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_bus_events_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_bus_events_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      device_command_audit: {
        Row: {
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id: string | null;
          command_type: string;
          company_id: string;
          completed_at: string | null;
          device_id: string;
          id: string;
          idempotency_key: string;
          request_payload: Json;
          requested_at: string;
          result_payload: Json;
          result_status: Database["public"]["Enums"]["device_command_status"];
          simulated: boolean;
        };
        Insert: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          command_type: string;
          company_id: string;
          completed_at?: string | null;
          device_id: string;
          id?: string;
          idempotency_key: string;
          request_payload?: Json;
          requested_at?: string;
          result_payload?: Json;
          result_status?: Database["public"]["Enums"]["device_command_status"];
          simulated?: boolean;
        };
        Update: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          command_type?: string;
          company_id?: string;
          completed_at?: string | null;
          device_id?: string;
          id?: string;
          idempotency_key?: string;
          request_payload?: Json;
          requested_at?: string;
          result_payload?: Json;
          result_status?: Database["public"]["Enums"]["device_command_status"];
          simulated?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "device_command_audit_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_command_audit_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      device_firmware_versions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          channel: string;
          checksum_metadata: Json;
          company_id: string;
          created_at: string;
          hardware_model: string;
          hardware_model_normalized: string | null;
          id: string;
          metadata: Json;
          minimum_bootloader: string | null;
          minimum_hardware_revision: string | null;
          release_notes: string | null;
          status: Database["public"]["Enums"]["firmware_release_status"];
          updated_at: string;
          version: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          channel: string;
          checksum_metadata?: Json;
          company_id: string;
          created_at?: string;
          hardware_model: string;
          hardware_model_normalized?: string | null;
          id?: string;
          metadata?: Json;
          minimum_bootloader?: string | null;
          minimum_hardware_revision?: string | null;
          release_notes?: string | null;
          status?: Database["public"]["Enums"]["firmware_release_status"];
          updated_at?: string;
          version: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          channel?: string;
          checksum_metadata?: Json;
          company_id?: string;
          created_at?: string;
          hardware_model?: string;
          hardware_model_normalized?: string | null;
          id?: string;
          metadata?: Json;
          minimum_bootloader?: string | null;
          minimum_hardware_revision?: string | null;
          release_notes?: string | null;
          status?: Database["public"]["Enums"]["firmware_release_status"];
          updated_at?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_firmware_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      device_fitment_jobs: {
        Row: {
          approved_at: string | null;
          blocked_reason: string | null;
          cancelled_at: string | null;
          checklist_template_id: string | null;
          checklist_template_version: number;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          device_id: string;
          id: string;
          installation_location: string | null;
          metadata: Json;
          notes: string | null;
          odometer_at_fitment: number | null;
          override_reason: string | null;
          reference: string;
          rejected_at: string | null;
          scheduled_at: string | null;
          sim_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["fitment_job_status"];
          submitted_at: string | null;
          supervisor_review_notes: string | null;
          supervisor_user_id: string | null;
          technician_user_id: string | null;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          approved_at?: string | null;
          blocked_reason?: string | null;
          cancelled_at?: string | null;
          checklist_template_id?: string | null;
          checklist_template_version?: number;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          device_id: string;
          id?: string;
          installation_location?: string | null;
          metadata?: Json;
          notes?: string | null;
          odometer_at_fitment?: number | null;
          override_reason?: string | null;
          reference: string;
          rejected_at?: string | null;
          scheduled_at?: string | null;
          sim_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["fitment_job_status"];
          submitted_at?: string | null;
          supervisor_review_notes?: string | null;
          supervisor_user_id?: string | null;
          technician_user_id?: string | null;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          approved_at?: string | null;
          blocked_reason?: string | null;
          cancelled_at?: string | null;
          checklist_template_id?: string | null;
          checklist_template_version?: number;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          device_id?: string;
          id?: string;
          installation_location?: string | null;
          metadata?: Json;
          notes?: string | null;
          odometer_at_fitment?: number | null;
          override_reason?: string | null;
          reference?: string;
          rejected_at?: string | null;
          scheduled_at?: string | null;
          sim_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["fitment_job_status"];
          submitted_at?: string | null;
          supervisor_review_notes?: string | null;
          supervisor_user_id?: string | null;
          technician_user_id?: string | null;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_fitment_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_fitment_jobs_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_fitment_jobs_sim_id_fkey";
            columns: ["sim_id"];
            isOneToOne: false;
            referencedRelation: "device_sims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_fitment_jobs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      device_sensor_events: {
        Row: {
          company_id: string;
          created_at: string;
          device_id: string;
          id: string;
          metadata: Json;
          observed_at: string;
          received_at: string;
          sensor_type: string;
          severity: string;
          simulated: boolean;
          tracking_session_id: string | null;
          unit: string | null;
          value: Json;
          vehicle_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          device_id: string;
          id?: string;
          metadata?: Json;
          observed_at: string;
          received_at?: string;
          sensor_type: string;
          severity?: string;
          simulated?: boolean;
          tracking_session_id?: string | null;
          unit?: string | null;
          value?: Json;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          device_id?: string;
          id?: string;
          metadata?: Json;
          observed_at?: string;
          received_at?: string;
          sensor_type?: string;
          severity?: string;
          simulated?: boolean;
          tracking_session_id?: string | null;
          unit?: string | null;
          value?: Json;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "device_sensor_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_sensor_events_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_sensor_events_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_sensor_events_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      device_sims: {
        Row: {
          activated_at: string | null;
          apn: string | null;
          assigned_at: string | null;
          assigned_by: string | null;
          assigned_device_id: string | null;
          company_id: string;
          country_code: string | null;
          created_at: string;
          deactivated_at: string | null;
          iccid: string;
          iccid_normalized: string | null;
          id: string;
          inventory_state: Database["public"]["Enums"]["field_inventory_state"];
          issued_to_user_id: string | null;
          last_network_seen_at: string | null;
          metadata: Json;
          msisdn: string | null;
          msisdn_normalized: string | null;
          primary_sim: boolean;
          provider: string | null;
          reserved_for_fitment_job_id: string | null;
          status: Database["public"]["Enums"]["device_sim_status"];
          unassigned_at: string | null;
          unassigned_by: string | null;
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          apn?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          assigned_device_id?: string | null;
          company_id: string;
          country_code?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          iccid: string;
          iccid_normalized?: string | null;
          id?: string;
          inventory_state?: Database["public"]["Enums"]["field_inventory_state"];
          issued_to_user_id?: string | null;
          last_network_seen_at?: string | null;
          metadata?: Json;
          msisdn?: string | null;
          msisdn_normalized?: string | null;
          primary_sim?: boolean;
          provider?: string | null;
          reserved_for_fitment_job_id?: string | null;
          status?: Database["public"]["Enums"]["device_sim_status"];
          unassigned_at?: string | null;
          unassigned_by?: string | null;
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          apn?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          assigned_device_id?: string | null;
          company_id?: string;
          country_code?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          iccid?: string;
          iccid_normalized?: string | null;
          id?: string;
          inventory_state?: Database["public"]["Enums"]["field_inventory_state"];
          issued_to_user_id?: string | null;
          last_network_seen_at?: string | null;
          metadata?: Json;
          msisdn?: string | null;
          msisdn_normalized?: string | null;
          primary_sim?: boolean;
          provider?: string | null;
          reserved_for_fitment_job_id?: string | null;
          status?: Database["public"]["Enums"]["device_sim_status"];
          unassigned_at?: string | null;
          unassigned_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_sims_assigned_device_id_fkey";
            columns: ["assigned_device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_sims_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      device_vehicle_assignments: {
        Row: {
          assigned_at: string | null;
          assigned_by: string | null;
          assignment_type: Database["public"]["Enums"]["device_assignment_type"];
          company_id: string;
          created_at: string;
          device_id: string;
          id: string;
          reason: string | null;
          simulated: boolean;
          status: Database["public"]["Enums"]["device_assignment_status"];
          unassigned_at: string | null;
          unassigned_by: string | null;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          assigned_at?: string | null;
          assigned_by?: string | null;
          assignment_type: Database["public"]["Enums"]["device_assignment_type"];
          company_id: string;
          created_at?: string;
          device_id: string;
          id?: string;
          reason?: string | null;
          simulated?: boolean;
          status?: Database["public"]["Enums"]["device_assignment_status"];
          unassigned_at?: string | null;
          unassigned_by?: string | null;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          assigned_at?: string | null;
          assigned_by?: string | null;
          assignment_type?: Database["public"]["Enums"]["device_assignment_type"];
          company_id?: string;
          created_at?: string;
          device_id?: string;
          id?: string;
          reason?: string | null;
          simulated?: boolean;
          status?: Database["public"]["Enums"]["device_assignment_status"];
          unassigned_at?: string | null;
          unassigned_by?: string | null;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_vehicle_assignments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_vehicle_assignments_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "device_vehicle_assignments_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      devices: {
        Row: {
          activated_at: string | null;
          bootloader_version: string | null;
          company_id: string;
          created_at: string;
          deactivated_at: string | null;
          device_type: Database["public"]["Enums"]["device_type"];
          firmware_version: string | null;
          hardware_model: string;
          hardware_model_normalized: string | null;
          hardware_revision: string | null;
          hardware_revision_normalized: string | null;
          id: string;
          imei: string | null;
          imei_normalized: string | null;
          installation_id: string | null;
          installation_id_normalized: string | null;
          inventory_state: Database["public"]["Enums"]["field_inventory_state"];
          issued_to_user_id: string | null;
          last_seen_at: string | null;
          metadata: Json;
          provisioned_at: string | null;
          provisioned_by: string | null;
          provisioning_state: string;
          reserved_for_fitment_job_id: string | null;
          serial_number: string;
          serial_number_normalized: string | null;
          simulated: boolean;
          simulation_label: string | null;
          status: Database["public"]["Enums"]["device_status"];
          telemetry_source: Database["public"]["Enums"]["telemetry_source"];
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          bootloader_version?: string | null;
          company_id: string;
          created_at?: string;
          deactivated_at?: string | null;
          device_type: Database["public"]["Enums"]["device_type"];
          firmware_version?: string | null;
          hardware_model: string;
          hardware_model_normalized?: string | null;
          hardware_revision?: string | null;
          hardware_revision_normalized?: string | null;
          id?: string;
          imei?: string | null;
          imei_normalized?: string | null;
          installation_id?: string | null;
          installation_id_normalized?: string | null;
          inventory_state?: Database["public"]["Enums"]["field_inventory_state"];
          issued_to_user_id?: string | null;
          last_seen_at?: string | null;
          metadata?: Json;
          provisioned_at?: string | null;
          provisioned_by?: string | null;
          provisioning_state?: string;
          reserved_for_fitment_job_id?: string | null;
          serial_number: string;
          serial_number_normalized?: string | null;
          simulated?: boolean;
          simulation_label?: string | null;
          status?: Database["public"]["Enums"]["device_status"];
          telemetry_source?: Database["public"]["Enums"]["telemetry_source"];
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          bootloader_version?: string | null;
          company_id?: string;
          created_at?: string;
          deactivated_at?: string | null;
          device_type?: Database["public"]["Enums"]["device_type"];
          firmware_version?: string | null;
          hardware_model?: string;
          hardware_model_normalized?: string | null;
          hardware_revision?: string | null;
          hardware_revision_normalized?: string | null;
          id?: string;
          imei?: string | null;
          imei_normalized?: string | null;
          installation_id?: string | null;
          installation_id_normalized?: string | null;
          inventory_state?: Database["public"]["Enums"]["field_inventory_state"];
          issued_to_user_id?: string | null;
          last_seen_at?: string | null;
          metadata?: Json;
          provisioned_at?: string | null;
          provisioned_by?: string | null;
          provisioning_state?: string;
          reserved_for_fitment_job_id?: string | null;
          serial_number?: string;
          serial_number_normalized?: string | null;
          simulated?: boolean;
          simulation_label?: string | null;
          status?: Database["public"]["Enums"]["device_status"];
          telemetry_source?: Database["public"]["Enums"]["telemetry_source"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "devices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      dispatcher_audit_log: {
        Row: {
          action: string;
          actor_user_id: string;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          job_id: string | null;
          metadata: Json;
          occurred_at: string;
          tracking_session_id: string | null;
        };
        Insert: {
          action: string;
          actor_user_id: string;
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          job_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          tracking_session_id?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string;
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          job_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          tracking_session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dispatcher_audit_log_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispatcher_audit_log_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispatcher_audit_log_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          company_id: string;
          created_at: string;
          document_type: string;
          expiry_date: string | null;
          file_url: string | null;
          id: string;
          issue_date: string | null;
          name: string;
          notes: string | null;
          owner_id: string;
          owner_type: Database["public"]["Enums"]["document_owner_type"];
          updated_at: string;
          uploaded_by: string | null;
          visibility: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          document_type: string;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: string;
          issue_date?: string | null;
          name: string;
          notes?: string | null;
          owner_id: string;
          owner_type: Database["public"]["Enums"]["document_owner_type"];
          updated_at?: string;
          uploaded_by?: string | null;
          visibility?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          document_type?: string;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: string;
          issue_date?: string | null;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          owner_type?: Database["public"]["Enums"]["document_owner_type"];
          updated_at?: string;
          uploaded_by?: string | null;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_app_devices: {
        Row: {
          app_version: string | null;
          company_id: string;
          created_at: string;
          device_id: string;
          driver_id: string;
          id: string;
          last_seen_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          app_version?: string | null;
          company_id: string;
          created_at?: string;
          device_id: string;
          driver_id: string;
          id?: string;
          last_seen_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          app_version?: string | null;
          company_id?: string;
          created_at?: string;
          device_id?: string;
          driver_id?: string;
          id?: string;
          last_seen_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_app_devices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_app_devices_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_app_health: {
        Row: {
          app_version: string | null;
          battery_percent: number | null;
          captured_at: string;
          company_id: string;
          device_id: string | null;
          driver_id: string;
          gps_state: string | null;
          id: string;
          network_state: string | null;
          queue_size: number;
          route_pack_version: number | null;
          storage_available_bytes: number | null;
        };
        Insert: {
          app_version?: string | null;
          battery_percent?: number | null;
          captured_at?: string;
          company_id: string;
          device_id?: string | null;
          driver_id: string;
          gps_state?: string | null;
          id?: string;
          network_state?: string | null;
          queue_size?: number;
          route_pack_version?: number | null;
          storage_available_bytes?: number | null;
        };
        Update: {
          app_version?: string | null;
          battery_percent?: number | null;
          captured_at?: string;
          company_id?: string;
          device_id?: string | null;
          driver_id?: string;
          gps_state?: string | null;
          id?: string;
          network_state?: string | null;
          queue_size?: number;
          route_pack_version?: number | null;
          storage_available_bytes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_app_health_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_app_health_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "driver_app_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_app_health_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          driver_id: string | null;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          driver_id?: string | null;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          driver_id?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "driver_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_audit_logs_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_emergency_events: {
        Row: {
          accuracy_metres: number | null;
          company_id: string;
          created_at: string;
          driver_id: string;
          id: string;
          kind: string;
          last_known_at: string | null;
          latitude: number | null;
          longitude: number | null;
          metadata: Json;
          provider_confirmation: string | null;
          severity: string;
          trip_id: string | null;
        };
        Insert: {
          accuracy_metres?: number | null;
          company_id: string;
          created_at?: string;
          driver_id: string;
          id?: string;
          kind: string;
          last_known_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          provider_confirmation?: string | null;
          severity?: string;
          trip_id?: string | null;
        };
        Update: {
          accuracy_metres?: number | null;
          company_id?: string;
          created_at?: string;
          driver_id?: string;
          id?: string;
          kind?: string;
          last_known_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          provider_confirmation?: string | null;
          severity?: string;
          trip_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_emergency_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_emergency_events_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_issue_reports: {
        Row: {
          captured_at: string;
          company_id: string;
          customer_impact: boolean;
          description: string | null;
          driver_id: string;
          id: string;
          issue_type: string;
          job_id: string | null;
          latitude: number | null;
          longitude: number | null;
          metadata: Json;
          severity: string;
          sync_state: string;
          trip_id: string | null;
        };
        Insert: {
          captured_at?: string;
          company_id: string;
          customer_impact?: boolean;
          description?: string | null;
          driver_id: string;
          id?: string;
          issue_type: string;
          job_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          severity?: string;
          sync_state?: string;
          trip_id?: string | null;
        };
        Update: {
          captured_at?: string;
          company_id?: string;
          customer_impact?: boolean;
          description?: string | null;
          driver_id?: string;
          id?: string;
          issue_type?: string;
          job_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          severity?: string;
          sync_state?: string;
          trip_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_issue_reports_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_issue_reports_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_navigation_instructions: {
        Row: {
          bearing: number | null;
          company_id: string;
          confidence: number | null;
          distance_metres: number | null;
          id: string;
          instruction_type: string;
          latitude: number | null;
          longitude: number | null;
          metadata: Json;
          provider_version: string | null;
          road_name: string | null;
          route_pack_version_id: string;
          sequence: number;
          source_provider: string | null;
          spoken_text: string | null;
        };
        Insert: {
          bearing?: number | null;
          company_id: string;
          confidence?: number | null;
          distance_metres?: number | null;
          id?: string;
          instruction_type: string;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          provider_version?: string | null;
          road_name?: string | null;
          route_pack_version_id: string;
          sequence: number;
          source_provider?: string | null;
          spoken_text?: string | null;
        };
        Update: {
          bearing?: number | null;
          company_id?: string;
          confidence?: number | null;
          distance_metres?: number | null;
          id?: string;
          instruction_type?: string;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          provider_version?: string | null;
          road_name?: string | null;
          route_pack_version_id?: string;
          sequence?: number;
          source_provider?: string | null;
          spoken_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_navigation_instructions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_navigation_instructions_route_pack_version_id_fkey";
            columns: ["route_pack_version_id"];
            isOneToOne: false;
            referencedRelation: "driver_route_pack_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_navigation_sessions: {
        Row: {
          company_id: string;
          driver_id: string;
          ended_at: string | null;
          gps_state: string;
          id: string;
          last_known_at: string | null;
          last_known_lat: number | null;
          last_known_lng: number | null;
          metadata: Json;
          route_pack_version_id: string | null;
          started_at: string;
          state: string;
          trip_id: string | null;
        };
        Insert: {
          company_id: string;
          driver_id: string;
          ended_at?: string | null;
          gps_state?: string;
          id?: string;
          last_known_at?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          metadata?: Json;
          route_pack_version_id?: string | null;
          started_at?: string;
          state?: string;
          trip_id?: string | null;
        };
        Update: {
          company_id?: string;
          driver_id?: string;
          ended_at?: string | null;
          gps_state?: string;
          id?: string;
          last_known_at?: string | null;
          last_known_lat?: number | null;
          last_known_lng?: number | null;
          metadata?: Json;
          route_pack_version_id?: string | null;
          started_at?: string;
          state?: string;
          trip_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_navigation_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_navigation_sessions_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_offline_queue_items: {
        Row: {
          acknowledged_at: string | null;
          attempt: number;
          checksum: string;
          claim_expires_at: string | null;
          claimed_at: string | null;
          company_id: string;
          created_at: string;
          dependency_id: string | null;
          device_id: string | null;
          driver_id: string;
          entity: string;
          entity_id: string;
          id: string;
          idempotency_key: string | null;
          last_error: string | null;
          next_retry_at: string | null;
          operation: string;
          payload: Json;
          priority: string;
          session_id: string | null;
          state: string;
          updated_at: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          attempt?: number;
          checksum: string;
          claim_expires_at?: string | null;
          claimed_at?: string | null;
          company_id: string;
          created_at?: string;
          dependency_id?: string | null;
          device_id?: string | null;
          driver_id: string;
          entity: string;
          entity_id: string;
          id?: string;
          idempotency_key?: string | null;
          last_error?: string | null;
          next_retry_at?: string | null;
          operation: string;
          payload?: Json;
          priority: string;
          session_id?: string | null;
          state?: string;
          updated_at?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          attempt?: number;
          checksum?: string;
          claim_expires_at?: string | null;
          claimed_at?: string | null;
          company_id?: string;
          created_at?: string;
          dependency_id?: string | null;
          device_id?: string | null;
          driver_id?: string;
          entity?: string;
          entity_id?: string;
          id?: string;
          idempotency_key?: string | null;
          last_error?: string | null;
          next_retry_at?: string | null;
          operation?: string;
          payload?: Json;
          priority?: string;
          session_id?: string | null;
          state?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_offline_queue_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_offline_queue_items_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "driver_app_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_offline_queue_items_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_offline_queue_items_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "driver_navigation_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_offline_regions: {
        Row: {
          company_id: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          metadata: Json;
          name: string;
          provider_reference: string | null;
          region_type: string;
          tile_state: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          metadata?: Json;
          name: string;
          provider_reference?: string | null;
          region_type: string;
          tile_state?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          metadata?: Json;
          name?: string;
          provider_reference?: string | null;
          region_type?: string;
          tile_state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_offline_regions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_performance_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_performance_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_roadside_requests: {
        Row: {
          company_id: string;
          created_at: string;
          dispatcher_acknowledged_at: string | null;
          driver_id: string;
          id: string;
          issue_type: string;
          location: Json;
          mobility_status: string | null;
          safety_status: string | null;
          state: string;
          trip_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          dispatcher_acknowledged_at?: string | null;
          driver_id: string;
          id?: string;
          issue_type: string;
          location?: Json;
          mobility_status?: string | null;
          safety_status?: string | null;
          state?: string;
          trip_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          dispatcher_acknowledged_at?: string | null;
          driver_id?: string;
          id?: string;
          issue_type?: string;
          location?: Json;
          mobility_status?: string | null;
          safety_status?: string | null;
          state?: string;
          trip_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_roadside_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_roadside_requests_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_route_pack_versions: {
        Row: {
          company_id: string;
          created_at: string;
          destination: Json;
          id: string;
          instructions: Json;
          integrity_hash: string | null;
          metadata: Json;
          route_geometry: Json;
          route_pack_id: string;
          stops: Json;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          destination?: Json;
          id?: string;
          instructions?: Json;
          integrity_hash?: string | null;
          metadata?: Json;
          route_geometry?: Json;
          route_pack_id: string;
          stops?: Json;
          version: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          destination?: Json;
          id?: string;
          instructions?: Json;
          integrity_hash?: string | null;
          metadata?: Json;
          route_geometry?: Json;
          route_pack_id?: string;
          stops?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "driver_route_pack_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_route_pack_versions_route_pack_id_fkey";
            columns: ["route_pack_id"];
            isOneToOne: false;
            referencedRelation: "driver_route_packs";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_route_packs: {
        Row: {
          company_id: string;
          created_at: string;
          downloaded_bytes: number;
          driver_id: string | null;
          expected_bytes: number;
          expires_at: string | null;
          id: string;
          integrity_hash: string | null;
          metadata: Json;
          provider_reference: string | null;
          state: string;
          trip_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          downloaded_bytes?: number;
          driver_id?: string | null;
          expected_bytes?: number;
          expires_at?: string | null;
          id?: string;
          integrity_hash?: string | null;
          metadata?: Json;
          provider_reference?: string | null;
          state?: string;
          trip_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          downloaded_bytes?: number;
          driver_id?: string | null;
          expected_bytes?: number;
          expires_at?: string | null;
          id?: string;
          integrity_hash?: string | null;
          metadata?: Json;
          provider_reference?: string | null;
          state?: string;
          trip_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "driver_route_packs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_route_packs_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_security_events: {
        Row: {
          company_id: string;
          created_at: string;
          driver_id: string | null;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          driver_id?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          driver_id?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "driver_security_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_security_events_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_stop_actions: {
        Row: {
          action: string;
          captured_at: string;
          company_id: string;
          driver_id: string;
          evidence_source: string;
          id: string;
          idempotency_key: string;
          payload: Json;
          stop_reference: string;
          trip_id: string | null;
        };
        Insert: {
          action: string;
          captured_at?: string;
          company_id: string;
          driver_id: string;
          evidence_source?: string;
          id?: string;
          idempotency_key: string;
          payload?: Json;
          stop_reference: string;
          trip_id?: string | null;
        };
        Update: {
          action?: string;
          captured_at?: string;
          company_id?: string;
          driver_id?: string;
          evidence_source?: string;
          id?: string;
          idempotency_key?: string;
          payload?: Json;
          stop_reference?: string;
          trip_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "driver_stop_actions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_stop_actions_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_sync_conflicts: {
        Row: {
          company_id: string;
          conflict_type: string;
          created_at: string;
          driver_id: string;
          id: string;
          local_state: Json;
          queue_item_id: string | null;
          resolved_at: string | null;
          server_state: Json;
          state: string;
        };
        Insert: {
          company_id: string;
          conflict_type: string;
          created_at?: string;
          driver_id: string;
          id?: string;
          local_state?: Json;
          queue_item_id?: string | null;
          resolved_at?: string | null;
          server_state?: Json;
          state?: string;
        };
        Update: {
          company_id?: string;
          conflict_type?: string;
          created_at?: string;
          driver_id?: string;
          id?: string;
          local_state?: Json;
          queue_item_id?: string | null;
          resolved_at?: string | null;
          server_state?: Json;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_sync_conflicts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_sync_conflicts_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_sync_conflicts_queue_item_id_fkey";
            columns: ["queue_item_id"];
            isOneToOne: false;
            referencedRelation: "driver_offline_queue_items";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_sync_runs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          conflict_count: number;
          driver_id: string;
          failed_count: number;
          id: string;
          queued_count: number;
          started_at: string;
          state: string;
          succeeded_count: number;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          conflict_count?: number;
          driver_id: string;
          failed_count?: number;
          id?: string;
          queued_count?: number;
          started_at?: string;
          state?: string;
          succeeded_count?: number;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          conflict_count?: number;
          driver_id?: string;
          failed_count?: number;
          id?: string;
          queued_count?: number;
          started_at?: string;
          state?: string;
          succeeded_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "driver_sync_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_sync_runs_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      drivers: {
        Row: {
          assigned_vehicle_id: string | null;
          company_id: string;
          created_at: string;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          employee_ref: string | null;
          full_name: string;
          id: string;
          licence_class: string | null;
          licence_expiry: string | null;
          licence_number: string | null;
          notes: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["driver_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          assigned_vehicle_id?: string | null;
          company_id: string;
          created_at?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          employee_ref?: string | null;
          full_name: string;
          id?: string;
          licence_class?: string | null;
          licence_expiry?: string | null;
          licence_number?: string | null;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["driver_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          assigned_vehicle_id?: string | null;
          company_id?: string;
          created_at?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          employee_ref?: string | null;
          full_name?: string;
          id?: string;
          licence_class?: string | null;
          licence_expiry?: string | null;
          licence_number?: string | null;
          notes?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["driver_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_vehicle_fk";
            columns: ["assigned_vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "drivers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      field_audit_ledger: {
        Row: {
          action: string;
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          new_state: Json | null;
          old_state: Json | null;
          reason: string | null;
          source: string;
        };
        Insert: {
          action: string;
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          new_state?: Json | null;
          old_state?: Json | null;
          reason?: string | null;
          source?: string;
        };
        Update: {
          action?: string;
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          new_state?: Json | null;
          old_state?: Json | null;
          reason?: string | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "field_audit_ledger_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      field_inventory_movements: {
        Row: {
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id: string | null;
          asset_id: string;
          asset_type: string;
          company_id: string;
          created_at: string;
          fitment_job_id: string | null;
          from_state: Database["public"]["Enums"]["field_inventory_state"] | null;
          id: string;
          reason: string | null;
          source: string;
          to_state: Database["public"]["Enums"]["field_inventory_state"];
        };
        Insert: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          asset_id: string;
          asset_type: string;
          company_id: string;
          created_at?: string;
          fitment_job_id?: string | null;
          from_state?: Database["public"]["Enums"]["field_inventory_state"] | null;
          id?: string;
          reason?: string | null;
          source?: string;
          to_state: Database["public"]["Enums"]["field_inventory_state"];
        };
        Update: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          asset_id?: string;
          asset_type?: string;
          company_id?: string;
          created_at?: string;
          fitment_job_id?: string | null;
          from_state?: Database["public"]["Enums"]["field_inventory_state"] | null;
          id?: string;
          reason?: string | null;
          source?: string;
          to_state?: Database["public"]["Enums"]["field_inventory_state"];
        };
        Relationships: [
          {
            foreignKeyName: "field_inventory_movements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_inventory_movements_fitment_job_id_fkey";
            columns: ["fitment_job_id"];
            isOneToOne: false;
            referencedRelation: "device_fitment_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      field_support_cases: {
        Row: {
          assigned_to: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          device_id: string | null;
          diagnostic_summary: string | null;
          fitment_job_id: string | null;
          id: string;
          opened_at: string;
          priority: string;
          reported_issue: string;
          resolution: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["field_support_case_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          device_id?: string | null;
          diagnostic_summary?: string | null;
          fitment_job_id?: string | null;
          id?: string;
          opened_at?: string;
          priority?: string;
          reported_issue: string;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["field_support_case_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          device_id?: string | null;
          diagnostic_summary?: string | null;
          fitment_job_id?: string | null;
          id?: string;
          opened_at?: string;
          priority?: string;
          reported_issue?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["field_support_case_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "field_support_cases_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_support_cases_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_support_cases_fitment_job_id_fkey";
            columns: ["fitment_job_id"];
            isOneToOne: false;
            referencedRelation: "device_fitment_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_support_cases_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      firmware_rollout_plan_devices: {
        Row: {
          company_id: string;
          compatibility_status: string;
          created_at: string;
          device_id: string;
          id: string;
          notes: string | null;
          rollout_plan_id: string;
        };
        Insert: {
          company_id: string;
          compatibility_status?: string;
          created_at?: string;
          device_id: string;
          id?: string;
          notes?: string | null;
          rollout_plan_id: string;
        };
        Update: {
          company_id?: string;
          compatibility_status?: string;
          created_at?: string;
          device_id?: string;
          id?: string;
          notes?: string | null;
          rollout_plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "firmware_rollout_plan_devices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "firmware_rollout_plan_devices_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "firmware_rollout_plan_devices_rollout_plan_id_fkey";
            columns: ["rollout_plan_id"];
            isOneToOne: false;
            referencedRelation: "firmware_rollout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      firmware_rollout_plans: {
        Row: {
          approval_required: boolean;
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          firmware_version_id: string;
          id: string;
          metadata: Json;
          name: string;
          notes: string | null;
          planned_start: string | null;
          rollback_version_id: string | null;
          rollout_stage: string;
          status: Database["public"]["Enums"]["firmware_rollout_plan_status"];
          target_count: number;
          updated_at: string;
        };
        Insert: {
          approval_required?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          firmware_version_id: string;
          id?: string;
          metadata?: Json;
          name: string;
          notes?: string | null;
          planned_start?: string | null;
          rollback_version_id?: string | null;
          rollout_stage?: string;
          status?: Database["public"]["Enums"]["firmware_rollout_plan_status"];
          target_count?: number;
          updated_at?: string;
        };
        Update: {
          approval_required?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          firmware_version_id?: string;
          id?: string;
          metadata?: Json;
          name?: string;
          notes?: string | null;
          planned_start?: string | null;
          rollback_version_id?: string | null;
          rollout_stage?: string;
          status?: Database["public"]["Enums"]["firmware_rollout_plan_status"];
          target_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "firmware_rollout_plans_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "firmware_rollout_plans_firmware_version_id_fkey";
            columns: ["firmware_version_id"];
            isOneToOne: false;
            referencedRelation: "device_firmware_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "firmware_rollout_plans_rollback_version_id_fkey";
            columns: ["rollback_version_id"];
            isOneToOne: false;
            referencedRelation: "device_firmware_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      fitment_checklist_template_steps: {
        Row: {
          created_at: string;
          critical: boolean;
          id: string;
          instructions: string;
          mandatory: boolean;
          step_number: number;
          template_id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          critical?: boolean;
          id?: string;
          instructions: string;
          mandatory?: boolean;
          step_number: number;
          template_id: string;
          title: string;
        };
        Update: {
          created_at?: string;
          critical?: boolean;
          id?: string;
          instructions?: string;
          mandatory?: boolean;
          step_number?: number;
          template_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fitment_checklist_template_steps_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "fitment_checklist_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      fitment_checklist_templates: {
        Row: {
          company_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          status?: string;
          updated_at?: string;
          version: number;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fitment_checklist_templates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fitment_evidence: {
        Row: {
          company_id: string;
          evidence_type: string;
          fitment_job_id: string;
          id: string;
          metadata: Json;
          notes: string | null;
          storage_bucket: string;
          storage_path: string;
          uploaded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          company_id: string;
          evidence_type: string;
          fitment_job_id: string;
          id?: string;
          metadata?: Json;
          notes?: string | null;
          storage_bucket?: string;
          storage_path: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          company_id?: string;
          evidence_type?: string;
          fitment_job_id?: string;
          id?: string;
          metadata?: Json;
          notes?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fitment_evidence_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fitment_evidence_fitment_job_id_fkey";
            columns: ["fitment_job_id"];
            isOneToOne: false;
            referencedRelation: "device_fitment_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      fitment_job_checklist_steps: {
        Row: {
          checklist_version: number;
          company_id: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          critical: boolean;
          evidence_references: Json;
          failure_reason: string | null;
          fitment_job_id: string;
          id: string;
          instructions: string;
          mandatory: boolean;
          override_reason: string | null;
          status: Database["public"]["Enums"]["fitment_step_status"];
          step_number: number;
          supervisor_comment: string | null;
          technician_notes: string | null;
          template_step_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          checklist_version: number;
          company_id: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          critical?: boolean;
          evidence_references?: Json;
          failure_reason?: string | null;
          fitment_job_id: string;
          id?: string;
          instructions: string;
          mandatory?: boolean;
          override_reason?: string | null;
          status?: Database["public"]["Enums"]["fitment_step_status"];
          step_number: number;
          supervisor_comment?: string | null;
          technician_notes?: string | null;
          template_step_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          checklist_version?: number;
          company_id?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          critical?: boolean;
          evidence_references?: Json;
          failure_reason?: string | null;
          fitment_job_id?: string;
          id?: string;
          instructions?: string;
          mandatory?: boolean;
          override_reason?: string | null;
          status?: Database["public"]["Enums"]["fitment_step_status"];
          step_number?: number;
          supervisor_comment?: string | null;
          technician_notes?: string | null;
          template_step_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fitment_job_checklist_steps_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fitment_job_checklist_steps_fitment_job_id_fkey";
            columns: ["fitment_job_id"];
            isOneToOne: false;
            referencedRelation: "device_fitment_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fitment_job_checklist_steps_template_step_id_fkey";
            columns: ["template_step_id"];
            isOneToOne: false;
            referencedRelation: "fitment_checklist_template_steps";
            referencedColumns: ["id"];
          },
        ];
      };
      fitment_road_tests: {
        Row: {
          accepted_telemetry_count: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          distance_meters: number | null;
          duration_seconds: number | null;
          ended_at: string | null;
          fitment_job_id: string;
          gps_quality: string | null;
          id: string;
          network_drop_count: number;
          reconnect_count: number;
          result: Database["public"]["Enums"]["fitment_test_result"];
          sos_simulation_result: string | null;
          source: string;
          started_at: string | null;
          technician_conclusion: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_telemetry_count?: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          distance_meters?: number | null;
          duration_seconds?: number | null;
          ended_at?: string | null;
          fitment_job_id: string;
          gps_quality?: string | null;
          id?: string;
          network_drop_count?: number;
          reconnect_count?: number;
          result?: Database["public"]["Enums"]["fitment_test_result"];
          sos_simulation_result?: string | null;
          source: string;
          started_at?: string | null;
          technician_conclusion?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_telemetry_count?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          distance_meters?: number | null;
          duration_seconds?: number | null;
          ended_at?: string | null;
          fitment_job_id?: string;
          gps_quality?: string | null;
          id?: string;
          network_drop_count?: number;
          reconnect_count?: number;
          result?: Database["public"]["Enums"]["fitment_test_result"];
          sos_simulation_result?: string | null;
          source?: string;
          started_at?: string | null;
          technician_conclusion?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fitment_road_tests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fitment_road_tests_fitment_job_id_fkey";
            columns: ["fitment_job_id"];
            isOneToOne: false;
            referencedRelation: "device_fitment_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      fitment_test_results: {
        Row: {
          company_id: string;
          created_at: string;
          critical: boolean;
          expected_range: string | null;
          fitment_job_id: string;
          id: string;
          measured_value: number | null;
          metadata: Json;
          notes: string | null;
          observed_at: string;
          override_reason: string | null;
          result: Database["public"]["Enums"]["fitment_test_result"];
          source: Database["public"]["Enums"]["fitment_test_source"];
          technician_user_id: string | null;
          test_category: string;
          test_type: string;
          unit: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          critical?: boolean;
          expected_range?: string | null;
          fitment_job_id: string;
          id?: string;
          measured_value?: number | null;
          metadata?: Json;
          notes?: string | null;
          observed_at?: string;
          override_reason?: string | null;
          result?: Database["public"]["Enums"]["fitment_test_result"];
          source?: Database["public"]["Enums"]["fitment_test_source"];
          technician_user_id?: string | null;
          test_category: string;
          test_type: string;
          unit?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          critical?: boolean;
          expected_range?: string | null;
          fitment_job_id?: string;
          id?: string;
          measured_value?: number | null;
          metadata?: Json;
          notes?: string | null;
          observed_at?: string;
          override_reason?: string | null;
          result?: Database["public"]["Enums"]["fitment_test_result"];
          source?: Database["public"]["Enums"]["fitment_test_source"];
          technician_user_id?: string | null;
          test_category?: string;
          test_type?: string;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fitment_test_results_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fitment_test_results_fitment_job_id_fkey";
            columns: ["fitment_job_id"];
            isOneToOne: false;
            referencedRelation: "device_fitment_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_cost_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_cost_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_evidence: {
        Row: {
          company_id: string;
          created_at: string;
          field_name: string;
          id: string;
          observed_at: string;
          observed_value: Json;
          recommendation_id: string | null;
          snapshot_id: string | null;
          source_record_id: string;
          source_type: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          field_name: string;
          id?: string;
          observed_at: string;
          observed_value: Json;
          recommendation_id?: string | null;
          snapshot_id?: string | null;
          source_record_id: string;
          source_type: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          field_name?: string;
          id?: string;
          observed_at?: string;
          observed_value?: Json;
          recommendation_id?: string | null;
          snapshot_id?: string | null;
          source_record_id?: string;
          source_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_evidence_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_evidence_recommendation_fk";
            columns: ["recommendation_id"];
            isOneToOne: false;
            referencedRelation: "fleet_intelligence_recommendations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_evidence_snapshot_id_fkey";
            columns: ["snapshot_id"];
            isOneToOne: false;
            referencedRelation: "fleet_intelligence_snapshots";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_feedback: {
        Row: {
          assessment_id: string;
          company_id: string;
          created_at: string;
          driver_id: string;
          feedback_type: string;
          id: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          statement: string;
          status: string;
          submitted_by: string;
        };
        Insert: {
          assessment_id: string;
          company_id: string;
          created_at?: string;
          driver_id: string;
          feedback_type: string;
          id?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          statement: string;
          status?: string;
          submitted_by: string;
        };
        Update: {
          assessment_id?: string;
          company_id?: string;
          created_at?: string;
          driver_id?: string;
          feedback_type?: string;
          id?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          statement?: string;
          status?: string;
          submitted_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_feedback_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_feedback_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_recommendations: {
        Row: {
          advisory_only: boolean;
          brain_insight_id: string | null;
          company_id: string;
          confidence: number;
          created_at: string;
          domain: string;
          evidence_count: number;
          explanation: string;
          freshness: string;
          human_decision_note: string | null;
          id: string;
          owner: string;
          priority: number;
          prohibited_automatic_action: string;
          recommendation_code: string;
          requires_human_decision: boolean;
          reviewed_at: string | null;
          reviewed_by: string | null;
          risk_level: string;
          snapshot_id: string | null;
          source_record_id: string | null;
          source_record_type: string | null;
          status: string;
          subject_id: string | null;
          subject_type: string;
          suggested_action: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          advisory_only?: boolean;
          brain_insight_id?: string | null;
          company_id: string;
          confidence: number;
          created_at?: string;
          domain: string;
          evidence_count?: number;
          explanation: string;
          freshness?: string;
          human_decision_note?: string | null;
          id?: string;
          owner?: string;
          priority?: number;
          prohibited_automatic_action: string;
          recommendation_code: string;
          requires_human_decision?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_level: string;
          snapshot_id?: string | null;
          source_record_id?: string | null;
          source_record_type?: string | null;
          status?: string;
          subject_id?: string | null;
          subject_type?: string;
          suggested_action: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          advisory_only?: boolean;
          brain_insight_id?: string | null;
          company_id?: string;
          confidence?: number;
          created_at?: string;
          domain?: string;
          evidence_count?: number;
          explanation?: string;
          freshness?: string;
          human_decision_note?: string | null;
          id?: string;
          owner?: string;
          priority?: number;
          prohibited_automatic_action?: string;
          recommendation_code?: string;
          requires_human_decision?: boolean;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_level?: string;
          snapshot_id?: string | null;
          source_record_id?: string | null;
          source_record_type?: string | null;
          status?: string;
          subject_id?: string | null;
          subject_type?: string;
          suggested_action?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_recommendations_brain_insight_id_fkey";
            columns: ["brain_insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_recommendations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_recommendations_snapshot_id_fkey";
            columns: ["snapshot_id"];
            isOneToOne: false;
            referencedRelation: "fleet_intelligence_snapshots";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_rule_versions: {
        Row: {
          active: boolean;
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          description: string;
          domain: string;
          governance_status: string;
          id: string;
          parameters: Json;
          rule_code: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          description: string;
          domain: string;
          governance_status?: string;
          id?: string;
          parameters?: Json;
          rule_code: string;
          version: number;
        };
        Update: {
          active?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          description?: string;
          domain?: string;
          governance_status?: string;
          id?: string;
          parameters?: Json;
          rule_code?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_rule_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_runs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          error_summary: string | null;
          id: string;
          input_count: number;
          output_count: number;
          requested_by: string | null;
          rule_version_id: string;
          started_at: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          error_summary?: string | null;
          id?: string;
          input_count?: number;
          output_count?: number;
          requested_by?: string | null;
          rule_version_id: string;
          started_at?: string | null;
          status: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          error_summary?: string | null;
          id?: string;
          input_count?: number;
          output_count?: number;
          requested_by?: string | null;
          rule_version_id?: string;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_runs_rule_version_id_fkey";
            columns: ["rule_version_id"];
            isOneToOne: false;
            referencedRelation: "fleet_intelligence_rule_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_intelligence_snapshots: {
        Row: {
          calculated_at: string;
          company_id: string;
          created_at: string;
          evidence_quality: string;
          id: string;
          metric_code: string;
          metric_value: number | null;
          period_end: string | null;
          period_start: string | null;
          risk_level: string;
          rule_version_id: string;
          sample_size: number;
          scope_id: string | null;
          scope_type: string;
          unit: string | null;
        };
        Insert: {
          calculated_at: string;
          company_id: string;
          created_at?: string;
          evidence_quality: string;
          id?: string;
          metric_code: string;
          metric_value?: number | null;
          period_end?: string | null;
          period_start?: string | null;
          risk_level: string;
          rule_version_id: string;
          sample_size?: number;
          scope_id?: string | null;
          scope_type: string;
          unit?: string | null;
        };
        Update: {
          calculated_at?: string;
          company_id?: string;
          created_at?: string;
          evidence_quality?: string;
          id?: string;
          metric_code?: string;
          metric_value?: number | null;
          period_end?: string | null;
          period_start?: string | null;
          risk_level?: string;
          rule_version_id?: string;
          sample_size?: number;
          scope_id?: string | null;
          scope_type?: string;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_intelligence_snapshots_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fleet_intelligence_snapshots_rule_version_id_fkey";
            columns: ["rule_version_id"];
            isOneToOne: false;
            referencedRelation: "fleet_intelligence_rule_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_planning_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_planning_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fleet_utilisation_snapshots: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fleet_utilisation_snapshots_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      fuel_performance_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fuel_performance_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_applicants: {
        Row: {
          company_id: string;
          created_at: string;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string;
          notes: string | null;
          phone: string | null;
          requisition_id: string | null;
          score: number | null;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          email?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          notes?: string | null;
          phone?: string | null;
          requisition_id?: string | null;
          score?: number | null;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          notes?: string | null;
          phone?: string | null;
          requisition_id?: string | null;
          score?: number | null;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_applicants_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_applicants_requisition_id_fkey";
            columns: ["requisition_id"];
            isOneToOne: false;
            referencedRelation: "hr_requisitions";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_asset_assignments: {
        Row: {
          asset_id: string;
          company_id: string;
          condition_on_issue: string | null;
          condition_on_return: string | null;
          created_at: string;
          employee_id: string;
          id: string;
          issued_at: string;
          issued_by: string | null;
          replacement_reason: string | null;
          returned_at: string | null;
          updated_at: string;
        };
        Insert: {
          asset_id: string;
          company_id: string;
          condition_on_issue?: string | null;
          condition_on_return?: string | null;
          created_at?: string;
          employee_id: string;
          id?: string;
          issued_at?: string;
          issued_by?: string | null;
          replacement_reason?: string | null;
          returned_at?: string | null;
          updated_at?: string;
        };
        Update: {
          asset_id?: string;
          company_id?: string;
          condition_on_issue?: string | null;
          condition_on_return?: string | null;
          created_at?: string;
          employee_id?: string;
          id?: string;
          issued_at?: string;
          issued_by?: string | null;
          replacement_reason?: string | null;
          returned_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_asset_assignments_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "hr_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_asset_assignments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_asset_assignments_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_assets: {
        Row: {
          asset_tag: string;
          asset_type: string;
          company_id: string;
          created_at: string;
          details: Json;
          id: string;
          status: Database["public"]["Enums"]["hr_asset_status"];
          updated_at: string;
        };
        Insert: {
          asset_tag: string;
          asset_type: string;
          company_id: string;
          created_at?: string;
          details?: Json;
          id?: string;
          status?: Database["public"]["Enums"]["hr_asset_status"];
          updated_at?: string;
        };
        Update: {
          asset_tag?: string;
          asset_type?: string;
          company_id?: string;
          created_at?: string;
          details?: Json;
          id?: string;
          status?: Database["public"]["Enums"]["hr_asset_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_assets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_attendance_records: {
        Row: {
          adjustment_notes: string | null;
          approved_by: string | null;
          break_minutes: number;
          clock_in_at: string | null;
          clock_out_at: string | null;
          company_id: string;
          created_at: string;
          employee_id: string;
          exception_type: string | null;
          id: string;
          overtime_minutes: number;
          updated_at: string;
          work_date: string;
        };
        Insert: {
          adjustment_notes?: string | null;
          approved_by?: string | null;
          break_minutes?: number;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          company_id: string;
          created_at?: string;
          employee_id: string;
          exception_type?: string | null;
          id?: string;
          overtime_minutes?: number;
          updated_at?: string;
          work_date?: string;
        };
        Update: {
          adjustment_notes?: string | null;
          approved_by?: string | null;
          break_minutes?: number;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          company_id?: string;
          created_at?: string;
          employee_id?: string;
          exception_type?: string | null;
          id?: string;
          overtime_minutes?: number;
          updated_at?: string;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_attendance_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_attendance_records_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "hr_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_branches: {
        Row: {
          active: boolean;
          address: string | null;
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          address?: string | null;
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          address?: string | null;
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_branches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_cost_centres: {
        Row: {
          active: boolean;
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_cost_centres_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_departments: {
        Row: {
          active: boolean;
          branch_id: string | null;
          company_id: string;
          cost_centre_id: string | null;
          created_at: string;
          id: string;
          manager_id: string | null;
          name: string;
          parent_department_id: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          branch_id?: string | null;
          company_id: string;
          cost_centre_id?: string | null;
          created_at?: string;
          id?: string;
          manager_id?: string | null;
          name: string;
          parent_department_id?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          branch_id?: string | null;
          company_id?: string;
          cost_centre_id?: string | null;
          created_at?: string;
          id?: string;
          manager_id?: string | null;
          name?: string;
          parent_department_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_departments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "hr_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_departments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_departments_cost_centre_id_fkey";
            columns: ["cost_centre_id"];
            isOneToOne: false;
            referencedRelation: "hr_cost_centres";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_departments_manager_fk";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_departments_parent_department_id_fkey";
            columns: ["parent_department_id"];
            isOneToOne: false;
            referencedRelation: "hr_departments";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_disciplinary_cases: {
        Row: {
          appeal_details: string | null;
          case_type: string;
          company_id: string;
          created_at: string;
          details: string;
          employee_id: string;
          id: string;
          opened_by: string | null;
          outcome: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          appeal_details?: string | null;
          case_type: string;
          company_id: string;
          created_at?: string;
          details: string;
          employee_id: string;
          id?: string;
          opened_by?: string | null;
          outcome?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          appeal_details?: string | null;
          case_type?: string;
          company_id?: string;
          created_at?: string;
          details?: string;
          employee_id?: string;
          id?: string;
          opened_by?: string | null;
          outcome?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_disciplinary_cases_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_disciplinary_cases_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_employees: {
        Row: {
          address: string | null;
          banking_reference: Json;
          branch_id: string | null;
          company_id: string;
          cost_centre_id: string | null;
          created_at: string;
          department_id: string | null;
          driver_id: string | null;
          emergency_contacts: Json;
          employment_number: string;
          employment_type: string;
          end_date: string | null;
          first_name: string;
          id: string;
          last_name: string;
          manager_id: string | null;
          medical_summary: Json;
          national_id_reference: string | null;
          next_of_kin: Json;
          personal_email: string | null;
          phone: string | null;
          photo_metadata: Json;
          position_title: string;
          probation_end_date: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["hr_employee_status"];
          tax_number_reference: string | null;
          team_id: string | null;
          terminated_reason: string | null;
          updated_at: string;
          user_id: string | null;
          work_email: string | null;
        };
        Insert: {
          address?: string | null;
          banking_reference?: Json;
          branch_id?: string | null;
          company_id: string;
          cost_centre_id?: string | null;
          created_at?: string;
          department_id?: string | null;
          driver_id?: string | null;
          emergency_contacts?: Json;
          employment_number: string;
          employment_type?: string;
          end_date?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          manager_id?: string | null;
          medical_summary?: Json;
          national_id_reference?: string | null;
          next_of_kin?: Json;
          personal_email?: string | null;
          phone?: string | null;
          photo_metadata?: Json;
          position_title: string;
          probation_end_date?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["hr_employee_status"];
          tax_number_reference?: string | null;
          team_id?: string | null;
          terminated_reason?: string | null;
          updated_at?: string;
          user_id?: string | null;
          work_email?: string | null;
        };
        Update: {
          address?: string | null;
          banking_reference?: Json;
          branch_id?: string | null;
          company_id?: string;
          cost_centre_id?: string | null;
          created_at?: string;
          department_id?: string | null;
          driver_id?: string | null;
          emergency_contacts?: Json;
          employment_number?: string;
          employment_type?: string;
          end_date?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          manager_id?: string | null;
          medical_summary?: Json;
          national_id_reference?: string | null;
          next_of_kin?: Json;
          personal_email?: string | null;
          phone?: string | null;
          photo_metadata?: Json;
          position_title?: string;
          probation_end_date?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["hr_employee_status"];
          tax_number_reference?: string | null;
          team_id?: string | null;
          terminated_reason?: string | null;
          updated_at?: string;
          user_id?: string | null;
          work_email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hr_employees_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "hr_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_cost_centre_id_fkey";
            columns: ["cost_centre_id"];
            isOneToOne: false;
            referencedRelation: "hr_cost_centres";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "hr_departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_employees_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "hr_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_expense_claims: {
        Row: {
          amount: number;
          claim_type: string;
          company_id: string;
          created_at: string;
          currency_code: string;
          description: string | null;
          employee_id: string;
          id: string;
          incurred_on: string;
          manager_approved_by: string | null;
          payroll_approved_by: string | null;
          receipt_document_id: string | null;
          status: Database["public"]["Enums"]["hr_expense_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          claim_type: string;
          company_id: string;
          created_at?: string;
          currency_code?: string;
          description?: string | null;
          employee_id: string;
          id?: string;
          incurred_on: string;
          manager_approved_by?: string | null;
          payroll_approved_by?: string | null;
          receipt_document_id?: string | null;
          status?: Database["public"]["Enums"]["hr_expense_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          claim_type?: string;
          company_id?: string;
          created_at?: string;
          currency_code?: string;
          description?: string | null;
          employee_id?: string;
          id?: string;
          incurred_on?: string;
          manager_approved_by?: string | null;
          payroll_approved_by?: string | null;
          receipt_document_id?: string | null;
          status?: Database["public"]["Enums"]["hr_expense_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_expense_claims_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_expense_claims_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_expense_claims_receipt_document_id_fkey";
            columns: ["receipt_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_interviews: {
        Row: {
          applicant_id: string;
          company_id: string;
          created_at: string;
          id: string;
          interviewer_ids: string[];
          notes: string | null;
          outcome: string | null;
          scheduled_at: string;
          score: number | null;
          updated_at: string;
        };
        Insert: {
          applicant_id: string;
          company_id: string;
          created_at?: string;
          id?: string;
          interviewer_ids?: string[];
          notes?: string | null;
          outcome?: string | null;
          scheduled_at: string;
          score?: number | null;
          updated_at?: string;
        };
        Update: {
          applicant_id?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          interviewer_ids?: string[];
          notes?: string | null;
          outcome?: string | null;
          scheduled_at?: string;
          score?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_interviews_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "hr_applicants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_interviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_leave_requests: {
        Row: {
          company_id: string;
          created_at: string;
          employee_id: string;
          end_date: string;
          hr_approved_by: string | null;
          id: string;
          leave_type: string;
          manager_approved_by: string | null;
          reason: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["hr_leave_status"];
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          employee_id: string;
          end_date: string;
          hr_approved_by?: string | null;
          id?: string;
          leave_type: string;
          manager_approved_by?: string | null;
          reason?: string | null;
          start_date: string;
          status?: Database["public"]["Enums"]["hr_leave_status"];
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          employee_id?: string;
          end_date?: string;
          hr_approved_by?: string | null;
          id?: string;
          leave_type?: string;
          manager_approved_by?: string | null;
          reason?: string | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["hr_leave_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_medical_compliance: {
        Row: {
          company_id: string;
          completed_at: string | null;
          compliance_type: string;
          created_at: string;
          document_id: string | null;
          employee_id: string;
          expires_at: string | null;
          id: string;
          private_metadata: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          compliance_type: string;
          created_at?: string;
          document_id?: string | null;
          employee_id: string;
          expires_at?: string | null;
          id?: string;
          private_metadata?: Json;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          compliance_type?: string;
          created_at?: string;
          document_id?: string | null;
          employee_id?: string;
          expires_at?: string | null;
          id?: string;
          private_metadata?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_medical_compliance_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_medical_compliance_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_medical_compliance_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_offers: {
        Row: {
          accepted_at: string | null;
          applicant_id: string;
          company_id: string;
          created_at: string;
          id: string;
          issued_by: string | null;
          offered_salary: number | null;
          position_title: string;
          start_date: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          applicant_id: string;
          company_id: string;
          created_at?: string;
          id?: string;
          issued_by?: string | null;
          offered_salary?: number | null;
          position_title: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          applicant_id?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          issued_by?: string | null;
          offered_salary?: number | null;
          position_title?: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_offers_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "hr_applicants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_offers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_onboarding: {
        Row: {
          company_id: string;
          completed_at: string | null;
          contract_issued: boolean;
          created_at: string;
          documents_submitted: boolean;
          employee_id: string;
          employment_activated: boolean;
          equipment_assigned: boolean;
          id: string;
          identity_verified: boolean;
          induction_completed: boolean;
          medical_completed: boolean;
          owner_id: string | null;
          system_access_granted: boolean;
          training_scheduled: boolean;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          contract_issued?: boolean;
          created_at?: string;
          documents_submitted?: boolean;
          employee_id: string;
          employment_activated?: boolean;
          equipment_assigned?: boolean;
          id?: string;
          identity_verified?: boolean;
          induction_completed?: boolean;
          medical_completed?: boolean;
          owner_id?: string | null;
          system_access_granted?: boolean;
          training_scheduled?: boolean;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          contract_issued?: boolean;
          created_at?: string;
          documents_submitted?: boolean;
          employee_id?: string;
          employment_activated?: boolean;
          equipment_assigned?: boolean;
          id?: string;
          identity_verified?: boolean;
          induction_completed?: boolean;
          medical_completed?: boolean;
          owner_id?: string | null;
          system_access_granted?: boolean;
          training_scheduled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_onboarding_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_onboarding_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_payroll_profiles: {
        Row: {
          allowances: Json;
          company_id: string;
          created_at: string;
          deductions: Json;
          effective_from: string;
          employee_id: string;
          hourly_rate: number | null;
          id: string;
          leave_balance: Json;
          payroll_export_metadata: Json;
          salary_amount: number | null;
          updated_at: string;
        };
        Insert: {
          allowances?: Json;
          company_id: string;
          created_at?: string;
          deductions?: Json;
          effective_from?: string;
          employee_id: string;
          hourly_rate?: number | null;
          id?: string;
          leave_balance?: Json;
          payroll_export_metadata?: Json;
          salary_amount?: number | null;
          updated_at?: string;
        };
        Update: {
          allowances?: Json;
          company_id?: string;
          created_at?: string;
          deductions?: Json;
          effective_from?: string;
          employee_id?: string;
          hourly_rate?: number | null;
          id?: string;
          leave_balance?: Json;
          payroll_export_metadata?: Json;
          salary_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_payroll_profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_payroll_profiles_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_performance_reviews: {
        Row: {
          company_id: string;
          created_at: string;
          employee_id: string;
          goals: Json;
          id: string;
          improvement_plan: string | null;
          kpis: Json;
          promotion_recommendation: string | null;
          review_period_end: string;
          review_period_start: string;
          reviewer_id: string | null;
          self_assessment: string | null;
          status: string;
          supervisor_rating: number | null;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          employee_id: string;
          goals?: Json;
          id?: string;
          improvement_plan?: string | null;
          kpis?: Json;
          promotion_recommendation?: string | null;
          review_period_end: string;
          review_period_start: string;
          reviewer_id?: string | null;
          self_assessment?: string | null;
          status?: string;
          supervisor_rating?: number | null;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          employee_id?: string;
          goals?: Json;
          id?: string;
          improvement_plan?: string | null;
          kpis?: Json;
          promotion_recommendation?: string | null;
          review_period_end?: string;
          review_period_start?: string;
          reviewer_id?: string | null;
          self_assessment?: string | null;
          status?: string;
          supervisor_rating?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_performance_reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_performance_reviews_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_performance_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_requisitions: {
        Row: {
          approved_by: string | null;
          branch_id: string | null;
          closed_at: string | null;
          company_id: string;
          created_at: string;
          department_id: string | null;
          description: string | null;
          employment_type: string;
          id: string;
          opened_at: string | null;
          requested_by: string | null;
          status: string;
          title: string;
          updated_at: string;
          vacancy_count: number;
        };
        Insert: {
          approved_by?: string | null;
          branch_id?: string | null;
          closed_at?: string | null;
          company_id: string;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          employment_type: string;
          id?: string;
          opened_at?: string | null;
          requested_by?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          vacancy_count?: number;
        };
        Update: {
          approved_by?: string | null;
          branch_id?: string | null;
          closed_at?: string | null;
          company_id?: string;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          employment_type?: string;
          id?: string;
          opened_at?: string | null;
          requested_by?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          vacancy_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "hr_requisitions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "hr_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_requisitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_requisitions_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "hr_departments";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_shift_assignments: {
        Row: {
          approved_by: string | null;
          assignment_area: string;
          company_id: string;
          created_at: string;
          employee_id: string;
          ends_at: string;
          id: string;
          shift_date: string;
          starts_at: string;
          status: string;
          template_id: string | null;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          assignment_area: string;
          company_id: string;
          created_at?: string;
          employee_id: string;
          ends_at: string;
          id?: string;
          shift_date: string;
          starts_at: string;
          status?: string;
          template_id?: string | null;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          assignment_area?: string;
          company_id?: string;
          created_at?: string;
          employee_id?: string;
          ends_at?: string;
          id?: string;
          shift_date?: string;
          starts_at?: string;
          status?: string;
          template_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_shift_assignments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_shift_assignments_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_shift_assignments_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "hr_shift_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_shift_templates: {
        Row: {
          active: boolean;
          break_minutes: number;
          company_id: string;
          created_at: string;
          end_time: string;
          id: string;
          name: string;
          shift_type: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          break_minutes?: number;
          company_id: string;
          created_at?: string;
          end_time: string;
          id?: string;
          name: string;
          shift_type: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          break_minutes?: number;
          company_id?: string;
          created_at?: string;
          end_time?: string;
          id?: string;
          name?: string;
          shift_type?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_shift_templates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_teams: {
        Row: {
          active: boolean;
          company_id: string;
          created_at: string;
          department_id: string;
          id: string;
          name: string;
          supervisor_id: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          created_at?: string;
          department_id: string;
          id?: string;
          name: string;
          supervisor_id?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          created_at?: string;
          department_id?: string;
          id?: string;
          name?: string;
          supervisor_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_teams_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_teams_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "hr_departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_teams_supervisor_fk";
            columns: ["supervisor_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      hr_training_records: {
        Row: {
          certificate_document_id: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          employee_id: string;
          expires_at: string | null;
          id: string;
          metadata: Json;
          provider: string | null;
          status: string;
          training_type: string;
          updated_at: string;
        };
        Insert: {
          certificate_document_id?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          employee_id: string;
          expires_at?: string | null;
          id?: string;
          metadata?: Json;
          provider?: string | null;
          status?: string;
          training_type: string;
          updated_at?: string;
        };
        Update: {
          certificate_document_id?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          employee_id?: string;
          expires_at?: string | null;
          id?: string;
          metadata?: Json;
          provider?: string | null;
          status?: string;
          training_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hr_training_records_certificate_document_id_fkey";
            columns: ["certificate_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_training_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hr_training_records_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "hr_employees";
            referencedColumns: ["id"];
          },
        ];
      };
      incidents: {
        Row: {
          company_id: string;
          created_at: string;
          description: string;
          driver_id: string | null;
          id: string;
          incident_type: Database["public"]["Enums"]["incident_type"];
          job_id: string | null;
          location: string | null;
          occurred_at: string;
          photo_urls: string[] | null;
          reported_by: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          severity: Database["public"]["Enums"]["incident_severity"];
          status: Database["public"]["Enums"]["incident_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description: string;
          driver_id?: string | null;
          id?: string;
          incident_type?: Database["public"]["Enums"]["incident_type"];
          job_id?: string | null;
          location?: string | null;
          occurred_at?: string;
          photo_urls?: string[] | null;
          reported_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["incident_severity"];
          status?: Database["public"]["Enums"]["incident_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string;
          driver_id?: string | null;
          id?: string;
          incident_type?: Database["public"]["Enums"]["incident_type"];
          job_id?: string | null;
          location?: string | null;
          occurred_at?: string;
          photo_urls?: string[] | null;
          reported_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["incident_severity"];
          status?: Database["public"]["Enums"]["incident_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "incidents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          alert_type: string;
          company_id: string;
          created_at: string;
          id: string;
          integration_id: string | null;
          metadata: Json;
          severity: string;
          title: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type: string;
          company_id: string;
          created_at?: string;
          id?: string;
          integration_id?: string | null;
          metadata?: Json;
          severity: string;
          title: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          integration_id?: string | null;
          metadata?: Json;
          severity?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_alerts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_alerts_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_api_catalogue: {
        Row: {
          authentication_type: string;
          company_id: string;
          created_at: string;
          deprecation_notice: string | null;
          documentation_url: string | null;
          endpoint: string;
          example_metadata: Json;
          exposure: string;
          id: string;
          name: string;
          owner_id: string | null;
          rate_limit_per_minute: number;
          status: string;
          version: string;
        };
        Insert: {
          authentication_type: string;
          company_id: string;
          created_at?: string;
          deprecation_notice?: string | null;
          documentation_url?: string | null;
          endpoint: string;
          example_metadata?: Json;
          exposure: string;
          id?: string;
          name: string;
          owner_id?: string | null;
          rate_limit_per_minute?: number;
          status?: string;
          version: string;
        };
        Update: {
          authentication_type?: string;
          company_id?: string;
          created_at?: string;
          deprecation_notice?: string | null;
          documentation_url?: string | null;
          endpoint?: string;
          example_metadata?: Json;
          exposure?: string;
          id?: string;
          name?: string;
          owner_id?: string | null;
          rate_limit_per_minute?: number;
          status?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_api_catalogue_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_api_keys: {
        Row: {
          company_id: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          owner_id: string;
          revoked_at: string | null;
          scopes: Json;
          secret_reference: string;
          status: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          owner_id: string;
          revoked_at?: string | null;
          scopes?: Json;
          secret_reference: string;
          status?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          owner_id?: string;
          revoked_at?: string | null;
          scopes?: Json;
          secret_reference?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_api_keys_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "integration_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_connections: {
        Row: {
          authentication_type: string;
          company_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          integration_id: string;
          last_attempt_at: string | null;
          last_successful_sync_at: string | null;
          oauth_metadata: Json;
          refresh_reference: string | null;
          secret_reference: string | null;
          service_account_reference: string | null;
          status: string;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          authentication_type: string;
          company_id: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          integration_id: string;
          last_attempt_at?: string | null;
          last_successful_sync_at?: string | null;
          oauth_metadata?: Json;
          refresh_reference?: string | null;
          secret_reference?: string | null;
          service_account_reference?: string | null;
          status?: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          authentication_type?: string;
          company_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          integration_id?: string;
          last_attempt_at?: string | null;
          last_successful_sync_at?: string | null;
          oauth_metadata?: Json;
          refresh_reference?: string | null;
          secret_reference?: string | null;
          service_account_reference?: string | null;
          status?: string;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_connections_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_connections_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_dead_letter_queue: {
        Row: {
          closed_at: string | null;
          company_id: string;
          created_at: string;
          id: string;
          integration_id: string | null;
          last_error: string;
          payload_metadata: Json;
          resolution: string | null;
          retry_history: Json;
          source_id: string;
          source_type: string;
        };
        Insert: {
          closed_at?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          integration_id?: string | null;
          last_error: string;
          payload_metadata?: Json;
          resolution?: string | null;
          retry_history?: Json;
          source_id: string;
          source_type: string;
        };
        Update: {
          closed_at?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          integration_id?: string | null;
          last_error?: string;
          payload_metadata?: Json;
          resolution?: string | null;
          retry_history?: Json;
          source_id?: string;
          source_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_dead_letter_queue_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_dead_letter_queue_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_event_bus: {
        Row: {
          aggregate_id: string;
          aggregate_type: string;
          company_id: string;
          event_type: string;
          id: string;
          occurred_at: string;
          payload_metadata: Json;
          source_module: string;
          version: number;
        };
        Insert: {
          aggregate_id: string;
          aggregate_type: string;
          company_id: string;
          event_type: string;
          id?: string;
          occurred_at?: string;
          payload_metadata?: Json;
          source_module: string;
          version?: number;
        };
        Update: {
          aggregate_id?: string;
          aggregate_type?: string;
          company_id?: string;
          event_type?: string;
          id?: string;
          occurred_at?: string;
          payload_metadata?: Json;
          source_module?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "integration_event_bus_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_export_jobs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          delivery_metadata: Json;
          domain: string;
          error_metadata: Json;
          format: string;
          id: string;
          integration_id: string | null;
          requested_by: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          delivery_metadata?: Json;
          domain: string;
          error_metadata?: Json;
          format: string;
          id?: string;
          integration_id?: string | null;
          requested_by?: string | null;
          status?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          delivery_metadata?: Json;
          domain?: string;
          error_metadata?: Json;
          format?: string;
          id?: string;
          integration_id?: string | null;
          requested_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_export_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_export_jobs_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_field_mappings: {
        Row: {
          active: boolean;
          company_id: string;
          default_value: string | null;
          destination_entity: string;
          destination_field: string;
          id: string;
          integration_id: string;
          required: boolean;
          source_entity: string;
          source_field: string | null;
          transform_type: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          default_value?: string | null;
          destination_entity: string;
          destination_field: string;
          id?: string;
          integration_id: string;
          required?: boolean;
          source_entity: string;
          source_field?: string | null;
          transform_type: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          default_value?: string | null;
          destination_entity?: string;
          destination_field?: string;
          id?: string;
          integration_id?: string;
          required?: boolean;
          source_entity?: string;
          source_field?: string | null;
          transform_type?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "integration_field_mappings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_field_mappings_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_health: {
        Row: {
          checked_at: string;
          company_id: string;
          detail_metadata: Json;
          health_area: string;
          id: string;
          integration_id: string;
          status: string;
        };
        Insert: {
          checked_at?: string;
          company_id: string;
          detail_metadata?: Json;
          health_area: string;
          id?: string;
          integration_id: string;
          status: string;
        };
        Update: {
          checked_at?: string;
          company_id?: string;
          detail_metadata?: Json;
          health_area?: string;
          id?: string;
          integration_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_health_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_health_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_import_jobs: {
        Row: {
          company_id: string;
          created_at: string;
          duplicate_count: number | null;
          duration_ms: number | null;
          entity_type: string;
          error_metadata: Json;
          format: string;
          id: string;
          imported_count: number | null;
          integration_id: string | null;
          requested_by: string | null;
          skipped_count: number | null;
          status: string;
          validation_metadata: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          duplicate_count?: number | null;
          duration_ms?: number | null;
          entity_type: string;
          error_metadata?: Json;
          format: string;
          id?: string;
          imported_count?: number | null;
          integration_id?: string | null;
          requested_by?: string | null;
          skipped_count?: number | null;
          status?: string;
          validation_metadata?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          duplicate_count?: number | null;
          duration_ms?: number | null;
          entity_type?: string;
          error_metadata?: Json;
          format?: string;
          id?: string;
          imported_count?: number | null;
          integration_id?: string | null;
          requested_by?: string | null;
          skipped_count?: number | null;
          status?: string;
          validation_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "integration_import_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_import_jobs_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_registry: {
        Row: {
          authentication_type: string;
          company_id: string;
          created_at: string;
          enabled: boolean;
          environment: string;
          id: string;
          integration_type: string;
          name: string;
          owner_id: string | null;
          status: string;
          updated_at: string;
          vendor: string;
          version: string;
        };
        Insert: {
          authentication_type: string;
          company_id: string;
          created_at?: string;
          enabled?: boolean;
          environment?: string;
          id?: string;
          integration_type: string;
          name: string;
          owner_id?: string | null;
          status?: string;
          updated_at?: string;
          vendor: string;
          version?: string;
        };
        Update: {
          authentication_type?: string;
          company_id?: string;
          created_at?: string;
          enabled?: boolean;
          environment?: string;
          id?: string;
          integration_type?: string;
          name?: string;
          owner_id?: string | null;
          status?: string;
          updated_at?: string;
          vendor?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_registry_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_retry_queue: {
        Row: {
          attempt: number;
          backoff_metadata: Json;
          company_id: string;
          created_at: string;
          id: string;
          integration_id: string | null;
          maximum_attempts: number;
          next_retry_at: string | null;
          reason: string;
          source_id: string;
          source_type: string;
          status: string;
          sync_job_id: string | null;
        };
        Insert: {
          attempt: number;
          backoff_metadata?: Json;
          company_id: string;
          created_at?: string;
          id?: string;
          integration_id?: string | null;
          maximum_attempts: number;
          next_retry_at?: string | null;
          reason: string;
          source_id: string;
          source_type: string;
          status?: string;
          sync_job_id?: string | null;
        };
        Update: {
          attempt?: number;
          backoff_metadata?: Json;
          company_id?: string;
          created_at?: string;
          id?: string;
          integration_id?: string | null;
          maximum_attempts?: number;
          next_retry_at?: string | null;
          reason?: string;
          source_id?: string;
          source_type?: string;
          status?: string;
          sync_job_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_retry_queue_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_retry_queue_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_retry_queue_sync_job_id_fkey";
            columns: ["sync_job_id"];
            isOneToOne: false;
            referencedRelation: "integration_sync_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_sync_jobs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          destination_name: string;
          duration_ms: number | null;
          error_metadata: Json;
          id: string;
          integration_id: string | null;
          records_processed: number | null;
          retry_count: number;
          source_name: string;
          started_at: string | null;
          status: string;
          trigger_type: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          destination_name: string;
          duration_ms?: number | null;
          error_metadata?: Json;
          id?: string;
          integration_id?: string | null;
          records_processed?: number | null;
          retry_count?: number;
          source_name: string;
          started_at?: string | null;
          status?: string;
          trigger_type: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          destination_name?: string;
          duration_ms?: number | null;
          error_metadata?: Json;
          id?: string;
          integration_id?: string | null;
          records_processed?: number | null;
          retry_count?: number;
          source_name?: string;
          started_at?: string | null;
          status?: string;
          trigger_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_sync_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_sync_jobs_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_webhook_deliveries: {
        Row: {
          attempt_count: number;
          company_id: string;
          created_at: string;
          delivered_at: string | null;
          event_type: string;
          id: string;
          last_error: string | null;
          payload_metadata: Json;
          status: string;
          webhook_id: string;
        };
        Insert: {
          attempt_count?: number;
          company_id: string;
          created_at?: string;
          delivered_at?: string | null;
          event_type: string;
          id?: string;
          last_error?: string | null;
          payload_metadata?: Json;
          status?: string;
          webhook_id: string;
        };
        Update: {
          attempt_count?: number;
          company_id?: string;
          created_at?: string;
          delivered_at?: string | null;
          event_type?: string;
          id?: string;
          last_error?: string | null;
          payload_metadata?: Json;
          status?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_webhook_deliveries_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_webhook_deliveries_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "integration_webhook_endpoints";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_webhook_endpoints: {
        Row: {
          company_id: string;
          created_at: string;
          direction: string;
          event_type: string;
          failure_reason: string | null;
          id: string;
          integration_id: string | null;
          last_delivery_at: string | null;
          retry_count: number;
          secret_reference: string | null;
          signature_metadata: Json;
          status: string;
          url: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          direction: string;
          event_type: string;
          failure_reason?: string | null;
          id?: string;
          integration_id?: string | null;
          last_delivery_at?: string | null;
          retry_count?: number;
          secret_reference?: string | null;
          signature_metadata?: Json;
          status?: string;
          url: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          direction?: string;
          event_type?: string;
          failure_reason?: string | null;
          id?: string;
          integration_id?: string | null;
          last_delivery_at?: string | null;
          retry_count?: number;
          secret_reference?: string | null;
          signature_metadata?: Json;
          status?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_webhook_endpoints_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_webhook_endpoints_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_categories: {
        Row: {
          company_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_categories_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_product_costs: {
        Row: {
          company_id: string;
          currency_code: string;
          product_id: string;
          unit_cost: number;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          currency_code?: string;
          product_id: string;
          unit_cost: number;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          currency_code?: string;
          product_id?: string;
          unit_cost?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_product_costs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_product_costs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "inventory_products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_products: {
        Row: {
          active: boolean;
          barcode: string;
          category_id: string | null;
          company_id: string;
          created_at: string;
          description: string | null;
          hazard_class: string | null;
          height_cm: number | null;
          id: string;
          is_dangerous_goods: boolean;
          length_cm: number | null;
          name: string;
          qr_payload: string;
          rfid_identifier: string | null;
          sku: string;
          temperature_max_c: number | null;
          temperature_min_c: number | null;
          unit_of_measure: string;
          updated_at: string;
          weight_kg: number;
          width_cm: number | null;
        };
        Insert: {
          active?: boolean;
          barcode: string;
          category_id?: string | null;
          company_id: string;
          created_at?: string;
          description?: string | null;
          hazard_class?: string | null;
          height_cm?: number | null;
          id?: string;
          is_dangerous_goods?: boolean;
          length_cm?: number | null;
          name: string;
          qr_payload: string;
          rfid_identifier?: string | null;
          sku: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          unit_of_measure?: string;
          updated_at?: string;
          weight_kg?: number;
          width_cm?: number | null;
        };
        Update: {
          active?: boolean;
          barcode?: string;
          category_id?: string | null;
          company_id?: string;
          created_at?: string;
          description?: string | null;
          hazard_class?: string | null;
          height_cm?: number | null;
          id?: string;
          is_dangerous_goods?: boolean;
          length_cm?: number | null;
          name?: string;
          qr_payload?: string;
          rfid_identifier?: string | null;
          sku?: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          unit_of_measure?: string;
          updated_at?: string;
          weight_kg?: number;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_products_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      job_events: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          event_type: string;
          id: string;
          job_id: string;
          message: string | null;
          metadata: Json | null;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          job_id: string;
          message?: string | null;
          metadata?: Json | null;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          job_id?: string;
          message?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "job_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_proofs: {
        Row: {
          company_id: string;
          completed_at: string;
          created_at: string;
          created_by: string | null;
          customer_visible: boolean;
          driver_id: string | null;
          finalized_at: string | null;
          id: string;
          job_id: string;
          notes: string | null;
          photo_url: string | null;
          recipient_name: string;
          signature_url: string | null;
        };
        Insert: {
          company_id: string;
          completed_at?: string;
          created_at?: string;
          created_by?: string | null;
          customer_visible?: boolean;
          driver_id?: string | null;
          finalized_at?: string | null;
          id?: string;
          job_id: string;
          notes?: string | null;
          photo_url?: string | null;
          recipient_name: string;
          signature_url?: string | null;
        };
        Update: {
          company_id?: string;
          completed_at?: string;
          created_at?: string;
          created_by?: string | null;
          customer_visible?: boolean;
          driver_id?: string | null;
          finalized_at?: string | null;
          id?: string;
          job_id?: string;
          notes?: string | null;
          photo_url?: string | null;
          recipient_name?: string;
          signature_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "job_proofs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_proofs_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_proofs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          accepted_at: string | null;
          arrived_at: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_branch_id: string | null;
          customer_id: string | null;
          description: string | null;
          driver_id: string | null;
          dropoff_location: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          pickup_location: string | null;
          priority: Database["public"]["Enums"]["job_priority"];
          proof_lat: number | null;
          proof_lng: number | null;
          proof_notes: string | null;
          proof_photo_url: string | null;
          proof_recipient_name: string | null;
          proof_signature_url: string | null;
          reference: string;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          arrived_at?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_branch_id?: string | null;
          customer_id?: string | null;
          description?: string | null;
          driver_id?: string | null;
          dropoff_location?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          pickup_location?: string | null;
          priority?: Database["public"]["Enums"]["job_priority"];
          proof_lat?: number | null;
          proof_lng?: number | null;
          proof_notes?: string | null;
          proof_photo_url?: string | null;
          proof_recipient_name?: string | null;
          proof_signature_url?: string | null;
          reference: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          arrived_at?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_branch_id?: string | null;
          customer_id?: string | null;
          description?: string | null;
          driver_id?: string | null;
          dropoff_location?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          pickup_location?: string | null;
          priority?: Database["public"]["Enums"]["job_priority"];
          proof_lat?: number | null;
          proof_lng?: number | null;
          proof_notes?: string | null;
          proof_photo_url?: string | null;
          proof_recipient_name?: string | null;
          proof_signature_url?: string | null;
          reference?: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_customer_branch_id_fkey";
            columns: ["customer_branch_id"];
            isOneToOne: false;
            referencedRelation: "customer_portal_branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance: {
        Row: {
          company_id: string;
          completed_at: string | null;
          cost: number | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_odometer: number | null;
          id: string;
          invoice_url: string | null;
          maintenance_type: Database["public"]["Enums"]["maintenance_type"];
          notes: string | null;
          scheduled_date: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["maintenance_status"];
          title: string;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_odometer?: number | null;
          id?: string;
          invoice_url?: string | null;
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"];
          notes?: string | null;
          scheduled_date?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["maintenance_status"];
          title: string;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_odometer?: number | null;
          id?: string;
          invoice_url?: string | null;
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"];
          notes?: string | null;
          scheduled_date?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["maintenance_status"];
          title?: string;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maintenance_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_risk_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_risk_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_devices: {
        Row: {
          app_version: string;
          biometric_enabled: boolean;
          company_id: string;
          created_at: string;
          device_identifier_hash: string;
          id: string;
          last_seen_at: string | null;
          nickname: string;
          platform: string;
          revoked_at: string | null;
          trusted: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          app_version: string;
          biometric_enabled?: boolean;
          company_id: string;
          created_at?: string;
          device_identifier_hash: string;
          id?: string;
          last_seen_at?: string | null;
          nickname: string;
          platform: string;
          revoked_at?: string | null;
          trusted?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          app_version?: string;
          biometric_enabled?: boolean;
          company_id?: string;
          created_at?: string;
          device_identifier_hash?: string;
          id?: string;
          last_seen_at?: string | null;
          nickname?: string;
          platform?: string;
          revoked_at?: string | null;
          trusted?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_devices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_notification_preferences: {
        Row: {
          background_allowed: boolean;
          category: string;
          company_id: string;
          device_id: string | null;
          enabled: boolean;
          id: string;
          production_provider_token: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          background_allowed?: boolean;
          category: string;
          company_id: string;
          device_id?: string | null;
          enabled?: boolean;
          id?: string;
          production_provider_token?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          background_allowed?: boolean;
          category?: string;
          company_id?: string;
          device_id?: string | null;
          enabled?: boolean;
          id?: string;
          production_provider_token?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_notification_preferences_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobile_notification_preferences_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "mobile_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_session_history: {
        Row: {
          company_id: string;
          device_id: string | null;
          event_type: string;
          id: string;
          metadata: Json;
          occurred_at: string;
          session_reference_hash: string | null;
          user_id: string;
        };
        Insert: {
          company_id: string;
          device_id?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          session_reference_hash?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string;
          device_id?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          session_reference_hash?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_session_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobile_session_history_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "mobile_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_sync_checkpoints: {
        Row: {
          company_id: string;
          cursor_value: string | null;
          device_id: string | null;
          id: string;
          scope: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          cursor_value?: string | null;
          device_id?: string | null;
          id?: string;
          scope: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          cursor_value?: string | null;
          device_id?: string | null;
          id?: string;
          scope?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_sync_checkpoints_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobile_sync_checkpoints_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "mobile_devices";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_sync_queue: {
        Row: {
          attempt: number;
          base_version: number | null;
          checksum: string;
          company_id: string;
          created_at: string;
          device_id: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          next_retry_at: string | null;
          operation: string;
          payload: Json;
          phase22_sync_run_id: string | null;
          state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempt?: number;
          base_version?: number | null;
          checksum: string;
          company_id: string;
          created_at?: string;
          device_id?: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          next_retry_at?: string | null;
          operation: string;
          payload: Json;
          phase22_sync_run_id?: string | null;
          state?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempt?: number;
          base_version?: number | null;
          checksum?: string;
          company_id?: string;
          created_at?: string;
          device_id?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          next_retry_at?: string | null;
          operation?: string;
          payload?: Json;
          phase22_sync_run_id?: string | null;
          state?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_sync_queue_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobile_sync_queue_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "mobile_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobile_sync_queue_phase22_sync_run_id_fkey";
            columns: ["phase22_sync_run_id"];
            isOneToOne: false;
            referencedRelation: "integration_sync_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_uploads: {
        Row: {
          byte_size: number;
          checksum: string;
          company_id: string;
          created_at: string;
          id: string;
          mime_type: string;
          queue_item_id: string | null;
          state: string;
          storage_path: string;
          updated_at: string;
          upload_offset: number;
          user_id: string;
        };
        Insert: {
          byte_size: number;
          checksum: string;
          company_id: string;
          created_at?: string;
          id?: string;
          mime_type: string;
          queue_item_id?: string | null;
          state?: string;
          storage_path: string;
          updated_at?: string;
          upload_offset?: number;
          user_id: string;
        };
        Update: {
          byte_size?: number;
          checksum?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          mime_type?: string;
          queue_item_id?: string | null;
          state?: string;
          storage_path?: string;
          updated_at?: string;
          upload_offset?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_uploads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mobile_uploads_queue_item_id_fkey";
            columns: ["queue_item_id"];
            isOneToOne: false;
            referencedRelation: "mobile_sync_queue";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          company_id: string;
          created_at: string;
          id: string;
          link_path: string | null;
          notification_type: Database["public"]["Enums"]["notification_type"];
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          link_path?: string | null;
          notification_type: Database["public"]["Enums"]["notification_type"];
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          link_path?: string | null;
          notification_type?: Database["public"]["Enums"]["notification_type"];
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_alert_events: {
        Row: {
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id: string | null;
          alert_id: string;
          company_id: string;
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json;
          new_escalation_level: Database["public"]["Enums"]["operational_escalation_level"] | null;
          new_status: Database["public"]["Enums"]["operational_alert_status"] | null;
          old_escalation_level: Database["public"]["Enums"]["operational_escalation_level"] | null;
          old_status: Database["public"]["Enums"]["operational_alert_status"] | null;
          reason: string | null;
        };
        Insert: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          alert_id: string;
          company_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          new_escalation_level?: Database["public"]["Enums"]["operational_escalation_level"] | null;
          new_status?: Database["public"]["Enums"]["operational_alert_status"] | null;
          old_escalation_level?: Database["public"]["Enums"]["operational_escalation_level"] | null;
          old_status?: Database["public"]["Enums"]["operational_alert_status"] | null;
          reason?: string | null;
        };
        Update: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id?: string | null;
          alert_id?: string;
          company_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          new_escalation_level?: Database["public"]["Enums"]["operational_escalation_level"] | null;
          new_status?: Database["public"]["Enums"]["operational_alert_status"] | null;
          old_escalation_level?: Database["public"]["Enums"]["operational_escalation_level"] | null;
          old_status?: Database["public"]["Enums"]["operational_alert_status"] | null;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "operational_alert_events_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "operational_alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_alert_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          acknowledgement_note: string | null;
          alert_type: string;
          company_id: string;
          created_at: string;
          dismissed_at: string | null;
          dismissed_by: string | null;
          escalated_at: string | null;
          escalated_by: string | null;
          escalation_level: Database["public"]["Enums"]["operational_escalation_level"];
          escalation_reason: string | null;
          id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          source_entity_id: string;
          source_entity_type: string;
          status: Database["public"]["Enums"]["operational_alert_status"];
          updated_at: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          acknowledgement_note?: string | null;
          alert_type: string;
          company_id: string;
          created_at?: string;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          escalated_at?: string | null;
          escalated_by?: string | null;
          escalation_level?: Database["public"]["Enums"]["operational_escalation_level"];
          escalation_reason?: string | null;
          id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          source_entity_id: string;
          source_entity_type: string;
          status?: Database["public"]["Enums"]["operational_alert_status"];
          updated_at?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          acknowledgement_note?: string | null;
          alert_type?: string;
          company_id?: string;
          created_at?: string;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          escalated_at?: string | null;
          escalated_by?: string | null;
          escalation_level?: Database["public"]["Enums"]["operational_escalation_level"];
          escalation_reason?: string | null;
          id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          source_entity_id?: string;
          source_entity_type?: string;
          status?: Database["public"]["Enums"]["operational_alert_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_alerts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_notes: {
        Row: {
          author_role: Database["public"]["Enums"]["app_role"];
          author_user_id: string;
          company_id: string;
          correction_of_note_id: string | null;
          created_at: string;
          id: string;
          linked_entity_id: string;
          linked_entity_type: string;
          note_text: string;
          visibility_level: string;
        };
        Insert: {
          author_role: Database["public"]["Enums"]["app_role"];
          author_user_id: string;
          company_id: string;
          correction_of_note_id?: string | null;
          created_at?: string;
          id?: string;
          linked_entity_id: string;
          linked_entity_type: string;
          note_text: string;
          visibility_level?: string;
        };
        Update: {
          author_role?: Database["public"]["Enums"]["app_role"];
          author_user_id?: string;
          company_id?: string;
          correction_of_note_id?: string | null;
          created_at?: string;
          id?: string;
          linked_entity_id?: string;
          linked_entity_type?: string;
          note_text?: string;
          visibility_level?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operational_notes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_notes_correction_of_note_id_fkey";
            columns: ["correction_of_note_id"];
            isOneToOne: false;
            referencedRelation: "operational_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      operational_timeline_events: {
        Row: {
          company_id: string;
          created_at: string;
          driver_id: string | null;
          event_type: string;
          id: string;
          job_id: string | null;
          label: string;
          metadata: Json;
          occurred_at: string;
          severity: string;
          source: string;
          tracking_session_id: string | null;
          vehicle_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          driver_id?: string | null;
          event_type: string;
          id?: string;
          job_id?: string | null;
          label: string;
          metadata?: Json;
          occurred_at: string;
          severity?: string;
          source: string;
          tracking_session_id?: string | null;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          driver_id?: string | null;
          event_type?: string;
          id?: string;
          job_id?: string | null;
          label?: string;
          metadata?: Json;
          occurred_at?: string;
          severity?: string;
          source?: string;
          tracking_session_id?: string | null;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "operational_timeline_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_timeline_events_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_timeline_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_timeline_events_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_timeline_events_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      operations_intelligence_benchmarks: {
        Row: {
          benchmark_type: string;
          company_id: string;
          confidence: string;
          created_at: string;
          evidence_references: Json;
          id: string;
          metric_code: string;
          percentile: number | null;
          period_end: string;
          period_start: string;
          rank: number | null;
          scope_id: string;
          value: number | null;
        };
        Insert: {
          benchmark_type: string;
          company_id: string;
          confidence: string;
          created_at?: string;
          evidence_references?: Json;
          id?: string;
          metric_code: string;
          percentile?: number | null;
          period_end: string;
          period_start: string;
          rank?: number | null;
          scope_id: string;
          value?: number | null;
        };
        Update: {
          benchmark_type?: string;
          company_id?: string;
          confidence?: string;
          created_at?: string;
          evidence_references?: Json;
          id?: string;
          metric_code?: string;
          percentile?: number | null;
          period_end?: string;
          period_start?: string;
          rank?: number | null;
          scope_id?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "operations_intelligence_benchmarks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operations_intelligence_bottlenecks: {
        Row: {
          bottleneck_type: string;
          company_id: string;
          detected_at: string;
          evidence_references: Json;
          explanation: string;
          id: string;
          owner_id: string | null;
          recommended_review: string | null;
          resolved_at: string | null;
          scope_id: string | null;
          scope_type: string;
          severity: string;
          status: string;
        };
        Insert: {
          bottleneck_type: string;
          company_id: string;
          detected_at?: string;
          evidence_references?: Json;
          explanation: string;
          id?: string;
          owner_id?: string | null;
          recommended_review?: string | null;
          resolved_at?: string | null;
          scope_id?: string | null;
          scope_type: string;
          severity: string;
          status?: string;
        };
        Update: {
          bottleneck_type?: string;
          company_id?: string;
          detected_at?: string;
          evidence_references?: Json;
          explanation?: string;
          id?: string;
          owner_id?: string | null;
          recommended_review?: string | null;
          resolved_at?: string | null;
          scope_id?: string | null;
          scope_type?: string;
          severity?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operations_intelligence_bottlenecks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operations_intelligence_briefings: {
        Row: {
          briefing_type: string;
          company_id: string;
          confidence: string;
          created_at: string;
          evidence_references: Json;
          id: string;
          period_end: string;
          period_start: string;
          prepared_by: string | null;
          published_at: string | null;
          reviewed_by: string | null;
          sections: Json;
          status: string;
        };
        Insert: {
          briefing_type: string;
          company_id: string;
          confidence: string;
          created_at?: string;
          evidence_references?: Json;
          id?: string;
          period_end: string;
          period_start: string;
          prepared_by?: string | null;
          published_at?: string | null;
          reviewed_by?: string | null;
          sections?: Json;
          status?: string;
        };
        Update: {
          briefing_type?: string;
          company_id?: string;
          confidence?: string;
          created_at?: string;
          evidence_references?: Json;
          id?: string;
          period_end?: string;
          period_start?: string;
          prepared_by?: string | null;
          published_at?: string | null;
          reviewed_by?: string | null;
          sections?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operations_intelligence_briefings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operations_intelligence_forecasts: {
        Row: {
          assumptions: Json;
          company_id: string;
          confidence: string;
          created_at: string;
          evidence_references: Json;
          explanation: string;
          forecast_type: string;
          id: string;
          missing_data: Json;
          period_end: string;
          period_start: string;
          predicted_value: number | null;
          scope_id: string | null;
          scope_type: string;
        };
        Insert: {
          assumptions?: Json;
          company_id: string;
          confidence: string;
          created_at?: string;
          evidence_references?: Json;
          explanation: string;
          forecast_type: string;
          id?: string;
          missing_data?: Json;
          period_end: string;
          period_start: string;
          predicted_value?: number | null;
          scope_id?: string | null;
          scope_type: string;
        };
        Update: {
          assumptions?: Json;
          company_id?: string;
          confidence?: string;
          created_at?: string;
          evidence_references?: Json;
          explanation?: string;
          forecast_type?: string;
          id?: string;
          missing_data?: Json;
          period_end?: string;
          period_start?: string;
          predicted_value?: number | null;
          scope_id?: string | null;
          scope_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operations_intelligence_forecasts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operations_intelligence_observations: {
        Row: {
          bi_snapshot_ids: string[];
          company_id: string;
          confidence: string;
          created_at: string;
          explanation: string;
          id: string;
          metric_code: string;
          non_causal: boolean;
          observation_type: string;
          observed_at: string;
          observed_value: number | null;
          scope_id: string | null;
          scope_type: string;
          source_references: Json;
        };
        Insert: {
          bi_snapshot_ids?: string[];
          company_id: string;
          confidence: string;
          created_at?: string;
          explanation: string;
          id?: string;
          metric_code: string;
          non_causal?: boolean;
          observation_type: string;
          observed_at: string;
          observed_value?: number | null;
          scope_id?: string | null;
          scope_type: string;
          source_references?: Json;
        };
        Update: {
          bi_snapshot_ids?: string[];
          company_id?: string;
          confidence?: string;
          created_at?: string;
          explanation?: string;
          id?: string;
          metric_code?: string;
          non_causal?: boolean;
          observation_type?: string;
          observed_at?: string;
          observed_value?: number | null;
          scope_id?: string | null;
          scope_type?: string;
          source_references?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "operations_intelligence_observations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      operations_intelligence_simulations: {
        Row: {
          advisory_only: boolean;
          affected_kpi_codes: string[];
          assumptions: Json;
          company_id: string;
          confidence: string;
          created_at: string;
          estimated_impact: Json;
          evidence_references: Json;
          id: string;
          input_metadata: Json;
          requested_by: string | null;
          scenario_type: string;
        };
        Insert: {
          advisory_only?: boolean;
          affected_kpi_codes?: string[];
          assumptions?: Json;
          company_id: string;
          confidence: string;
          created_at?: string;
          estimated_impact?: Json;
          evidence_references?: Json;
          id?: string;
          input_metadata: Json;
          requested_by?: string | null;
          scenario_type: string;
        };
        Update: {
          advisory_only?: boolean;
          affected_kpi_codes?: string[];
          assumptions?: Json;
          company_id?: string;
          confidence?: string;
          created_at?: string;
          estimated_impact?: Json;
          evidence_references?: Json;
          id?: string;
          input_metadata?: Json;
          requested_by?: string | null;
          scenario_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operations_intelligence_simulations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      platform_billing_plans: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          plan_code: string;
          pricing_metadata: Json;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          plan_code: string;
          pricing_metadata?: Json;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          plan_code?: string;
          pricing_metadata?: Json;
          status?: string;
        };
        Relationships: [];
      };
      platform_billing_statements: {
        Row: {
          company_id: string;
          created_at: string;
          external_invoice_reference: string | null;
          id: string;
          line_metadata: Json;
          period_end: string;
          period_start: string;
          status: string;
          subscription_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          external_invoice_reference?: string | null;
          id?: string;
          line_metadata?: Json;
          period_end: string;
          period_start: string;
          status?: string;
          subscription_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          external_invoice_reference?: string | null;
          id?: string;
          line_metadata?: Json;
          period_end?: string;
          period_start?: string;
          status?: string;
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_billing_statements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_billing_statements_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "platform_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_bom_revisions: {
        Row: {
          approved_by: string | null;
          components_redacted: Json;
          created_at: string;
          id: string;
          product_code: string;
          revision: string;
          status: string;
        };
        Insert: {
          approved_by?: string | null;
          components_redacted?: Json;
          created_at?: string;
          id?: string;
          product_code: string;
          revision: string;
          status?: string;
        };
        Update: {
          approved_by?: string | null;
          components_redacted?: Json;
          created_at?: string;
          id?: string;
          product_code?: string;
          revision?: string;
          status?: string;
        };
        Relationships: [];
      };
      platform_device_commands: {
        Row: {
          command_type: string;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          device_id: string;
          id: string;
          requested_by: string | null;
          result_metadata: Json;
          status: string;
        };
        Insert: {
          command_type: string;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          device_id: string;
          id?: string;
          requested_by?: string | null;
          result_metadata?: Json;
          status?: string;
        };
        Update: {
          command_type?: string;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          device_id?: string;
          id?: string;
          requested_by?: string | null;
          result_metadata?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_device_commands_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_device_configurations: {
        Row: {
          applied_at: string | null;
          approved_by: string | null;
          company_id: string;
          configuration_redacted: Json;
          created_at: string;
          device_id: string;
          id: string;
          status: string;
          version: number;
        };
        Insert: {
          applied_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          configuration_redacted?: Json;
          created_at?: string;
          device_id: string;
          id?: string;
          status?: string;
          version: number;
        };
        Update: {
          applied_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          configuration_redacted?: Json;
          created_at?: string;
          device_id?: string;
          id?: string;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "platform_device_configurations_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_device_credentials: {
        Row: {
          company_id: string;
          created_at: string;
          credential_type: string;
          device_id: string;
          expires_at: string | null;
          id: string;
          secret_reference: string;
          status: string;
          token_hash: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          credential_type: string;
          device_id: string;
          expires_at?: string | null;
          id?: string;
          secret_reference: string;
          status?: string;
          token_hash?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          credential_type?: string;
          device_id?: string;
          expires_at?: string | null;
          id?: string;
          secret_reference?: string;
          status?: string;
          token_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_device_credentials_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_device_group_memberships: {
        Row: {
          company_id: string;
          created_at: string;
          device_id: string;
          group_id: string;
          id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          device_id: string;
          group_id: string;
          id?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          device_id?: string;
          group_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_device_group_memberships_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "platform_device_group_memberships_company_id_group_id_fkey";
            columns: ["company_id", "group_id"];
            isOneToOne: false;
            referencedRelation: "platform_device_groups";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_device_groups: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          purpose: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          purpose: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          purpose?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_device_groups_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_device_health_snapshots: {
        Row: {
          battery_percent: number | null;
          company_id: string;
          connectivity_percent: number | null;
          device_id: string;
          diagnostics_redacted: Json;
          health_score: number | null;
          health_state: string;
          id: string;
          observed_at: string;
        };
        Insert: {
          battery_percent?: number | null;
          company_id: string;
          connectivity_percent?: number | null;
          device_id: string;
          diagnostics_redacted?: Json;
          health_score?: number | null;
          health_state: string;
          id?: string;
          observed_at: string;
        };
        Update: {
          battery_percent?: number | null;
          company_id?: string;
          connectivity_percent?: number | null;
          device_id?: string;
          diagnostics_redacted?: Json;
          health_score?: number | null;
          health_state?: string;
          id?: string;
          observed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_device_health_snapshots_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_device_models: {
        Row: {
          capabilities: Json;
          created_at: string;
          device_kind: string;
          hardware_revision: string;
          id: string;
          manufacturer: string;
          model_code: string;
          status: string;
        };
        Insert: {
          capabilities?: Json;
          created_at?: string;
          device_kind: string;
          hardware_revision: string;
          id?: string;
          manufacturer: string;
          model_code: string;
          status?: string;
        };
        Update: {
          capabilities?: Json;
          created_at?: string;
          device_kind?: string;
          hardware_revision?: string;
          id?: string;
          manufacturer?: string;
          model_code?: string;
          status?: string;
        };
        Relationships: [];
      };
      platform_devices: {
        Row: {
          activated_at: string | null;
          assigned_asset_id: string | null;
          assigned_asset_type: string | null;
          certificate_reference: string | null;
          company_id: string;
          created_at: string;
          device_kind: string;
          device_model_id: string;
          id: string;
          identity_public_key_reference: string | null;
          installed_at: string | null;
          last_seen_at: string | null;
          serial_number: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          assigned_asset_id?: string | null;
          assigned_asset_type?: string | null;
          certificate_reference?: string | null;
          company_id: string;
          created_at?: string;
          device_kind: string;
          device_model_id: string;
          id?: string;
          identity_public_key_reference?: string | null;
          installed_at?: string | null;
          last_seen_at?: string | null;
          serial_number: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          assigned_asset_id?: string | null;
          assigned_asset_type?: string | null;
          certificate_reference?: string | null;
          company_id?: string;
          created_at?: string;
          device_kind?: string;
          device_model_id?: string;
          id?: string;
          identity_public_key_reference?: string | null;
          installed_at?: string | null;
          last_seen_at?: string | null;
          serial_number?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_devices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_devices_device_model_id_fkey";
            columns: ["device_model_id"];
            isOneToOne: false;
            referencedRelation: "platform_device_models";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_digital_twins: {
        Row: {
          asset_id: string | null;
          company_id: string;
          configuration_redacted: Json;
          created_at: string;
          device_id: string | null;
          firmware_version: string | null;
          health_state: string;
          id: string;
          last_telemetry_at: string | null;
          predicted_maintenance_advisory: Json;
          state_redacted: Json;
          twin_type: string;
          updated_at: string;
        };
        Insert: {
          asset_id?: string | null;
          company_id: string;
          configuration_redacted?: Json;
          created_at?: string;
          device_id?: string | null;
          firmware_version?: string | null;
          health_state?: string;
          id?: string;
          last_telemetry_at?: string | null;
          predicted_maintenance_advisory?: Json;
          state_redacted?: Json;
          twin_type: string;
          updated_at?: string;
        };
        Update: {
          asset_id?: string | null;
          company_id?: string;
          configuration_redacted?: Json;
          created_at?: string;
          device_id?: string | null;
          firmware_version?: string | null;
          health_state?: string;
          id?: string;
          last_telemetry_at?: string | null;
          predicted_maintenance_advisory?: Json;
          state_redacted?: Json;
          twin_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_digital_twins_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "platform_digital_twins_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_edge_profiles: {
        Row: {
          approved_by: string | null;
          company_id: string;
          compression_policy: string;
          created_at: string;
          device_model_id: string | null;
          id: string;
          local_rules_redacted: Json;
          profile_name: string;
          status: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          compression_policy?: string;
          created_at?: string;
          device_model_id?: string | null;
          id?: string;
          local_rules_redacted?: Json;
          profile_name: string;
          status?: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          compression_policy?: string;
          created_at?: string;
          device_model_id?: string | null;
          id?: string;
          local_rules_redacted?: Json;
          profile_name?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_edge_profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_edge_profiles_device_model_id_fkey";
            columns: ["device_model_id"];
            isOneToOne: false;
            referencedRelation: "platform_device_models";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_edge_sync_states: {
        Row: {
          buffered_event_count: number;
          cached_recommendations_redacted: Json;
          company_id: string;
          device_id: string;
          edge_profile_id: string | null;
          id: string;
          last_sync_at: string | null;
          status: string;
        };
        Insert: {
          buffered_event_count?: number;
          cached_recommendations_redacted?: Json;
          company_id: string;
          device_id: string;
          edge_profile_id?: string | null;
          id?: string;
          last_sync_at?: string | null;
          status?: string;
        };
        Update: {
          buffered_event_count?: number;
          cached_recommendations_redacted?: Json;
          company_id?: string;
          device_id?: string;
          edge_profile_id?: string | null;
          id?: string;
          last_sync_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_edge_sync_states_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: true;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "platform_edge_sync_states_edge_profile_id_fkey";
            columns: ["edge_profile_id"];
            isOneToOne: false;
            referencedRelation: "platform_edge_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_feature_licenses: {
        Row: {
          approved_by: string | null;
          company_id: string;
          created_at: string;
          expires_at: string | null;
          feature_code: string;
          id: string;
          limits_metadata: Json;
          starts_at: string | null;
          status: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          expires_at?: string | null;
          feature_code: string;
          id?: string;
          limits_metadata?: Json;
          starts_at?: string | null;
          status?: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          expires_at?: string | null;
          feature_code?: string;
          id?: string;
          limits_metadata?: Json;
          starts_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_feature_licenses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_firmware_releases: {
        Row: {
          approved_by: string | null;
          artifact_reference: string;
          created_at: string;
          device_model_id: string;
          id: string;
          owner_id: string | null;
          release_notes_redacted: string | null;
          reviewer_id: string | null;
          signature_reference: string;
          status: string;
          version: string;
        };
        Insert: {
          approved_by?: string | null;
          artifact_reference: string;
          created_at?: string;
          device_model_id: string;
          id?: string;
          owner_id?: string | null;
          release_notes_redacted?: string | null;
          reviewer_id?: string | null;
          signature_reference: string;
          status?: string;
          version: string;
        };
        Update: {
          approved_by?: string | null;
          artifact_reference?: string;
          created_at?: string;
          device_model_id?: string;
          id?: string;
          owner_id?: string | null;
          release_notes_redacted?: string | null;
          reviewer_id?: string | null;
          signature_reference?: string;
          status?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_firmware_releases_device_model_id_fkey";
            columns: ["device_model_id"];
            isOneToOne: false;
            referencedRelation: "platform_device_models";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_firmware_rollouts: {
        Row: {
          approved_by: string | null;
          company_id: string;
          created_at: string;
          firmware_release_id: string;
          id: string;
          rollout_metadata: Json;
          scheduled_at: string | null;
          status: string;
          target_group_id: string | null;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          firmware_release_id: string;
          id?: string;
          rollout_metadata?: Json;
          scheduled_at?: string | null;
          status?: string;
          target_group_id?: string | null;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          firmware_release_id?: string;
          id?: string;
          rollout_metadata?: Json;
          scheduled_at?: string | null;
          status?: string;
          target_group_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_firmware_rollouts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_firmware_rollouts_firmware_release_id_fkey";
            columns: ["firmware_release_id"];
            isOneToOne: false;
            referencedRelation: "platform_firmware_releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_firmware_rollouts_target_group_id_fkey";
            columns: ["target_group_id"];
            isOneToOne: false;
            referencedRelation: "platform_device_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_manufactured_units: {
        Row: {
          created_at: string;
          device_id: string | null;
          id: string;
          manufacturing_batch_id: string;
          qa_status: string;
          serial_number: string;
          warranty_expires_at: string | null;
        };
        Insert: {
          created_at?: string;
          device_id?: string | null;
          id?: string;
          manufacturing_batch_id: string;
          qa_status?: string;
          serial_number: string;
          warranty_expires_at?: string | null;
        };
        Update: {
          created_at?: string;
          device_id?: string | null;
          id?: string;
          manufacturing_batch_id?: string;
          qa_status?: string;
          serial_number?: string;
          warranty_expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_manufactured_units_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_manufactured_units_manufacturing_batch_id_fkey";
            columns: ["manufacturing_batch_id"];
            isOneToOne: false;
            referencedRelation: "platform_manufacturing_batches";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_manufacturing_batches: {
        Row: {
          batch_code: string;
          bom_revision_id: string | null;
          created_at: string;
          id: string;
          pcb_revision_id: string | null;
          product_code: string;
          quantity_passed: number;
          quantity_planned: number;
          status: string;
        };
        Insert: {
          batch_code: string;
          bom_revision_id?: string | null;
          created_at?: string;
          id?: string;
          pcb_revision_id?: string | null;
          product_code: string;
          quantity_passed?: number;
          quantity_planned: number;
          status?: string;
        };
        Update: {
          batch_code?: string;
          bom_revision_id?: string | null;
          created_at?: string;
          id?: string;
          pcb_revision_id?: string | null;
          product_code?: string;
          quantity_passed?: number;
          quantity_planned?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_manufacturing_batches_bom_revision_id_fkey";
            columns: ["bom_revision_id"];
            isOneToOne: false;
            referencedRelation: "platform_bom_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_manufacturing_batches_pcb_revision_id_fkey";
            columns: ["pcb_revision_id"];
            isOneToOne: false;
            referencedRelation: "platform_pcb_revisions";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_marketplace_plugins: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          manifest_reference: string;
          name: string;
          plugin_code: string;
          publisher: string;
          status: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          manifest_reference: string;
          name: string;
          plugin_code: string;
          publisher: string;
          status?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          manifest_reference?: string;
          name?: string;
          plugin_code?: string;
          publisher?: string;
          status?: string;
        };
        Relationships: [];
      };
      platform_mobile_app_releases: {
        Row: {
          app_code: string;
          artifact_reference: string | null;
          created_at: string;
          id: string;
          platform: string;
          status: string;
          version: string;
        };
        Insert: {
          app_code: string;
          artifact_reference?: string | null;
          created_at?: string;
          id?: string;
          platform: string;
          status?: string;
          version: string;
        };
        Update: {
          app_code?: string;
          artifact_reference?: string | null;
          created_at?: string;
          id?: string;
          platform?: string;
          status?: string;
          version?: string;
        };
        Relationships: [];
      };
      platform_mobile_installations: {
        Row: {
          app_release_id: string | null;
          company_id: string;
          created_at: string;
          device_platform: string;
          id: string;
          installation_token_hash: string;
          last_sync_at: string | null;
          offline_sync_state: string;
          push_token_reference: string | null;
          user_id: string;
        };
        Insert: {
          app_release_id?: string | null;
          company_id: string;
          created_at?: string;
          device_platform: string;
          id?: string;
          installation_token_hash: string;
          last_sync_at?: string | null;
          offline_sync_state?: string;
          push_token_reference?: string | null;
          user_id: string;
        };
        Update: {
          app_release_id?: string | null;
          company_id?: string;
          created_at?: string;
          device_platform?: string;
          id?: string;
          installation_token_hash?: string;
          last_sync_at?: string | null;
          offline_sync_state?: string;
          push_token_reference?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_mobile_installations_app_release_id_fkey";
            columns: ["app_release_id"];
            isOneToOne: false;
            referencedRelation: "platform_mobile_app_releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_mobile_installations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_mobile_sync_envelopes: {
        Row: {
          company_id: string;
          conflict_metadata: Json;
          created_at: string;
          direction: string;
          id: string;
          installation_id: string;
          payload_hash: string;
          status: string;
        };
        Insert: {
          company_id: string;
          conflict_metadata?: Json;
          created_at?: string;
          direction: string;
          id?: string;
          installation_id: string;
          payload_hash: string;
          status?: string;
        };
        Update: {
          company_id?: string;
          conflict_metadata?: Json;
          created_at?: string;
          direction?: string;
          id?: string;
          installation_id?: string;
          payload_hash?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_mobile_sync_envelopes_company_id_installation_id_fkey";
            columns: ["company_id", "installation_id"];
            isOneToOne: false;
            referencedRelation: "platform_mobile_installations";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_partner_applications: {
        Row: {
          allowed_scopes: Json;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          oauth_client_reference: string | null;
          owner_id: string | null;
          partner_name: string;
          rate_limit_per_minute: number;
          status: string;
        };
        Insert: {
          allowed_scopes?: Json;
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          oauth_client_reference?: string | null;
          owner_id?: string | null;
          partner_name: string;
          rate_limit_per_minute?: number;
          status?: string;
        };
        Update: {
          allowed_scopes?: Json;
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          oauth_client_reference?: string | null;
          owner_id?: string | null;
          partner_name?: string;
          rate_limit_per_minute?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_partner_applications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_partner_subscriptions: {
        Row: {
          company_id: string;
          created_at: string;
          event_type: string;
          id: string;
          partner_application_id: string;
          status: string;
          webhook_reference: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          partner_application_id: string;
          status?: string;
          webhook_reference: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          partner_application_id?: string;
          status?: string;
          webhook_reference?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_partner_subscription_company_id_partner_applicati_fkey";
            columns: ["company_id", "partner_application_id"];
            isOneToOne: false;
            referencedRelation: "platform_partner_applications";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_pcb_revisions: {
        Row: {
          created_at: string;
          design_reference: string;
          id: string;
          product_code: string;
          revision: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          design_reference: string;
          id?: string;
          product_code: string;
          revision: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          design_reference?: string;
          id?: string;
          product_code?: string;
          revision?: string;
          status?: string;
        };
        Relationships: [];
      };
      platform_pilot_feedback: {
        Row: {
          company_id: string;
          created_at: string;
          feedback_type: string;
          id: string;
          note_redacted: string | null;
          pilot_project_id: string;
          sentiment: string;
          submitted_by: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          feedback_type: string;
          id?: string;
          note_redacted?: string | null;
          pilot_project_id: string;
          sentiment: string;
          submitted_by?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          feedback_type?: string;
          id?: string;
          note_redacted?: string | null;
          pilot_project_id?: string;
          sentiment?: string;
          submitted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_pilot_feedback_company_id_pilot_project_id_fkey";
            columns: ["company_id", "pilot_project_id"];
            isOneToOne: false;
            referencedRelation: "platform_pilot_projects";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_pilot_installations: {
        Row: {
          acceptance_metadata: Json;
          accepted_at: string | null;
          company_id: string;
          device_id: string;
          id: string;
          installed_at: string | null;
          pilot_project_id: string;
          status: string;
          technician_id: string | null;
        };
        Insert: {
          acceptance_metadata?: Json;
          accepted_at?: string | null;
          company_id: string;
          device_id: string;
          id?: string;
          installed_at?: string | null;
          pilot_project_id: string;
          status?: string;
          technician_id?: string | null;
        };
        Update: {
          acceptance_metadata?: Json;
          accepted_at?: string | null;
          company_id?: string;
          device_id?: string;
          id?: string;
          installed_at?: string | null;
          pilot_project_id?: string;
          status?: string;
          technician_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_pilot_installations_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "platform_pilot_installations_company_id_pilot_project_id_fkey";
            columns: ["company_id", "pilot_project_id"];
            isOneToOne: false;
            referencedRelation: "platform_pilot_projects";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_pilot_projects: {
        Row: {
          company_id: string;
          created_at: string;
          customer_onboarding_metadata: Json;
          id: string;
          name: string;
          owner_id: string | null;
          status: string;
          success_metrics: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          customer_onboarding_metadata?: Json;
          id?: string;
          name: string;
          owner_id?: string | null;
          status?: string;
          success_metrics?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          customer_onboarding_metadata?: Json;
          id?: string;
          name?: string;
          owner_id?: string | null;
          status?: string;
          success_metrics?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "platform_pilot_projects_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_plugin_installations: {
        Row: {
          approved_by: string | null;
          company_id: string;
          configuration_redacted: Json;
          created_at: string;
          id: string;
          plugin_id: string;
          status: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          configuration_redacted?: Json;
          created_at?: string;
          id?: string;
          plugin_id: string;
          status?: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          configuration_redacted?: Json;
          created_at?: string;
          id?: string;
          plugin_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_plugin_installations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_plugin_installations_plugin_id_fkey";
            columns: ["plugin_id"];
            isOneToOne: false;
            referencedRelation: "platform_marketplace_plugins";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_rma_cases: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          manufactured_unit_id: string;
          reason_redacted: string;
          status: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          manufactured_unit_id: string;
          reason_redacted: string;
          status?: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          manufactured_unit_id?: string;
          reason_redacted?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_rma_cases_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_rma_cases_manufactured_unit_id_fkey";
            columns: ["manufactured_unit_id"];
            isOneToOne: false;
            referencedRelation: "platform_manufactured_units";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_subscriptions: {
        Row: {
          billing_plan_id: string;
          company_id: string;
          discount_metadata: Json;
          ended_at: string | null;
          id: string;
          partner_revenue_metadata: Json;
          started_at: string;
          status: string;
          trial_ends_at: string | null;
        };
        Insert: {
          billing_plan_id: string;
          company_id: string;
          discount_metadata?: Json;
          ended_at?: string | null;
          id?: string;
          partner_revenue_metadata?: Json;
          started_at?: string;
          status?: string;
          trial_ends_at?: string | null;
        };
        Update: {
          billing_plan_id?: string;
          company_id?: string;
          discount_metadata?: Json;
          ended_at?: string | null;
          id?: string;
          partner_revenue_metadata?: Json;
          started_at?: string;
          status?: string;
          trial_ends_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_subscriptions_billing_plan_id_fkey";
            columns: ["billing_plan_id"];
            isOneToOne: false;
            referencedRelation: "platform_billing_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_subscriptions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_telemetry_events: {
        Row: {
          company_id: string;
          compression_type: string | null;
          delta: boolean;
          device_id: string;
          event_id: string;
          id: string;
          observed_at: string;
          offline_buffered: boolean;
          payload_redacted: Json;
          processing_state: string;
          received_at: string;
          rejection_reason: string | null;
          schema_version: number;
          sequence_number: number;
          transport: string;
        };
        Insert: {
          company_id: string;
          compression_type?: string | null;
          delta?: boolean;
          device_id: string;
          event_id: string;
          id?: string;
          observed_at: string;
          offline_buffered?: boolean;
          payload_redacted?: Json;
          processing_state?: string;
          received_at?: string;
          rejection_reason?: string | null;
          schema_version: number;
          sequence_number: number;
          transport: string;
        };
        Update: {
          company_id?: string;
          compression_type?: string | null;
          delta?: boolean;
          device_id?: string;
          event_id?: string;
          id?: string;
          observed_at?: string;
          offline_buffered?: boolean;
          payload_redacted?: Json;
          processing_state?: string;
          received_at?: string;
          rejection_reason?: string | null;
          schema_version?: number;
          sequence_number?: number;
          transport?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_telemetry_events_company_id_device_id_fkey";
            columns: ["company_id", "device_id"];
            isOneToOne: false;
            referencedRelation: "platform_devices";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_tenant_settings: {
        Row: {
          branding_metadata: Json;
          company_id: string;
          created_at: string;
          data_residency_region: string;
          id: string;
          region_code: string;
          tenant_status: string;
          updated_at: string;
        };
        Insert: {
          branding_metadata?: Json;
          company_id: string;
          created_at?: string;
          data_residency_region?: string;
          id?: string;
          region_code?: string;
          tenant_status?: string;
          updated_at?: string;
        };
        Update: {
          branding_metadata?: Json;
          company_id?: string;
          created_at?: string;
          data_residency_region?: string;
          id?: string;
          region_code?: string;
          tenant_status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_tenant_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_twin_relationships: {
        Row: {
          company_id: string;
          created_at: string;
          from_twin_id: string;
          id: string;
          relationship_type: string;
          to_twin_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          from_twin_id: string;
          id?: string;
          relationship_type: string;
          to_twin_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          from_twin_id?: string;
          id?: string;
          relationship_type?: string;
          to_twin_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_twin_relationships_company_id_from_twin_id_fkey";
            columns: ["company_id", "from_twin_id"];
            isOneToOne: false;
            referencedRelation: "platform_digital_twins";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "platform_twin_relationships_company_id_to_twin_id_fkey";
            columns: ["company_id", "to_twin_id"];
            isOneToOne: false;
            referencedRelation: "platform_digital_twins";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_twin_state_history: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          observed_at: string;
          source_telemetry_id: string | null;
          state_redacted: Json;
          twin_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          observed_at: string;
          source_telemetry_id?: string | null;
          state_redacted?: Json;
          twin_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          observed_at?: string;
          source_telemetry_id?: string | null;
          state_redacted?: Json;
          twin_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_twin_state_history_company_id_source_telemetry_id_fkey";
            columns: ["company_id", "source_telemetry_id"];
            isOneToOne: false;
            referencedRelation: "platform_telemetry_events";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "platform_twin_state_history_company_id_twin_id_fkey";
            columns: ["company_id", "twin_id"];
            isOneToOne: false;
            referencedRelation: "platform_digital_twins";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      platform_usage_meters: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          meter_code: string;
          period_end: string;
          period_start: string;
          quantity: number;
          source_reference: string | null;
          unit: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          meter_code: string;
          period_end: string;
          period_start: string;
          quantity?: number;
          source_reference?: string | null;
          unit: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          meter_code?: string;
          period_end?: string;
          period_start?: string;
          quantity?: number;
          source_reference?: string | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_usage_meters_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_approvals: {
        Row: {
          approval_stage: string;
          approver_id: string | null;
          company_id: string;
          decided_at: string;
          decision: string;
          entity_id: string;
          entity_type: string;
          id: string;
          reason: string | null;
        };
        Insert: {
          approval_stage: string;
          approver_id?: string | null;
          company_id: string;
          decided_at?: string;
          decision: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          reason?: string | null;
        };
        Update: {
          approval_stage?: string;
          approver_id?: string | null;
          company_id?: string;
          decided_at?: string;
          decision?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proc_approvals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "proc_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_purchase_orders: {
        Row: {
          company_id: string;
          created_at: string;
          currency_code: string;
          document_id: string | null;
          id: string;
          items: Json;
          order_number: string;
          ordered_at: string | null;
          request_id: string | null;
          required_date: string | null;
          status: Database["public"]["Enums"]["proc_order_status"];
          supplier_id: string;
          total_amount: number;
          updated_at: string;
          vehicle_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          currency_code?: string;
          document_id?: string | null;
          id?: string;
          items?: Json;
          order_number: string;
          ordered_at?: string | null;
          request_id?: string | null;
          required_date?: string | null;
          status?: Database["public"]["Enums"]["proc_order_status"];
          supplier_id: string;
          total_amount?: number;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          currency_code?: string;
          document_id?: string | null;
          id?: string;
          items?: Json;
          order_number?: string;
          ordered_at?: string | null;
          request_id?: string | null;
          required_date?: string | null;
          status?: Database["public"]["Enums"]["proc_order_status"];
          supplier_id?: string;
          total_amount?: number;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proc_purchase_orders_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_purchase_orders_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_purchase_orders_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "proc_purchase_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_purchase_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "proc_suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_purchase_orders_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_purchase_requests: {
        Row: {
          attachments_metadata: Json;
          company_id: string;
          cost_centre_id: string | null;
          created_at: string;
          department_id: string | null;
          estimated_cost: number;
          id: string;
          items: Json;
          justification: string;
          priority: string;
          requester_id: string | null;
          required_date: string | null;
          status: Database["public"]["Enums"]["proc_request_status"];
          updated_at: string;
        };
        Insert: {
          attachments_metadata?: Json;
          company_id: string;
          cost_centre_id?: string | null;
          created_at?: string;
          department_id?: string | null;
          estimated_cost?: number;
          id?: string;
          items?: Json;
          justification: string;
          priority?: string;
          requester_id?: string | null;
          required_date?: string | null;
          status?: Database["public"]["Enums"]["proc_request_status"];
          updated_at?: string;
        };
        Update: {
          attachments_metadata?: Json;
          company_id?: string;
          cost_centre_id?: string | null;
          created_at?: string;
          department_id?: string | null;
          estimated_cost?: number;
          id?: string;
          items?: Json;
          justification?: string;
          priority?: string;
          requester_id?: string | null;
          required_date?: string | null;
          status?: Database["public"]["Enums"]["proc_request_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proc_purchase_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_receipts: {
        Row: {
          backorder_items: Json;
          company_id: string;
          damaged_items: Json;
          id: string;
          purchase_order_id: string;
          receipt_number: string;
          received_at: string;
          received_by: string | null;
          received_items: Json;
          receiving_note_document_id: string | null;
          rejected_items: Json;
          warehouse_id: string | null;
        };
        Insert: {
          backorder_items?: Json;
          company_id: string;
          damaged_items?: Json;
          id?: string;
          purchase_order_id: string;
          receipt_number: string;
          received_at?: string;
          received_by?: string | null;
          received_items?: Json;
          receiving_note_document_id?: string | null;
          rejected_items?: Json;
          warehouse_id?: string | null;
        };
        Update: {
          backorder_items?: Json;
          company_id?: string;
          damaged_items?: Json;
          id?: string;
          purchase_order_id?: string;
          receipt_number?: string;
          received_at?: string;
          received_by?: string | null;
          received_items?: Json;
          receiving_note_document_id?: string | null;
          rejected_items?: Json;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proc_receipts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_receipts_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "proc_purchase_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_receipts_receiving_note_document_id_fkey";
            columns: ["receiving_note_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_supplier_compliance: {
        Row: {
          company_id: string;
          compliance_type: string;
          created_at: string;
          document_id: string | null;
          expires_on: string | null;
          id: string;
          metadata: Json;
          status: string;
          supplier_id: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          compliance_type: string;
          created_at?: string;
          document_id?: string | null;
          expires_on?: string | null;
          id?: string;
          metadata?: Json;
          status?: string;
          supplier_id: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          compliance_type?: string;
          created_at?: string;
          document_id?: string | null;
          expires_on?: string | null;
          id?: string;
          metadata?: Json;
          status?: string;
          supplier_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proc_supplier_compliance_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_compliance_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_compliance_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "proc_suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_supplier_contracts: {
        Row: {
          company_id: string;
          created_at: string;
          document_id: string | null;
          expires_on: string | null;
          id: string;
          preferred_pricing: Json;
          starts_on: string | null;
          status: string;
          supplier_id: string;
          title: string;
          updated_at: string;
          volume_discounts: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          document_id?: string | null;
          expires_on?: string | null;
          id?: string;
          preferred_pricing?: Json;
          starts_on?: string | null;
          status?: string;
          supplier_id: string;
          title: string;
          updated_at?: string;
          volume_discounts?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          document_id?: string | null;
          expires_on?: string | null;
          id?: string;
          preferred_pricing?: Json;
          starts_on?: string | null;
          status?: string;
          supplier_id?: string;
          title?: string;
          updated_at?: string;
          volume_discounts?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "proc_supplier_contracts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_contracts_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_contracts_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "proc_suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_supplier_invoices: {
        Row: {
          amount: number;
          company_id: string;
          created_at: string;
          document_id: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string;
          metadata: Json;
          purchase_order_id: string | null;
          status: string;
          supplier_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          company_id: string;
          created_at?: string;
          document_id?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          metadata?: Json;
          purchase_order_id?: string | null;
          status?: string;
          supplier_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          company_id?: string;
          created_at?: string;
          document_id?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          metadata?: Json;
          purchase_order_id?: string | null;
          status?: string;
          supplier_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proc_supplier_invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_invoices_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_invoices_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "proc_purchase_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proc_supplier_invoices_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "proc_suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      proc_suppliers: {
        Row: {
          banking_metadata: Json;
          branches: Json;
          company_id: string;
          contacts: Json;
          created_at: string;
          currency_code: string;
          id: string;
          name: string;
          payment_terms: string | null;
          preferred: boolean;
          rating: number | null;
          registration_number: string | null;
          status: Database["public"]["Enums"]["proc_supplier_status"];
          supplier_type: string;
          tax_metadata: Json;
          updated_at: string;
        };
        Insert: {
          banking_metadata?: Json;
          branches?: Json;
          company_id: string;
          contacts?: Json;
          created_at?: string;
          currency_code?: string;
          id?: string;
          name: string;
          payment_terms?: string | null;
          preferred?: boolean;
          rating?: number | null;
          registration_number?: string | null;
          status?: Database["public"]["Enums"]["proc_supplier_status"];
          supplier_type: string;
          tax_metadata?: Json;
          updated_at?: string;
        };
        Update: {
          banking_metadata?: Json;
          branches?: Json;
          company_id?: string;
          contacts?: Json;
          created_at?: string;
          currency_code?: string;
          id?: string;
          name?: string;
          payment_terms?: string | null;
          preferred?: boolean;
          rating?: number | null;
          registration_number?: string | null;
          status?: Database["public"]["Enums"]["proc_supplier_status"];
          supplier_type?: string;
          tax_metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proc_suppliers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          active_company_id: string | null;
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          active_company_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          active_company_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      provider_observation_cache: {
        Row: {
          cache_key: string;
          company_id: string | null;
          confidence: string;
          created_at: string;
          expires_at: string;
          geographic_cell: string;
          id: string;
          normalized_payload: Json;
          observed_at: string | null;
          provider_name: string;
          provider_type: Database["public"]["Enums"]["provider_observation_type"];
          raw_payload: Json | null;
          retrieved_at: string;
          source: string;
          updated_at: string;
        };
        Insert: {
          cache_key: string;
          company_id?: string | null;
          confidence?: string;
          created_at?: string;
          expires_at: string;
          geographic_cell: string;
          id?: string;
          normalized_payload: Json;
          observed_at?: string | null;
          provider_name: string;
          provider_type: Database["public"]["Enums"]["provider_observation_type"];
          raw_payload?: Json | null;
          retrieved_at?: string;
          source: string;
          updated_at?: string;
        };
        Update: {
          cache_key?: string;
          company_id?: string | null;
          confidence?: string;
          created_at?: string;
          expires_at?: string;
          geographic_cell?: string;
          id?: string;
          normalized_payload?: Json;
          observed_at?: string | null;
          provider_name?: string;
          provider_type?: Database["public"]["Enums"]["provider_observation_type"];
          raw_payload?: Json | null;
          retrieved_at?: string;
          source?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_observation_cache_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_audit_logs: {
        Row: {
          actor_id: string;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          safe_metadata: Json;
        };
        Insert: {
          actor_id?: string;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          safe_metadata?: Json;
        };
        Update: {
          actor_id?: string;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          safe_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_backup_policies: {
        Row: {
          asset_type: string;
          company_id: string;
          encryption_expectation: string;
          environment: string;
          failure_reason_redacted: string | null;
          frequency_seconds: number;
          id: string;
          last_successful_backup_at: string | null;
          location_metadata: Json;
          next_backup_at: string | null;
          owner_id: string;
          retention_seconds: number;
          verification_status: string;
        };
        Insert: {
          asset_type: string;
          company_id: string;
          encryption_expectation: string;
          environment: string;
          failure_reason_redacted?: string | null;
          frequency_seconds: number;
          id?: string;
          last_successful_backup_at?: string | null;
          location_metadata?: Json;
          next_backup_at?: string | null;
          owner_id: string;
          retention_seconds: number;
          verification_status?: string;
        };
        Update: {
          asset_type?: string;
          company_id?: string;
          encryption_expectation?: string;
          environment?: string;
          failure_reason_redacted?: string | null;
          frequency_seconds?: number;
          id?: string;
          last_successful_backup_at?: string | null;
          location_metadata?: Json;
          next_backup_at?: string | null;
          owner_id?: string;
          retention_seconds?: number;
          verification_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_backup_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_backup_records: {
        Row: {
          backup_id: string;
          company_id: string;
          completed_at: string | null;
          environment: string;
          evidence: Json;
          failure_reason_redacted: string | null;
          id: string;
          policy_id: string;
          provider_reference: string | null;
          retention_expires_at: string | null;
          size_bytes: number | null;
          source: string;
          started_at: string;
          status: string;
          verification: string;
        };
        Insert: {
          backup_id: string;
          company_id: string;
          completed_at?: string | null;
          environment: string;
          evidence?: Json;
          failure_reason_redacted?: string | null;
          id?: string;
          policy_id: string;
          provider_reference?: string | null;
          retention_expires_at?: string | null;
          size_bytes?: number | null;
          source: string;
          started_at: string;
          status: string;
          verification?: string;
        };
        Update: {
          backup_id?: string;
          company_id?: string;
          completed_at?: string | null;
          environment?: string;
          evidence?: Json;
          failure_reason_redacted?: string | null;
          id?: string;
          policy_id?: string;
          provider_reference?: string | null;
          retention_expires_at?: string | null;
          size_bytes?: number | null;
          source?: string;
          started_at?: string;
          status?: string;
          verification?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_backup_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_backup_records_policy_id_fkey";
            columns: ["policy_id"];
            isOneToOne: false;
            referencedRelation: "reliability_backup_policies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_capacity_snapshots: {
        Row: {
          assumptions: Json;
          company_id: string;
          confidence: string;
          cost_classification: string | null;
          cost_value: number | null;
          environment: string;
          forecast_threshold_at: string | null;
          id: string;
          metric: string;
          missing_data: Json;
          monthly_growth: number | null;
          recorded_at: string;
          source: string;
          threshold: number | null;
          unit: string;
          value: number;
        };
        Insert: {
          assumptions?: Json;
          company_id: string;
          confidence: string;
          cost_classification?: string | null;
          cost_value?: number | null;
          environment: string;
          forecast_threshold_at?: string | null;
          id?: string;
          metric: string;
          missing_data?: Json;
          monthly_growth?: number | null;
          recorded_at?: string;
          source: string;
          threshold?: number | null;
          unit: string;
          value: number;
        };
        Update: {
          assumptions?: Json;
          company_id?: string;
          confidence?: string;
          cost_classification?: string | null;
          cost_value?: number | null;
          environment?: string;
          forecast_threshold_at?: string | null;
          id?: string;
          metric?: string;
          missing_data?: Json;
          monthly_growth?: number | null;
          recorded_at?: string;
          source?: string;
          threshold?: number | null;
          unit?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_capacity_snapshots_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_deployments: {
        Row: {
          company_id: string;
          completed_at: string | null;
          environment: string;
          evidence: Json;
          id: string;
          platform_deployment_id: string | null;
          release_id: string;
          requested_by: string;
          rollback_plan: Json;
          started_at: string | null;
          state: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          environment: string;
          evidence?: Json;
          id?: string;
          platform_deployment_id?: string | null;
          release_id: string;
          requested_by?: string;
          rollback_plan?: Json;
          started_at?: string | null;
          state: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          environment?: string;
          evidence?: Json;
          id?: string;
          platform_deployment_id?: string | null;
          release_id?: string;
          requested_by?: string;
          rollback_plan?: Json;
          started_at?: string | null;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_deployments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_deployments_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "reliability_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_dr_plans: {
        Row: {
          actual_loss_window_seconds: number | null;
          actual_recovery_seconds: number | null;
          communication: string;
          company_id: string;
          containment: string;
          detection: string;
          environment: string;
          escalation: string;
          id: string;
          last_tested_at: string | null;
          next_review_at: string | null;
          owner_id: string;
          recovery: string;
          rpo_seconds: number;
          rto_seconds: number;
          runbook_id: string | null;
          scenario: string;
          status: string;
          validation: string;
        };
        Insert: {
          actual_loss_window_seconds?: number | null;
          actual_recovery_seconds?: number | null;
          communication: string;
          company_id: string;
          containment: string;
          detection: string;
          environment: string;
          escalation: string;
          id?: string;
          last_tested_at?: string | null;
          next_review_at?: string | null;
          owner_id: string;
          recovery: string;
          rpo_seconds: number;
          rto_seconds: number;
          runbook_id?: string | null;
          scenario: string;
          status?: string;
          validation: string;
        };
        Update: {
          actual_loss_window_seconds?: number | null;
          actual_recovery_seconds?: number | null;
          communication?: string;
          company_id?: string;
          containment?: string;
          detection?: string;
          environment?: string;
          escalation?: string;
          id?: string;
          last_tested_at?: string | null;
          next_review_at?: string | null;
          owner_id?: string;
          recovery?: string;
          rpo_seconds?: number;
          rto_seconds?: number;
          runbook_id?: string | null;
          scenario?: string;
          status?: string;
          validation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_dr_plans_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_dr_runbook_fk";
            columns: ["runbook_id"];
            isOneToOne: false;
            referencedRelation: "reliability_runbooks";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_error_events: {
        Row: {
          company_id: string;
          correlation_id: string | null;
          error_group_id: string;
          id: string;
          occurred_at: string;
          safe_metadata: Json;
          source_type: string;
        };
        Insert: {
          company_id: string;
          correlation_id?: string | null;
          error_group_id: string;
          id?: string;
          occurred_at?: string;
          safe_metadata?: Json;
          source_type: string;
        };
        Update: {
          company_id?: string;
          correlation_id?: string | null;
          error_group_id?: string;
          id?: string;
          occurred_at?: string;
          safe_metadata?: Json;
          source_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_error_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_error_events_error_group_id_fkey";
            columns: ["error_group_id"];
            isOneToOne: false;
            referencedRelation: "reliability_error_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_error_groups: {
        Row: {
          affected_company_count: number;
          affected_user_count: number;
          company_id: string;
          environment: string;
          fingerprint: string;
          first_seen: string;
          id: string;
          last_seen: string;
          occurrence_count: number;
          owner_id: string | null;
          redacted_stack: string | null;
          related_incident_id: string | null;
          resolution: string | null;
          route_operation: string | null;
          service_id: string | null;
          severity: string;
          status: string;
          version: string | null;
        };
        Insert: {
          affected_company_count?: number;
          affected_user_count?: number;
          company_id: string;
          environment: string;
          fingerprint: string;
          first_seen: string;
          id?: string;
          last_seen: string;
          occurrence_count?: number;
          owner_id?: string | null;
          redacted_stack?: string | null;
          related_incident_id?: string | null;
          resolution?: string | null;
          route_operation?: string | null;
          service_id?: string | null;
          severity: string;
          status?: string;
          version?: string | null;
        };
        Update: {
          affected_company_count?: number;
          affected_user_count?: number;
          company_id?: string;
          environment?: string;
          fingerprint?: string;
          first_seen?: string;
          id?: string;
          last_seen?: string;
          occurrence_count?: number;
          owner_id?: string | null;
          redacted_stack?: string | null;
          related_incident_id?: string | null;
          resolution?: string | null;
          route_operation?: string | null;
          service_id?: string | null;
          severity?: string;
          status?: string;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_error_groups_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_error_groups_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "reliability_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_error_incident_fk";
            columns: ["related_incident_id"];
            isOneToOne: false;
            referencedRelation: "reliability_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_feature_flags: {
        Row: {
          approval_id: string | null;
          company_id: string;
          company_scope: string[];
          created_at: string;
          enabled: boolean;
          ends_at: string | null;
          environment: string;
          id: string;
          key: string;
          kill_switch: boolean;
          owner_id: string;
          reason: string;
          role_scope: string[];
          rollout_percentage: number;
          rollout_stage: string;
          server_enforced: boolean;
          starts_at: string | null;
        };
        Insert: {
          approval_id?: string | null;
          company_id: string;
          company_scope?: string[];
          created_at?: string;
          enabled?: boolean;
          ends_at?: string | null;
          environment: string;
          id?: string;
          key: string;
          kill_switch?: boolean;
          owner_id: string;
          reason: string;
          role_scope?: string[];
          rollout_percentage?: number;
          rollout_stage?: string;
          server_enforced?: boolean;
          starts_at?: string | null;
        };
        Update: {
          approval_id?: string | null;
          company_id?: string;
          company_scope?: string[];
          created_at?: string;
          enabled?: boolean;
          ends_at?: string | null;
          environment?: string;
          id?: string;
          key?: string;
          kill_switch?: boolean;
          owner_id?: string;
          reason?: string;
          role_scope?: string[];
          rollout_percentage?: number;
          rollout_stage?: string;
          server_enforced?: boolean;
          starts_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_feature_flags_approval_id_fkey";
            columns: ["approval_id"];
            isOneToOne: false;
            referencedRelation: "reliability_release_approvals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_feature_flags_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_health_checks: {
        Row: {
          check_type: string;
          checked_at: string;
          company_id: string;
          confidence: number | null;
          created_at: string;
          expected_next_at: string | null;
          failure_reason_redacted: string | null;
          id: string;
          last_successful_at: string | null;
          scope_metadata: Json;
          service_id: string;
          source_authority: string;
          source_record_id: string | null;
          state: string;
        };
        Insert: {
          check_type: string;
          checked_at: string;
          company_id: string;
          confidence?: number | null;
          created_at?: string;
          expected_next_at?: string | null;
          failure_reason_redacted?: string | null;
          id?: string;
          last_successful_at?: string | null;
          scope_metadata?: Json;
          service_id: string;
          source_authority: string;
          source_record_id?: string | null;
          state: string;
        };
        Update: {
          check_type?: string;
          checked_at?: string;
          company_id?: string;
          confidence?: number | null;
          created_at?: string;
          expected_next_at?: string | null;
          failure_reason_redacted?: string | null;
          id?: string;
          last_successful_at?: string | null;
          scope_metadata?: Json;
          service_id?: string;
          source_authority?: string;
          source_record_id?: string | null;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_health_checks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_health_checks_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "reliability_services";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_incident_timeline: {
        Row: {
          actor_id: string;
          company_id: string;
          event_type: string;
          id: string;
          incident_id: string;
          occurred_at: string;
          safe_evidence: Json;
          summary: string;
        };
        Insert: {
          actor_id?: string;
          company_id: string;
          event_type: string;
          id?: string;
          incident_id: string;
          occurred_at?: string;
          safe_evidence?: Json;
          summary: string;
        };
        Update: {
          actor_id?: string;
          company_id?: string;
          event_type?: string;
          id?: string;
          incident_id?: string;
          occurred_at?: string;
          safe_evidence?: Json;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_incident_timeline_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_incident_timeline_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "reliability_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_incidents: {
        Row: {
          affected_customer_count: number;
          affected_service_ids: string[];
          closed_at: string | null;
          closed_by: string | null;
          commander_id: string | null;
          company_id: string;
          customer_communication_state: string;
          declared_at: string;
          declared_by: string;
          detection_source: string;
          id: string;
          mitigation: string | null;
          resolution: string | null;
          resolved_at: string | null;
          responder_ids: string[];
          root_cause: string | null;
          severity: string;
          status: string;
          title: string;
        };
        Insert: {
          affected_customer_count?: number;
          affected_service_ids?: string[];
          closed_at?: string | null;
          closed_by?: string | null;
          commander_id?: string | null;
          company_id: string;
          customer_communication_state?: string;
          declared_at?: string;
          declared_by?: string;
          detection_source: string;
          id?: string;
          mitigation?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          responder_ids?: string[];
          root_cause?: string | null;
          severity: string;
          status?: string;
          title: string;
        };
        Update: {
          affected_customer_count?: number;
          affected_service_ids?: string[];
          closed_at?: string | null;
          closed_by?: string | null;
          commander_id?: string | null;
          company_id?: string;
          customer_communication_state?: string;
          declared_at?: string;
          declared_by?: string;
          detection_source?: string;
          id?: string;
          mitigation?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          responder_ids?: string[];
          root_cause?: string | null;
          severity?: string;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_incidents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_maintenance_windows: {
        Row: {
          affected_service_ids: string[];
          approval_id: string | null;
          company_id: string;
          completed_at: string | null;
          customer_delivery_state: string;
          customer_visibility: boolean;
          expected_impact: string;
          id: string;
          internal_notification_id: string | null;
          owner_id: string;
          planned_end: string;
          planned_start: string;
          status: string;
        };
        Insert: {
          affected_service_ids?: string[];
          approval_id?: string | null;
          company_id: string;
          completed_at?: string | null;
          customer_delivery_state?: string;
          customer_visibility?: boolean;
          expected_impact: string;
          id?: string;
          internal_notification_id?: string | null;
          owner_id: string;
          planned_end: string;
          planned_start: string;
          status?: string;
        };
        Update: {
          affected_service_ids?: string[];
          approval_id?: string | null;
          company_id?: string;
          completed_at?: string | null;
          customer_delivery_state?: string;
          customer_visibility?: boolean;
          expected_impact?: string;
          id?: string;
          internal_notification_id?: string | null;
          owner_id?: string;
          planned_end?: string;
          planned_start?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_maintenance_windows_approval_id_fkey";
            columns: ["approval_id"];
            isOneToOne: false;
            referencedRelation: "reliability_release_approvals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_maintenance_windows_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_performance_samples: {
        Row: {
          company_id: string;
          duration_ms: number | null;
          environment: string;
          error_count: number;
          id: string;
          metric: string;
          period_end: string;
          period_start: string;
          safe_dimensions: Json;
          sample_count: number;
          service_id: string | null;
          source_authority: string;
          timeout_count: number;
          value: number | null;
        };
        Insert: {
          company_id: string;
          duration_ms?: number | null;
          environment: string;
          error_count?: number;
          id?: string;
          metric: string;
          period_end: string;
          period_start: string;
          safe_dimensions?: Json;
          sample_count?: number;
          service_id?: string | null;
          source_authority: string;
          timeout_count?: number;
          value?: number | null;
        };
        Update: {
          company_id?: string;
          duration_ms?: number | null;
          environment?: string;
          error_count?: number;
          id?: string;
          metric?: string;
          period_end?: string;
          period_start?: string;
          safe_dimensions?: Json;
          sample_count?: number;
          service_id?: string | null;
          source_authority?: string;
          timeout_count?: number;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_performance_samples_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_performance_samples_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "reliability_services";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_post_incident_reviews: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          corrective_actions: Json;
          created_at: string;
          id: string;
          incident_id: string;
          review: Json;
          status: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          corrective_actions?: Json;
          created_at?: string;
          id?: string;
          incident_id: string;
          review?: Json;
          status?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          corrective_actions?: Json;
          created_at?: string;
          id?: string;
          incident_id?: string;
          review?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_post_incident_reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_post_incident_reviews_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: true;
            referencedRelation: "reliability_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_readiness_reviews: {
        Row: {
          checklist: Json;
          company_id: string;
          conditions: string | null;
          decided_at: string;
          decided_by: string;
          id: string;
          known_risks: Json;
          release_id: string | null;
          result: string;
        };
        Insert: {
          checklist?: Json;
          company_id: string;
          conditions?: string | null;
          decided_at?: string;
          decided_by: string;
          id?: string;
          known_risks?: Json;
          release_id?: string | null;
          result: string;
        };
        Update: {
          checklist?: Json;
          company_id?: string;
          conditions?: string | null;
          decided_at?: string;
          decided_by?: string;
          id?: string;
          known_risks?: Json;
          release_id?: string | null;
          result?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_readiness_reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_readiness_reviews_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "reliability_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_release_approvals: {
        Row: {
          approval_type: string;
          approver_id: string | null;
          company_id: string;
          conditions: string | null;
          decided_at: string | null;
          decision: string;
          deployment_id: string | null;
          evidence: Json;
          id: string;
          release_id: string | null;
          requester_id: string;
          risk: string;
        };
        Insert: {
          approval_type: string;
          approver_id?: string | null;
          company_id: string;
          conditions?: string | null;
          decided_at?: string | null;
          decision?: string;
          deployment_id?: string | null;
          evidence?: Json;
          id?: string;
          release_id?: string | null;
          requester_id: string;
          risk: string;
        };
        Update: {
          approval_type?: string;
          approver_id?: string | null;
          company_id?: string;
          conditions?: string | null;
          decided_at?: string | null;
          decision?: string;
          deployment_id?: string | null;
          evidence?: Json;
          id?: string;
          release_id?: string | null;
          requester_id?: string;
          risk?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_release_approvals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_release_approvals_deployment_id_fkey";
            columns: ["deployment_id"];
            isOneToOne: false;
            referencedRelation: "reliability_deployments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_release_approvals_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "reliability_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_releases: {
        Row: {
          build_evidence: Json;
          commit_sha: string;
          company_id: string;
          created_at: string;
          created_by: string;
          environment: string;
          feature_flag_ids: string[];
          id: string;
          known_risks: Json;
          migration_set: string[];
          release_notes: string | null;
          rollback_target: string | null;
          state: string;
          test_evidence: Json;
          validated_at: string | null;
          version: string;
        };
        Insert: {
          build_evidence?: Json;
          commit_sha: string;
          company_id: string;
          created_at?: string;
          created_by?: string;
          environment: string;
          feature_flag_ids?: string[];
          id?: string;
          known_risks?: Json;
          migration_set?: string[];
          release_notes?: string | null;
          rollback_target?: string | null;
          state?: string;
          test_evidence?: Json;
          validated_at?: string | null;
          version: string;
        };
        Update: {
          build_evidence?: Json;
          commit_sha?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          environment?: string;
          feature_flag_ids?: string[];
          id?: string;
          known_risks?: Json;
          migration_set?: string[];
          release_notes?: string | null;
          rollback_target?: string | null;
          state?: string;
          test_evidence?: Json;
          validated_at?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_releases_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_restore_tests: {
        Row: {
          auth_validation: boolean | null;
          authorised_by: string;
          backup_record_id: string;
          company_id: string;
          completed_at: string | null;
          data_integrity: boolean | null;
          evidence: Json;
          id: string;
          migration_parity: boolean | null;
          outcome: string;
          rls_validation: boolean | null;
          smoke_tests: boolean | null;
          started_at: string | null;
          storage_validation: boolean | null;
          target_environment: string;
        };
        Insert: {
          auth_validation?: boolean | null;
          authorised_by: string;
          backup_record_id: string;
          company_id: string;
          completed_at?: string | null;
          data_integrity?: boolean | null;
          evidence?: Json;
          id?: string;
          migration_parity?: boolean | null;
          outcome?: string;
          rls_validation?: boolean | null;
          smoke_tests?: boolean | null;
          started_at?: string | null;
          storage_validation?: boolean | null;
          target_environment: string;
        };
        Update: {
          auth_validation?: boolean | null;
          authorised_by?: string;
          backup_record_id?: string;
          company_id?: string;
          completed_at?: string | null;
          data_integrity?: boolean | null;
          evidence?: Json;
          id?: string;
          migration_parity?: boolean | null;
          outcome?: string;
          rls_validation?: boolean | null;
          smoke_tests?: boolean | null;
          started_at?: string | null;
          storage_validation?: boolean | null;
          target_environment?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_restore_tests_backup_record_id_fkey";
            columns: ["backup_record_id"];
            isOneToOne: false;
            referencedRelation: "reliability_backup_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_restore_tests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_runbooks: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          code: string;
          company_id: string;
          content: Json;
          created_at: string;
          id: string;
          lifecycle: string;
          owner_id: string;
          title: string;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          code: string;
          company_id: string;
          content?: Json;
          created_at?: string;
          id?: string;
          lifecycle?: string;
          owner_id: string;
          title: string;
          version: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          code?: string;
          company_id?: string;
          content?: Json;
          created_at?: string;
          id?: string;
          lifecycle?: string;
          owner_id?: string;
          title?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_runbooks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_service_dependencies: {
        Row: {
          company_id: string;
          critical: boolean;
          dependency_service_id: string;
          id: string;
          service_id: string;
        };
        Insert: {
          company_id: string;
          critical?: boolean;
          dependency_service_id: string;
          id?: string;
          service_id: string;
        };
        Update: {
          company_id?: string;
          critical?: boolean;
          dependency_service_id?: string;
          id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_service_dependencies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_service_dependencies_dependency_service_id_fkey";
            columns: ["dependency_service_id"];
            isOneToOne: false;
            referencedRelation: "reliability_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_service_dependencies_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "reliability_services";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_services: {
        Row: {
          company_id: string;
          created_at: string;
          criticality: string;
          customer_visibility: string;
          deployment_id: string | null;
          environment: string;
          health_endpoint_metadata: Json;
          id: string;
          monitoring_state: string;
          name: string;
          owner_id: string | null;
          recovery_objectives: Json;
          region: string | null;
          runbook_id: string | null;
          service_type: string;
          support_contact_metadata: Json;
          version: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          criticality: string;
          customer_visibility?: string;
          deployment_id?: string | null;
          environment: string;
          health_endpoint_metadata?: Json;
          id?: string;
          monitoring_state?: string;
          name: string;
          owner_id?: string | null;
          recovery_objectives?: Json;
          region?: string | null;
          runbook_id?: string | null;
          service_type: string;
          support_contact_metadata?: Json;
          version?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          criticality?: string;
          customer_visibility?: string;
          deployment_id?: string | null;
          environment?: string;
          health_endpoint_metadata?: Json;
          id?: string;
          monitoring_state?: string;
          name?: string;
          owner_id?: string | null;
          recovery_objectives?: Json;
          region?: string | null;
          runbook_id?: string | null;
          service_type?: string;
          support_contact_metadata?: Json;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_service_runbook_fk";
            columns: ["runbook_id"];
            isOneToOne: false;
            referencedRelation: "reliability_runbooks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_services_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_slo_definitions: {
        Row: {
          active: boolean;
          company_id: string;
          contractual: boolean;
          customer_impact: string | null;
          id: string;
          indicator: string;
          measurement_source: string;
          name: string;
          owner_id: string | null;
          review_frequency: string;
          service_id: string;
          severity: string;
          target: number;
          window_seconds: number;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          contractual?: boolean;
          customer_impact?: string | null;
          id?: string;
          indicator: string;
          measurement_source: string;
          name: string;
          owner_id?: string | null;
          review_frequency: string;
          service_id: string;
          severity: string;
          target: number;
          window_seconds: number;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          contractual?: boolean;
          customer_impact?: string | null;
          id?: string;
          indicator?: string;
          measurement_source?: string;
          name?: string;
          owner_id?: string | null;
          review_frequency?: string;
          service_id?: string;
          severity?: string;
          target?: number;
          window_seconds?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_slo_definitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_slo_definitions_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "reliability_services";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_slo_measurements: {
        Row: {
          allowed_failures: number | null;
          burn_rate: number | null;
          calculated_at: string;
          company_id: string;
          consumed_budget: number | null;
          good_events: number | null;
          id: string;
          period_end: string;
          period_start: string;
          remaining_budget: number | null;
          slo_id: string;
          source_record_ids: string[];
          status: string;
          total_events: number | null;
        };
        Insert: {
          allowed_failures?: number | null;
          burn_rate?: number | null;
          calculated_at?: string;
          company_id: string;
          consumed_budget?: number | null;
          good_events?: number | null;
          id?: string;
          period_end: string;
          period_start: string;
          remaining_budget?: number | null;
          slo_id: string;
          source_record_ids?: string[];
          status: string;
          total_events?: number | null;
        };
        Update: {
          allowed_failures?: number | null;
          burn_rate?: number | null;
          calculated_at?: string;
          company_id?: string;
          consumed_budget?: number | null;
          good_events?: number | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          remaining_budget?: number | null;
          slo_id?: string;
          source_record_ids?: string[];
          status?: string;
          total_events?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reliability_slo_measurements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_slo_measurements_slo_id_fkey";
            columns: ["slo_id"];
            isOneToOne: false;
            referencedRelation: "reliability_slo_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_status_updates: {
        Row: {
          affected_capability: string;
          audience: string;
          company_id: string;
          description_redacted: string;
          id: string;
          incident_id: string | null;
          published_at: string;
          published_by: string;
          resolution_state: string;
          service_state: string;
          source_record_ids: string[];
        };
        Insert: {
          affected_capability: string;
          audience: string;
          company_id: string;
          description_redacted: string;
          id?: string;
          incident_id?: string | null;
          published_at?: string;
          published_by?: string;
          resolution_state: string;
          service_state: string;
          source_record_ids?: string[];
        };
        Update: {
          affected_capability?: string;
          audience?: string;
          company_id?: string;
          description_redacted?: string;
          id?: string;
          incident_id?: string | null;
          published_at?: string;
          published_by?: string;
          resolution_state?: string;
          service_state?: string;
          source_record_ids?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "reliability_status_updates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reliability_status_updates_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "reliability_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      replacement_review_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "replacement_review_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      route_performance_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "route_performance_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      route_performance_records: {
        Row: {
          accepted_point_count: number;
          actual_arrived_at: string | null;
          actual_completed_at: string | null;
          actual_started_at: string | null;
          arrival_delay_minutes: number | null;
          company_id: string;
          completion_delay_minutes: number | null;
          confidence: string;
          created_at: string;
          customer_id: string | null;
          data_quality_score: number;
          delay_events: string[];
          delay_minutes: number | null;
          dropoff_location: string | null;
          estimated_stop_count: number;
          failed_at: string | null;
          id: string;
          job_id: string;
          late_start_minutes: number | null;
          observed_distance_meters: number;
          observed_duration_seconds: number | null;
          observed_point_count: number;
          pickup_location: string | null;
          poor_point_count: number;
          rejected_point_count: number;
          route_baseline_id: string | null;
          route_key: string;
          scheduled_at: string | null;
          status: string;
          tracking_session_id: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_point_count?: number;
          actual_arrived_at?: string | null;
          actual_completed_at?: string | null;
          actual_started_at?: string | null;
          arrival_delay_minutes?: number | null;
          company_id: string;
          completion_delay_minutes?: number | null;
          confidence?: string;
          created_at?: string;
          customer_id?: string | null;
          data_quality_score?: number;
          delay_events?: string[];
          delay_minutes?: number | null;
          dropoff_location?: string | null;
          estimated_stop_count?: number;
          failed_at?: string | null;
          id?: string;
          job_id: string;
          late_start_minutes?: number | null;
          observed_distance_meters?: number;
          observed_duration_seconds?: number | null;
          observed_point_count?: number;
          pickup_location?: string | null;
          poor_point_count?: number;
          rejected_point_count?: number;
          route_baseline_id?: string | null;
          route_key: string;
          scheduled_at?: string | null;
          status: string;
          tracking_session_id?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_point_count?: number;
          actual_arrived_at?: string | null;
          actual_completed_at?: string | null;
          actual_started_at?: string | null;
          arrival_delay_minutes?: number | null;
          company_id?: string;
          completion_delay_minutes?: number | null;
          confidence?: string;
          created_at?: string;
          customer_id?: string | null;
          data_quality_score?: number;
          delay_events?: string[];
          delay_minutes?: number | null;
          dropoff_location?: string | null;
          estimated_stop_count?: number;
          failed_at?: string | null;
          id?: string;
          job_id?: string;
          late_start_minutes?: number | null;
          observed_distance_meters?: number;
          observed_duration_seconds?: number | null;
          observed_point_count?: number;
          pickup_location?: string | null;
          poor_point_count?: number;
          rejected_point_count?: number;
          route_baseline_id?: string | null;
          route_key?: string;
          scheduled_at?: string | null;
          status?: string;
          tracking_session_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_performance_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_performance_records_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_performance_records_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_performance_records_route_baseline_id_fkey";
            columns: ["route_baseline_id"];
            isOneToOne: false;
            referencedRelation: "route_segment_baselines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_performance_records_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      route_segment_baselines: {
        Row: {
          average_delay_minutes: number | null;
          average_observed_distance_meters: number | null;
          average_observed_duration_seconds: number | null;
          average_stop_count: number | null;
          company_id: string;
          completed_trip_count: number;
          confidence: string;
          created_at: string;
          customer_id: string | null;
          data_quality_score: number;
          delayed_trip_count: number;
          dropoff_location: string | null;
          failed_trip_count: number;
          first_completed_at: string | null;
          id: string;
          last_completed_at: string | null;
          pickup_location: string | null;
          poor_quality_trip_count: number;
          route_key: string;
          updated_at: string;
        };
        Insert: {
          average_delay_minutes?: number | null;
          average_observed_distance_meters?: number | null;
          average_observed_duration_seconds?: number | null;
          average_stop_count?: number | null;
          company_id: string;
          completed_trip_count?: number;
          confidence?: string;
          created_at?: string;
          customer_id?: string | null;
          data_quality_score?: number;
          delayed_trip_count?: number;
          dropoff_location?: string | null;
          failed_trip_count?: number;
          first_completed_at?: string | null;
          id?: string;
          last_completed_at?: string | null;
          pickup_location?: string | null;
          poor_quality_trip_count?: number;
          route_key: string;
          updated_at?: string;
        };
        Update: {
          average_delay_minutes?: number | null;
          average_observed_distance_meters?: number | null;
          average_observed_duration_seconds?: number | null;
          average_stop_count?: number | null;
          company_id?: string;
          completed_trip_count?: number;
          confidence?: string;
          created_at?: string;
          customer_id?: string | null;
          data_quality_score?: number;
          delayed_trip_count?: number;
          dropoff_location?: string | null;
          failed_trip_count?: number;
          first_completed_at?: string | null;
          id?: string;
          last_completed_at?: string | null;
          pickup_location?: string | null;
          poor_quality_trip_count?: number;
          route_key?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_segment_baselines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_segment_baselines_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      security_access_review_items: {
        Row: {
          company_id: string;
          decision: string | null;
          decision_reason: string | null;
          evidence: Json;
          id: string;
          identity_id: string | null;
          review_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          subject_reference: string | null;
        };
        Insert: {
          company_id: string;
          decision?: string | null;
          decision_reason?: string | null;
          evidence?: Json;
          id?: string;
          identity_id?: string | null;
          review_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          subject_reference?: string | null;
        };
        Update: {
          company_id?: string;
          decision?: string | null;
          decision_reason?: string | null;
          evidence?: Json;
          id?: string;
          identity_id?: string | null;
          review_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          subject_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_access_review_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_access_review_items_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "security_identities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_access_review_items_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "security_access_reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      security_access_reviews: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          due_at: string;
          id: string;
          name: string;
          period_end: string;
          period_start: string;
          review_type: string;
          reviewer_id: string;
          status: string;
          summary: Json;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          due_at: string;
          id?: string;
          name: string;
          period_end: string;
          period_start: string;
          review_type: string;
          reviewer_id: string;
          status?: string;
          summary?: Json;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          due_at?: string;
          id?: string;
          name?: string;
          period_end?: string;
          period_start?: string;
          review_type?: string;
          reviewer_id?: string;
          status?: string;
          summary?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "security_access_reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_api_identities: {
        Row: {
          company_id: string;
          environment: string;
          expires_at: string;
          id: string;
          identity_id: string;
          issued_at: string;
          last_rotated_at: string | null;
          last_used_at: string | null;
          name: string;
          revoked_at: string | null;
          rotation_due_at: string | null;
          scopes: string[];
          token_reference_hash: string;
          usage_count: number;
        };
        Insert: {
          company_id: string;
          environment: string;
          expires_at: string;
          id?: string;
          identity_id: string;
          issued_at: string;
          last_rotated_at?: string | null;
          last_used_at?: string | null;
          name: string;
          revoked_at?: string | null;
          rotation_due_at?: string | null;
          scopes?: string[];
          token_reference_hash: string;
          usage_count?: number;
        };
        Update: {
          company_id?: string;
          environment?: string;
          expires_at?: string;
          id?: string;
          identity_id?: string;
          issued_at?: string;
          last_rotated_at?: string | null;
          last_used_at?: string | null;
          name?: string;
          revoked_at?: string | null;
          rotation_due_at?: string | null;
          scopes?: string[];
          token_reference_hash?: string;
          usage_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "security_api_identities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_api_identities_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "security_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      security_auth_factors: {
        Row: {
          company_id: string;
          created_at: string;
          factor_type: string;
          id: string;
          identity_id: string;
          last_challenged_at: string | null;
          provider_factor_reference: string | null;
          status: string;
          verified_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          factor_type: string;
          id?: string;
          identity_id: string;
          last_challenged_at?: string | null;
          provider_factor_reference?: string | null;
          status?: string;
          verified_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          factor_type?: string;
          id?: string;
          identity_id?: string;
          last_challenged_at?: string | null;
          provider_factor_reference?: string | null;
          status?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_auth_factors_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_auth_factors_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "security_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      security_certificate_metadata: {
        Row: {
          company_id: string;
          environment: string;
          expires_at: string | null;
          fingerprint: string;
          id: string;
          issuer_metadata: Json;
          name: string;
          owner_id: string;
          rotation_due_at: string | null;
          status: string;
          usage_metadata: Json;
          valid_from: string | null;
        };
        Insert: {
          company_id: string;
          environment: string;
          expires_at?: string | null;
          fingerprint: string;
          id?: string;
          issuer_metadata?: Json;
          name: string;
          owner_id: string;
          rotation_due_at?: string | null;
          status: string;
          usage_metadata?: Json;
          valid_from?: string | null;
        };
        Update: {
          company_id?: string;
          environment?: string;
          expires_at?: string | null;
          fingerprint?: string;
          id?: string;
          issuer_metadata?: Json;
          name?: string;
          owner_id?: string;
          rotation_due_at?: string | null;
          status?: string;
          usage_metadata?: Json;
          valid_from?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_certificate_metadata_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_data_classifications: {
        Row: {
          classification: string;
          company_id: string;
          id: string;
          minimum_fields: Json;
          owner_id: string;
          policy_reference: string;
          resource_kind: string;
          resource_reference: string;
          reviewed_at: string | null;
        };
        Insert: {
          classification: string;
          company_id: string;
          id?: string;
          minimum_fields?: Json;
          owner_id: string;
          policy_reference: string;
          resource_kind: string;
          resource_reference: string;
          reviewed_at?: string | null;
        };
        Update: {
          classification?: string;
          company_id?: string;
          id?: string;
          minimum_fields?: Json;
          owner_id?: string;
          policy_reference?: string;
          resource_kind?: string;
          resource_reference?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_data_classifications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_encryption_coverage: {
        Row: {
          at_rest_state: string;
          checked_at: string | null;
          company_id: string;
          coverage: number | null;
          environment: string;
          evidence_source: string | null;
          id: string;
          in_transit_state: string;
          key_provider_metadata: Json;
          key_version_reference: string | null;
          resource_type: string;
          rotated_at: string | null;
          rotation_due_at: string | null;
        };
        Insert: {
          at_rest_state: string;
          checked_at?: string | null;
          company_id: string;
          coverage?: number | null;
          environment: string;
          evidence_source?: string | null;
          id?: string;
          in_transit_state: string;
          key_provider_metadata?: Json;
          key_version_reference?: string | null;
          resource_type: string;
          rotated_at?: string | null;
          rotation_due_at?: string | null;
        };
        Update: {
          at_rest_state?: string;
          checked_at?: string | null;
          company_id?: string;
          coverage?: number | null;
          environment?: string;
          evidence_source?: string | null;
          id?: string;
          in_transit_state?: string;
          key_provider_metadata?: Json;
          key_version_reference?: string | null;
          resource_type?: string;
          rotated_at?: string | null;
          rotation_due_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_encryption_coverage_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_events: {
        Row: {
          actor_id: string | null;
          company_id: string;
          correlation_id: string | null;
          event_type: string;
          id: string;
          identity_id: string | null;
          occurred_at: string;
          safe_metadata: Json;
          severity: string;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          correlation_id?: string | null;
          event_type: string;
          id?: string;
          identity_id?: string | null;
          occurred_at?: string;
          safe_metadata?: Json;
          severity: string;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          correlation_id?: string | null;
          event_type?: string;
          id?: string;
          identity_id?: string | null;
          occurred_at?: string;
          safe_metadata?: Json;
          severity?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_events_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "security_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      security_identities: {
        Row: {
          auth_user_id: string | null;
          branch_id: string | null;
          company_id: string;
          created_at: string;
          department_id: string | null;
          display_name: string;
          id: string;
          identity_type: string;
          metadata: Json;
          owner_id: string | null;
          status: string;
        };
        Insert: {
          auth_user_id?: string | null;
          branch_id?: string | null;
          company_id: string;
          created_at?: string;
          department_id?: string | null;
          display_name: string;
          id?: string;
          identity_type: string;
          metadata?: Json;
          owner_id?: string | null;
          status?: string;
        };
        Update: {
          auth_user_id?: string | null;
          branch_id?: string | null;
          company_id?: string;
          created_at?: string;
          department_id?: string | null;
          display_name?: string;
          id?: string;
          identity_type?: string;
          metadata?: Json;
          owner_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_identities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_legal_holds: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          created_by: string;
          expires_at: string | null;
          id: string;
          name: string;
          reason: string;
          release_reason: string | null;
          released_at: string | null;
          released_by: string | null;
          scope: Json;
          starts_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          name: string;
          reason: string;
          release_reason?: string | null;
          released_at?: string | null;
          released_by?: string | null;
          scope: Json;
          starts_at: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          name?: string;
          reason?: string;
          release_reason?: string | null;
          released_at?: string | null;
          released_by?: string | null;
          scope?: Json;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_legal_holds_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_permission_grants: {
        Row: {
          approved_by: string | null;
          branch_id: string | null;
          company_id: string;
          delegated_by: string | null;
          department_id: string | null;
          existing_role: Database["public"]["Enums"]["app_role"] | null;
          expires_at: string;
          grant_type: string;
          id: string;
          owner_only: boolean;
          permission: string;
          project_id: string | null;
          reason: string;
          resource_id: string | null;
          resource_type: string | null;
          revoked_at: string | null;
          starts_at: string;
          user_id: string;
        };
        Insert: {
          approved_by?: string | null;
          branch_id?: string | null;
          company_id: string;
          delegated_by?: string | null;
          department_id?: string | null;
          existing_role?: Database["public"]["Enums"]["app_role"] | null;
          expires_at: string;
          grant_type: string;
          id?: string;
          owner_only?: boolean;
          permission: string;
          project_id?: string | null;
          reason: string;
          resource_id?: string | null;
          resource_type?: string | null;
          revoked_at?: string | null;
          starts_at: string;
          user_id: string;
        };
        Update: {
          approved_by?: string | null;
          branch_id?: string | null;
          company_id?: string;
          delegated_by?: string | null;
          department_id?: string | null;
          existing_role?: Database["public"]["Enums"]["app_role"] | null;
          expires_at?: string;
          grant_type?: string;
          id?: string;
          owner_only?: boolean;
          permission?: string;
          project_id?: string | null;
          reason?: string;
          resource_id?: string | null;
          resource_type?: string | null;
          revoked_at?: string | null;
          starts_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_permission_grants_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_privacy_requests: {
        Row: {
          approved_by: string | null;
          company_id: string;
          due_at: string | null;
          evidence: Json;
          id: string;
          request_type: string;
          requested_at: string;
          resolution: string | null;
          reviewed_by: string | null;
          scope: Json;
          status: string;
          subject_reference_hash: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          due_at?: string | null;
          evidence?: Json;
          id?: string;
          request_type: string;
          requested_at?: string;
          resolution?: string | null;
          reviewed_by?: string | null;
          scope?: Json;
          status?: string;
          subject_reference_hash: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          due_at?: string | null;
          evidence?: Json;
          id?: string;
          request_type?: string;
          requested_at?: string;
          resolution?: string | null;
          reviewed_by?: string | null;
          scope?: Json;
          status?: string;
          subject_reference_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_privacy_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_retention_policies: {
        Row: {
          approved_by: string | null;
          classification: string;
          company_id: string;
          disposition: string;
          effective_at: string;
          id: string;
          legal_basis: string;
          owner_id: string;
          record_type: string;
          retention_days: number;
        };
        Insert: {
          approved_by?: string | null;
          classification: string;
          company_id: string;
          disposition?: string;
          effective_at: string;
          id?: string;
          legal_basis: string;
          owner_id: string;
          record_type: string;
          retention_days: number;
        };
        Update: {
          approved_by?: string | null;
          classification?: string;
          company_id?: string;
          disposition?: string;
          effective_at?: string;
          id?: string;
          legal_basis?: string;
          owner_id?: string;
          record_type?: string;
          retention_days?: number;
        };
        Relationships: [
          {
            foreignKeyName: "security_retention_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_score_snapshots: {
        Row: {
          access_review_completion: number | null;
          calculated_at: string;
          company_id: string;
          confidence: string;
          dormant_accounts: number | null;
          expired_tokens: number | null;
          high_risk_findings: number | null;
          id: string;
          mfa_adoption: number | null;
          old_certificates: number | null;
          open_incidents: number | null;
          policy_compliance: number | null;
          score: number | null;
          source_record_ids: string[];
        };
        Insert: {
          access_review_completion?: number | null;
          calculated_at?: string;
          company_id: string;
          confidence: string;
          dormant_accounts?: number | null;
          expired_tokens?: number | null;
          high_risk_findings?: number | null;
          id?: string;
          mfa_adoption?: number | null;
          old_certificates?: number | null;
          open_incidents?: number | null;
          policy_compliance?: number | null;
          score?: number | null;
          source_record_ids?: string[];
        };
        Update: {
          access_review_completion?: number | null;
          calculated_at?: string;
          company_id?: string;
          confidence?: string;
          dormant_accounts?: number | null;
          expired_tokens?: number | null;
          high_risk_findings?: number | null;
          id?: string;
          mfa_adoption?: number | null;
          old_certificates?: number | null;
          open_incidents?: number | null;
          policy_compliance?: number | null;
          score?: number | null;
          source_record_ids?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "security_score_snapshots_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_secret_metadata: {
        Row: {
          company_id: string;
          environment: string;
          expires_at: string | null;
          id: string;
          name: string;
          owner_id: string;
          provider_reference: string | null;
          rotated_at: string | null;
          rotation_due_at: string | null;
          secret_type: string;
          status: string;
          usage_metadata: Json;
        };
        Insert: {
          company_id: string;
          environment: string;
          expires_at?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          provider_reference?: string | null;
          rotated_at?: string | null;
          rotation_due_at?: string | null;
          secret_type: string;
          status: string;
          usage_metadata?: Json;
        };
        Update: {
          company_id?: string;
          environment?: string;
          expires_at?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          provider_reference?: string | null;
          rotated_at?: string | null;
          rotation_due_at?: string | null;
          secret_type?: string;
          status?: string;
          usage_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "security_secret_metadata_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_sessions: {
        Row: {
          browser_metadata: Json;
          company_id: string;
          country_code: string | null;
          created_at: string;
          device_id: string | null;
          expires_at: string;
          id: string;
          identity_id: string;
          idle_timeout_seconds: number;
          ip_hash: string | null;
          last_activity_at: string;
          provider_session_hash: string;
          revoked_at: string | null;
          revoked_by: string | null;
          risk_score: number;
        };
        Insert: {
          browser_metadata?: Json;
          company_id: string;
          country_code?: string | null;
          created_at?: string;
          device_id?: string | null;
          expires_at: string;
          id?: string;
          identity_id: string;
          idle_timeout_seconds: number;
          ip_hash?: string | null;
          last_activity_at: string;
          provider_session_hash: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          risk_score?: number;
        };
        Update: {
          browser_metadata?: Json;
          company_id?: string;
          country_code?: string | null;
          created_at?: string;
          device_id?: string | null;
          expires_at?: string;
          id?: string;
          identity_id?: string;
          idle_timeout_seconds?: number;
          ip_hash?: string | null;
          last_activity_at?: string;
          provider_session_hash?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          risk_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "security_session_device_fk";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "security_trusted_devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_sessions_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "security_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      security_threat_findings: {
        Row: {
          brain_advice: Json;
          company_id: string;
          created_at: string;
          finding_type: string;
          id: string;
          owner_id: string | null;
          resolution: string | null;
          risk: string;
          source_event_ids: string[];
          status: string;
        };
        Insert: {
          brain_advice?: Json;
          company_id: string;
          created_at?: string;
          finding_type: string;
          id?: string;
          owner_id?: string | null;
          resolution?: string | null;
          risk: string;
          source_event_ids?: string[];
          status?: string;
        };
        Update: {
          brain_advice?: Json;
          company_id?: string;
          created_at?: string;
          finding_type?: string;
          id?: string;
          owner_id?: string | null;
          resolution?: string | null;
          risk?: string;
          source_event_ids?: string[];
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_threat_findings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      security_trusted_devices: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          device_metadata: Json;
          expires_at: string;
          fingerprint_hash: string;
          id: string;
          identity_id: string;
          last_reviewed_at: string | null;
          registered_at: string;
          revoked_at: string | null;
          risk_score: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          device_metadata?: Json;
          expires_at: string;
          fingerprint_hash: string;
          id?: string;
          identity_id: string;
          last_reviewed_at?: string | null;
          registered_at?: string;
          revoked_at?: string | null;
          risk_score?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          device_metadata?: Json;
          expires_at?: string;
          fingerprint_hash?: string;
          id?: string;
          identity_id?: string;
          last_reviewed_at?: string | null;
          registered_at?: string;
          revoked_at?: string | null;
          risk_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "security_trusted_devices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_trusted_devices_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "security_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      shift_handover_items: {
        Row: {
          company_id: string;
          created_at: string;
          handover_id: string;
          id: string;
          item_type: string;
          label: string;
          metadata: Json;
          severity: string;
          sort_order: number;
          source_entity_id: string | null;
          source_entity_type: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          handover_id: string;
          id?: string;
          item_type: string;
          label: string;
          metadata?: Json;
          severity?: string;
          sort_order?: number;
          source_entity_id?: string | null;
          source_entity_type: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          handover_id?: string;
          id?: string;
          item_type?: string;
          label?: string;
          metadata?: Json;
          severity?: string;
          sort_order?: number;
          source_entity_id?: string | null;
          source_entity_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_handover_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shift_handover_items_handover_id_fkey";
            columns: ["handover_id"];
            isOneToOne: false;
            referencedRelation: "shift_handovers";
            referencedColumns: ["id"];
          },
        ];
      };
      shift_handovers: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          company_id: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string;
          created_by_role: Database["public"]["Enums"]["app_role"];
          id: string;
          status: Database["public"]["Enums"]["shift_handover_status"];
          summary: Json;
          title: string;
          updated_at: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          company_id: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by: string;
          created_by_role: Database["public"]["Enums"]["app_role"];
          id?: string;
          status?: Database["public"]["Enums"]["shift_handover_status"];
          summary?: Json;
          title?: string;
          updated_at?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          company_id?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          created_by?: string;
          created_by_role?: Database["public"]["Enums"]["app_role"];
          id?: string;
          status?: Database["public"]["Enums"]["shift_handover_status"];
          summary?: Json;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shift_handovers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      shipment_share_links: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          expires_at: string | null;
          id: string;
          job_id: string;
          max_views: number | null;
          permissions: Json;
          status: Database["public"]["Enums"]["customer_portal_share_status"];
          token_hash: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          expires_at?: string | null;
          id?: string;
          job_id: string;
          max_views?: number | null;
          permissions?: Json;
          status?: Database["public"]["Enums"]["customer_portal_share_status"];
          token_hash: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          expires_at?: string | null;
          id?: string;
          job_id?: string;
          max_views?: number | null;
          permissions?: Json;
          status?: Database["public"]["Enums"]["customer_portal_share_status"];
          token_hash?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_share_links_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shipment_share_links_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shipment_share_links_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      team_channel_members: {
        Row: {
          channel_id: string;
          company_id: string;
          created_at: string;
          id: string;
          last_read_at: string | null;
          membership_role: string;
          user_id: string;
        };
        Insert: {
          channel_id: string;
          company_id: string;
          created_at?: string;
          id?: string;
          last_read_at?: string | null;
          membership_role?: string;
          user_id: string;
        };
        Update: {
          channel_id?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          last_read_at?: string | null;
          membership_role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_channel_members_channel_company_fk";
            columns: ["channel_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "team_channels";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "team_channel_members_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      team_channels: {
        Row: {
          archived_at: string | null;
          branch_id: string | null;
          channel_type: string;
          company_id: string;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
        };
        Insert: {
          archived_at?: string | null;
          branch_id?: string | null;
          channel_type?: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
        };
        Update: {
          archived_at?: string | null;
          branch_id?: string | null;
          channel_type?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_channels_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_alert_acknowledgements: {
        Row: {
          acknowledged_at: string;
          acknowledged_by: string;
          alert_id: string;
          company_id: string;
          id: string;
          note: string | null;
        };
        Insert: {
          acknowledged_at?: string;
          acknowledged_by?: string;
          alert_id: string;
          company_id: string;
          id?: string;
          note?: string | null;
        };
        Update: {
          acknowledged_at?: string;
          acknowledged_by?: string;
          alert_id?: string;
          company_id?: string;
          id?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_alert_acknowledgements_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "tracking_alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_alert_acknowledgements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_alerts: {
        Row: {
          alert_type: string;
          company_id: string;
          created_at: string;
          customer_impact: boolean;
          escalation_state: string;
          id: string;
          owner_id: string | null;
          priority: string;
          resolution_note: string | null;
          resolved_at: string | null;
          source_evidence: Json;
          status: string;
          tracking_session_id: string | null;
          vehicle_id: string | null;
        };
        Insert: {
          alert_type: string;
          company_id: string;
          created_at?: string;
          customer_impact?: boolean;
          escalation_state?: string;
          id?: string;
          owner_id?: string | null;
          priority: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          source_evidence?: Json;
          status?: string;
          tracking_session_id?: string | null;
          vehicle_id?: string | null;
        };
        Update: {
          alert_type?: string;
          company_id?: string;
          created_at?: string;
          customer_impact?: boolean;
          escalation_state?: string;
          id?: string;
          owner_id?: string | null;
          priority?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          source_evidence?: Json;
          status?: string;
          tracking_session_id?: string | null;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_alerts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_alerts_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_alerts_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          safe_metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          safe_metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          safe_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_customer_updates: {
        Row: {
          communication_status: string;
          company_id: string;
          customer_id: string;
          delay_reason: string | null;
          eta: string | null;
          eta_confidence: string;
          general_area: string | null;
          id: string;
          last_tracking_update: string | null;
          next_milestone: string | null;
          pod_state: string | null;
          prepared_at: string;
          prepared_by: string;
          provider_confirmation_reference: string | null;
          shipment_id: string | null;
          status: string;
          tracking_session_id: string | null;
        };
        Insert: {
          communication_status?: string;
          company_id: string;
          customer_id: string;
          delay_reason?: string | null;
          eta?: string | null;
          eta_confidence: string;
          general_area?: string | null;
          id?: string;
          last_tracking_update?: string | null;
          next_milestone?: string | null;
          pod_state?: string | null;
          prepared_at?: string;
          prepared_by?: string;
          provider_confirmation_reference?: string | null;
          shipment_id?: string | null;
          status: string;
          tracking_session_id?: string | null;
        };
        Update: {
          communication_status?: string;
          company_id?: string;
          customer_id?: string;
          delay_reason?: string | null;
          eta?: string | null;
          eta_confidence?: string;
          general_area?: string | null;
          id?: string;
          last_tracking_update?: string | null;
          next_milestone?: string | null;
          pod_state?: string | null;
          prepared_at?: string;
          prepared_by?: string;
          provider_confirmation_reference?: string | null;
          shipment_id?: string | null;
          status?: string;
          tracking_session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_customer_updates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_customer_updates_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_customer_updates_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_customer_visibility_policies: {
        Row: {
          approved_by: string | null;
          cargo_sensitivity: string | null;
          company_id: string;
          created_at: string;
          customer_id: string;
          delay_minutes: number;
          effective_at: string;
          expires_at: string | null;
          id: string;
          policy_source: string;
          shipment_id: string | null;
          vehicle_id: string | null;
          visibility_mode: string;
        };
        Insert: {
          approved_by?: string | null;
          cargo_sensitivity?: string | null;
          company_id: string;
          created_at?: string;
          customer_id: string;
          delay_minutes?: number;
          effective_at: string;
          expires_at?: string | null;
          id?: string;
          policy_source: string;
          shipment_id?: string | null;
          vehicle_id?: string | null;
          visibility_mode: string;
        };
        Update: {
          approved_by?: string | null;
          cargo_sensitivity?: string | null;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          delay_minutes?: number;
          effective_at?: string;
          expires_at?: string | null;
          id?: string;
          policy_source?: string;
          shipment_id?: string | null;
          vehicle_id?: string | null;
          visibility_mode?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_customer_visibility_policies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_customer_visibility_policies_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_customer_visibility_policies_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_data_quality_events: {
        Row: {
          company_id: string;
          detected_at: string;
          event_type: string;
          id: string;
          quality_impact: number;
          safe_metadata: Json;
          severity: string;
          telemetry_point_id: string | null;
          tracking_session_id: string | null;
        };
        Insert: {
          company_id: string;
          detected_at?: string;
          event_type: string;
          id?: string;
          quality_impact: number;
          safe_metadata?: Json;
          severity: string;
          telemetry_point_id?: string | null;
          tracking_session_id?: string | null;
        };
        Update: {
          company_id?: string;
          detected_at?: string;
          event_type?: string;
          id?: string;
          quality_impact?: number;
          safe_metadata?: Json;
          severity?: string;
          telemetry_point_id?: string | null;
          tracking_session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_data_quality_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_data_quality_events_telemetry_point_id_fkey";
            columns: ["telemetry_point_id"];
            isOneToOne: false;
            referencedRelation: "tracking_telemetry_points";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_data_quality_events_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_eta_assessments: {
        Row: {
          assumptions: Json;
          calculated_at: string;
          company_id: string;
          confidence: string;
          confidence_band_minutes: number | null;
          contributing_factors: Json;
          eta: string | null;
          evidence_references: Json;
          freshness_state: string;
          id: string;
          missing_inputs: Json;
          source_period: Json;
          tracking_session_id: string;
        };
        Insert: {
          assumptions?: Json;
          calculated_at?: string;
          company_id: string;
          confidence: string;
          confidence_band_minutes?: number | null;
          contributing_factors?: Json;
          eta?: string | null;
          evidence_references?: Json;
          freshness_state: string;
          id?: string;
          missing_inputs?: Json;
          source_period?: Json;
          tracking_session_id: string;
        };
        Update: {
          assumptions?: Json;
          calculated_at?: string;
          company_id?: string;
          confidence?: string;
          confidence_band_minutes?: number | null;
          contributing_factors?: Json;
          eta?: string | null;
          evidence_references?: Json;
          freshness_state?: string;
          id?: string;
          missing_inputs?: Json;
          source_period?: Json;
          tracking_session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_eta_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_eta_assessments_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_geofence_events: {
        Row: {
          company_id: string;
          confidence: string;
          created_at: string;
          customer_safe: boolean;
          event_type: string;
          evidence_references: Json;
          geofence_id: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          occurred_at: string;
          tracking_session_id: string | null;
          vehicle_id: string;
        };
        Insert: {
          company_id: string;
          confidence: string;
          created_at?: string;
          customer_safe?: boolean;
          event_type: string;
          evidence_references?: Json;
          geofence_id: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          occurred_at: string;
          tracking_session_id?: string | null;
          vehicle_id: string;
        };
        Update: {
          company_id?: string;
          confidence?: string;
          created_at?: string;
          customer_safe?: boolean;
          event_type?: string;
          evidence_references?: Json;
          geofence_id?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          occurred_at?: string;
          tracking_session_id?: string | null;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_geofence_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_geofence_events_geofence_id_fkey";
            columns: ["geofence_id"];
            isOneToOne: false;
            referencedRelation: "tracking_geofences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_geofence_events_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_geofence_events_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_geofences: {
        Row: {
          active: boolean;
          center_latitude: number | null;
          center_longitude: number | null;
          company_id: string;
          created_at: string;
          customer_safe: boolean;
          geofence_type: string;
          id: string;
          name: string;
          polygon_geojson: Json | null;
          radius_meters: number | null;
          shape_type: string;
        };
        Insert: {
          active?: boolean;
          center_latitude?: number | null;
          center_longitude?: number | null;
          company_id: string;
          created_at?: string;
          customer_safe?: boolean;
          geofence_type: string;
          id?: string;
          name: string;
          polygon_geojson?: Json | null;
          radius_meters?: number | null;
          shape_type: string;
        };
        Update: {
          active?: boolean;
          center_latitude?: number | null;
          center_longitude?: number | null;
          company_id?: string;
          created_at?: string;
          customer_safe?: boolean;
          geofence_type?: string;
          id?: string;
          name?: string;
          polygon_geojson?: Json | null;
          radius_meters?: number | null;
          shape_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_geofences_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_hourly_checks: {
        Row: {
          acknowledged_at: string | null;
          checked_at: string;
          checked_by: string;
          company_id: string;
          customer_safe_summary: string | null;
          evidence_references: Json;
          follow_up_due_at: string | null;
          id: string;
          internal_note: string | null;
          owner_id: string | null;
          shipment_id: string | null;
          status: string;
          tracking_session_id: string | null;
          vehicle_id: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          checked_at: string;
          checked_by?: string;
          company_id: string;
          customer_safe_summary?: string | null;
          evidence_references?: Json;
          follow_up_due_at?: string | null;
          id?: string;
          internal_note?: string | null;
          owner_id?: string | null;
          shipment_id?: string | null;
          status: string;
          tracking_session_id?: string | null;
          vehicle_id?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          checked_at?: string;
          checked_by?: string;
          company_id?: string;
          customer_safe_summary?: string | null;
          evidence_references?: Json;
          follow_up_due_at?: string | null;
          id?: string;
          internal_note?: string | null;
          owner_id?: string | null;
          shipment_id?: string | null;
          status?: string;
          tracking_session_id?: string | null;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_hourly_checks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_hourly_checks_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_hourly_checks_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_map_match_records: {
        Row: {
          company_id: string;
          id: string;
          matched_at: string;
          matched_latitude: number | null;
          matched_longitude: number | null;
          provider: string;
          provider_version: string | null;
          raw_latitude: number;
          raw_longitude: number;
          road_confidence: number | null;
          telemetry_point_id: string;
        };
        Insert: {
          company_id: string;
          id?: string;
          matched_at?: string;
          matched_latitude?: number | null;
          matched_longitude?: number | null;
          provider: string;
          provider_version?: string | null;
          raw_latitude: number;
          raw_longitude: number;
          road_confidence?: number | null;
          telemetry_point_id: string;
        };
        Update: {
          company_id?: string;
          id?: string;
          matched_at?: string;
          matched_latitude?: number | null;
          matched_longitude?: number | null;
          provider?: string;
          provider_version?: string | null;
          raw_latitude?: number;
          raw_longitude?: number;
          road_confidence?: number | null;
          telemetry_point_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_map_match_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_map_match_records_telemetry_point_id_fkey";
            columns: ["telemetry_point_id"];
            isOneToOne: false;
            referencedRelation: "tracking_telemetry_points";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_map_provider_configs: {
        Row: {
          active: boolean;
          capabilities: Json;
          changed_at: string;
          changed_by: string | null;
          company_id: string;
          environment: string;
          id: string;
          offline_regions_state: string;
          provider: string;
          style_reference: string | null;
          tile_reference: string | null;
        };
        Insert: {
          active?: boolean;
          capabilities?: Json;
          changed_at?: string;
          changed_by?: string | null;
          company_id: string;
          environment: string;
          id?: string;
          offline_regions_state?: string;
          provider: string;
          style_reference?: string | null;
          tile_reference?: string | null;
        };
        Update: {
          active?: boolean;
          capabilities?: Json;
          changed_at?: string;
          changed_by?: string | null;
          company_id?: string;
          environment?: string;
          id?: string;
          offline_regions_state?: string;
          provider?: string;
          style_reference?: string | null;
          tile_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_map_provider_configs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_operational_settings: {
        Row: {
          cluster_threshold: number;
          company_id: string;
          customer_care_check_minutes: number;
          customer_delay_minutes: number;
          customer_location_mode: string;
          default_map_view: Json;
          deviation_duration_seconds: number;
          dwell_threshold_seconds: number;
          eta_refresh_seconds: number;
          id: string;
          live_seconds: number;
          offline_seconds: number;
          recent_seconds: number;
          route_deviation_meters: number;
          timezone: string;
          tracking_refresh_seconds: number;
          updated_at: string;
          updated_by: string | null;
          wall_rotation_seconds: number;
          working_hours: Json;
        };
        Insert: {
          cluster_threshold?: number;
          company_id: string;
          customer_care_check_minutes?: number;
          customer_delay_minutes?: number;
          customer_location_mode?: string;
          default_map_view?: Json;
          deviation_duration_seconds?: number;
          dwell_threshold_seconds?: number;
          eta_refresh_seconds?: number;
          id?: string;
          live_seconds?: number;
          offline_seconds?: number;
          recent_seconds?: number;
          route_deviation_meters?: number;
          timezone?: string;
          tracking_refresh_seconds?: number;
          updated_at?: string;
          updated_by?: string | null;
          wall_rotation_seconds?: number;
          working_hours?: Json;
        };
        Update: {
          cluster_threshold?: number;
          company_id?: string;
          customer_care_check_minutes?: number;
          customer_delay_minutes?: number;
          customer_location_mode?: string;
          default_map_view?: Json;
          deviation_duration_seconds?: number;
          dwell_threshold_seconds?: number;
          eta_refresh_seconds?: number;
          id?: string;
          live_seconds?: number;
          offline_seconds?: number;
          recent_seconds?: number;
          route_deviation_meters?: number;
          timezone?: string;
          tracking_refresh_seconds?: number;
          updated_at?: string;
          updated_by?: string | null;
          wall_rotation_seconds?: number;
          working_hours?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_operational_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_replay_sessions: {
        Row: {
          company_id: string;
          gap_count: number;
          id: string;
          opened_at: string;
          opened_by: string;
          range_end: string;
          range_start: string;
          telemetry_point_count: number;
          tracking_session_id: string;
        };
        Insert: {
          company_id: string;
          gap_count?: number;
          id?: string;
          opened_at?: string;
          opened_by?: string;
          range_end: string;
          range_start: string;
          telemetry_point_count?: number;
          tracking_session_id: string;
        };
        Update: {
          company_id?: string;
          gap_count?: number;
          id?: string;
          opened_at?: string;
          opened_by?: string;
          range_end?: string;
          range_start?: string;
          telemetry_point_count?: number;
          tracking_session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_replay_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_replay_sessions_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_route_deviations: {
        Row: {
          company_id: string;
          confidence: string;
          created_at: string;
          current_state: string;
          deviation_type: string;
          distance_meters: number | null;
          duration_seconds: number;
          evidence_references: Json;
          first_detected_at: string;
          id: string;
          possible_explanations: Json;
          recommended_human_review: boolean;
          tracking_session_id: string;
        };
        Insert: {
          company_id: string;
          confidence: string;
          created_at?: string;
          current_state: string;
          deviation_type: string;
          distance_meters?: number | null;
          duration_seconds?: number;
          evidence_references?: Json;
          first_detected_at: string;
          id?: string;
          possible_explanations?: Json;
          recommended_human_review?: boolean;
          tracking_session_id: string;
        };
        Update: {
          company_id?: string;
          confidence?: string;
          created_at?: string;
          current_state?: string;
          deviation_type?: string;
          distance_meters?: number | null;
          duration_seconds?: number;
          evidence_references?: Json;
          first_detected_at?: string;
          id?: string;
          possible_explanations?: Json;
          recommended_human_review?: boolean;
          tracking_session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_route_deviations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_route_deviations_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_sessions: {
        Row: {
          app_version: string | null;
          company_id: string;
          created_at: string;
          device_installation_id: string | null;
          device_platform: string | null;
          driver_id: string;
          ended_at: string | null;
          id: string;
          job_id: string;
          last_telemetry_at: string | null;
          location_permission_state: string | null;
          source: Database["public"]["Enums"]["telemetry_source"];
          started_at: string | null;
          status: Database["public"]["Enums"]["tracking_session_status"];
          tracking_quality_status: Database["public"]["Enums"]["telemetry_quality_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          app_version?: string | null;
          company_id: string;
          created_at?: string;
          device_installation_id?: string | null;
          device_platform?: string | null;
          driver_id: string;
          ended_at?: string | null;
          id?: string;
          job_id: string;
          last_telemetry_at?: string | null;
          location_permission_state?: string | null;
          source?: Database["public"]["Enums"]["telemetry_source"];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["tracking_session_status"];
          tracking_quality_status?: Database["public"]["Enums"]["telemetry_quality_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          app_version?: string | null;
          company_id?: string;
          created_at?: string;
          device_installation_id?: string | null;
          device_platform?: string | null;
          driver_id?: string;
          ended_at?: string | null;
          id?: string;
          job_id?: string;
          last_telemetry_at?: string | null;
          location_permission_state?: string | null;
          source?: Database["public"]["Enums"]["telemetry_source"];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["tracking_session_status"];
          tracking_quality_status?: Database["public"]["Enums"]["telemetry_quality_status"];
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_sessions_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_sessions_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_sessions_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_summaries: {
        Row: {
          accepted_point_count: number;
          average_observed_speed: number | null;
          company_id: string;
          created_at: string;
          first_point_at: string | null;
          gps_coverage_score: number | null;
          last_point_at: string | null;
          maximum_credible_speed: number | null;
          moving_duration: string | null;
          observed_distance: number;
          observed_point_count: number;
          rejected_point_count: number;
          stationary_duration: string | null;
          telemetry_quality_score: number | null;
          total_duration: string | null;
          tracking_session_id: string;
          updated_at: string;
        };
        Insert: {
          accepted_point_count?: number;
          average_observed_speed?: number | null;
          company_id: string;
          created_at?: string;
          first_point_at?: string | null;
          gps_coverage_score?: number | null;
          last_point_at?: string | null;
          maximum_credible_speed?: number | null;
          moving_duration?: string | null;
          observed_distance?: number;
          observed_point_count?: number;
          rejected_point_count?: number;
          stationary_duration?: string | null;
          telemetry_quality_score?: number | null;
          total_duration?: string | null;
          tracking_session_id: string;
          updated_at?: string;
        };
        Update: {
          accepted_point_count?: number;
          average_observed_speed?: number | null;
          company_id?: string;
          created_at?: string;
          first_point_at?: string | null;
          gps_coverage_score?: number | null;
          last_point_at?: string | null;
          maximum_credible_speed?: number | null;
          moving_duration?: string | null;
          observed_distance?: number;
          observed_point_count?: number;
          rejected_point_count?: number;
          stationary_duration?: string | null;
          telemetry_quality_score?: number | null;
          total_duration?: string | null;
          tracking_session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_summaries_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_summaries_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: true;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_telemetry_points: {
        Row: {
          altitude: number | null;
          calculated_speed: number | null;
          company_id: string;
          created_at: string;
          device_installation_id: string | null;
          device_speed: number | null;
          device_timestamp: string;
          driver_id: string;
          encoder_version: string;
          heading: number | null;
          horizontal_accuracy: number | null;
          id: string;
          job_id: string;
          latitude: number | null;
          longitude: number | null;
          movement_state: Database["public"]["Enums"]["telemetry_movement_state"];
          quality_flags: string[];
          quality_status: Database["public"]["Enums"]["telemetry_quality_status"];
          sequence_number: number;
          server_received_at: string;
          source: Database["public"]["Enums"]["telemetry_source"];
          telemetry_point_id: string;
          telemetry_schema_version: number;
          tracking_session_id: string;
          upload_batch_id: string;
          vehicle_id: string | null;
          vertical_accuracy: number | null;
        };
        Insert: {
          altitude?: number | null;
          calculated_speed?: number | null;
          company_id: string;
          created_at?: string;
          device_installation_id?: string | null;
          device_speed?: number | null;
          device_timestamp: string;
          driver_id: string;
          encoder_version?: string;
          heading?: number | null;
          horizontal_accuracy?: number | null;
          id?: string;
          job_id: string;
          latitude?: number | null;
          longitude?: number | null;
          movement_state?: Database["public"]["Enums"]["telemetry_movement_state"];
          quality_flags?: string[];
          quality_status: Database["public"]["Enums"]["telemetry_quality_status"];
          sequence_number: number;
          server_received_at?: string;
          source?: Database["public"]["Enums"]["telemetry_source"];
          telemetry_point_id: string;
          telemetry_schema_version?: number;
          tracking_session_id: string;
          upload_batch_id: string;
          vehicle_id?: string | null;
          vertical_accuracy?: number | null;
        };
        Update: {
          altitude?: number | null;
          calculated_speed?: number | null;
          company_id?: string;
          created_at?: string;
          device_installation_id?: string | null;
          device_speed?: number | null;
          device_timestamp?: string;
          driver_id?: string;
          encoder_version?: string;
          heading?: number | null;
          horizontal_accuracy?: number | null;
          id?: string;
          job_id?: string;
          latitude?: number | null;
          longitude?: number | null;
          movement_state?: Database["public"]["Enums"]["telemetry_movement_state"];
          quality_flags?: string[];
          quality_status?: Database["public"]["Enums"]["telemetry_quality_status"];
          sequence_number?: number;
          server_received_at?: string;
          source?: Database["public"]["Enums"]["telemetry_source"];
          telemetry_point_id?: string;
          telemetry_schema_version?: number;
          tracking_session_id?: string;
          upload_batch_id?: string;
          vehicle_id?: string | null;
          vertical_accuracy?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_telemetry_points_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_telemetry_points_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_telemetry_points_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_telemetry_points_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_telemetry_points_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_trip_progress: {
        Row: {
          calculated_at: string;
          company_id: string;
          completed_distance_km: number | null;
          completed_stops: number;
          current_segment: string | null;
          current_stop_id: string | null;
          delay_seconds: number | null;
          dwell_seconds: number | null;
          id: string;
          next_stop_id: string | null;
          planned_distance_km: number | null;
          remaining_distance_km: number | null;
          remaining_stops: number;
          source_references: Json;
          tracking_session_id: string;
        };
        Insert: {
          calculated_at?: string;
          company_id: string;
          completed_distance_km?: number | null;
          completed_stops?: number;
          current_segment?: string | null;
          current_stop_id?: string | null;
          delay_seconds?: number | null;
          dwell_seconds?: number | null;
          id?: string;
          next_stop_id?: string | null;
          planned_distance_km?: number | null;
          remaining_distance_km?: number | null;
          remaining_stops?: number;
          source_references?: Json;
          tracking_session_id: string;
        };
        Update: {
          calculated_at?: string;
          company_id?: string;
          completed_distance_km?: number | null;
          completed_stops?: number;
          current_segment?: string | null;
          current_stop_id?: string | null;
          delay_seconds?: number | null;
          dwell_seconds?: number | null;
          id?: string;
          next_stop_id?: string | null;
          planned_distance_km?: number | null;
          remaining_distance_km?: number | null;
          remaining_stops?: number;
          source_references?: Json;
          tracking_session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_trip_progress_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_trip_progress_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tracking_vehicle_states: {
        Row: {
          calculated_at: string;
          company_id: string;
          confidence: string;
          derived_state: string;
          device_timestamp: string | null;
          evidence_references: Json;
          freshness_state: string;
          id: string;
          quality_score: number | null;
          received_at: string | null;
          source: string;
          source_state: string | null;
          tracking_session_id: string | null;
          vehicle_id: string;
        };
        Insert: {
          calculated_at?: string;
          company_id: string;
          confidence: string;
          derived_state: string;
          device_timestamp?: string | null;
          evidence_references?: Json;
          freshness_state: string;
          id?: string;
          quality_score?: number | null;
          received_at?: string | null;
          source: string;
          source_state?: string | null;
          tracking_session_id?: string | null;
          vehicle_id: string;
        };
        Update: {
          calculated_at?: string;
          company_id?: string;
          confidence?: string;
          derived_state?: string;
          device_timestamp?: string | null;
          evidence_references?: Json;
          freshness_state?: string;
          id?: string;
          quality_score?: number | null;
          received_at?: string | null;
          source?: string;
          source_state?: string | null;
          tracking_session_id?: string | null;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_vehicle_states_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_vehicle_states_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tracking_vehicle_states_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      unified_experience_events: {
        Row: {
          company_id: string;
          entity_type: string | null;
          event_type: string;
          id: string;
          metadata: Json;
          module: string | null;
          occurred_at: string;
          user_id: string | null;
        };
        Insert: {
          company_id: string;
          entity_type?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json;
          module?: string | null;
          occurred_at?: string;
          user_id?: string | null;
        };
        Update: {
          company_id?: string;
          entity_type?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json;
          module?: string | null;
          occurred_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "unified_experience_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      unified_saved_views: {
        Row: {
          columns_config: Json;
          company_id: string;
          created_at: string;
          filters: Json;
          id: string;
          module: string;
          name: string;
          owner_id: string | null;
          pinned: boolean;
          sort_config: Json;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          columns_config?: Json;
          company_id: string;
          created_at?: string;
          filters?: Json;
          id?: string;
          module: string;
          name: string;
          owner_id?: string | null;
          pinned?: boolean;
          sort_config?: Json;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          columns_config?: Json;
          company_id?: string;
          created_at?: string;
          filters?: Json;
          id?: string;
          module?: string;
          name?: string;
          owner_id?: string | null;
          pinned?: boolean;
          sort_config?: Json;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unified_saved_views_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      unified_search_history: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          query: string;
          result_count: number;
          saved: boolean;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          query: string;
          result_count?: number;
          saved?: boolean;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          query?: string;
          result_count?: number;
          saved?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unified_search_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      unified_workspace_preferences: {
        Row: {
          collapsed_panels: Json;
          company_id: string;
          id: string;
          last_path: string | null;
          layout: Json;
          open_tabs: Json;
          pinned_paths: Json;
          recent_entities: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          collapsed_panels?: Json;
          company_id: string;
          id?: string;
          last_path?: string | null;
          layout?: Json;
          open_tabs?: Json;
          pinned_paths?: Json;
          recent_entities?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          collapsed_panels?: Json;
          company_id?: string;
          id?: string;
          last_path?: string | null;
          layout?: Json;
          open_tabs?: Json;
          pinned_paths?: Json;
          recent_entities?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unified_workspace_preferences_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_health_assessments: {
        Row: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at: string;
          evidence_references: Json;
          expires_at: string | null;
          feature_version: string;
          freshness_state: string;
          id: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id: string | null;
        };
        Insert: {
          assessment_status: string;
          calculated_at: string;
          company_id: string;
          confidence: number;
          confidence_policy_version: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version: string;
          freshness_state: string;
          id?: string;
          input_hash: string;
          output_hash: string;
          quality_state: string;
          result?: Json;
          rule_version: string;
          source_count: number;
          source_period_end: string;
          source_period_start: string;
          subject_id: string;
          subject_type: string;
          supersedes_id?: string | null;
        };
        Update: {
          assessment_status?: string;
          calculated_at?: string;
          company_id?: string;
          confidence?: number;
          confidence_policy_version?: string;
          created_at?: string;
          evidence_references?: Json;
          expires_at?: string | null;
          feature_version?: string;
          freshness_state?: string;
          id?: string;
          input_hash?: string;
          output_hash?: string;
          quality_state?: string;
          result?: Json;
          rule_version?: string;
          source_count?: number;
          source_period_end?: string;
          source_period_start?: string;
          subject_id?: string;
          subject_type?: string;
          supersedes_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_health_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_latest_locations: {
        Row: {
          accuracy: number | null;
          company_id: string;
          device_timestamp: string;
          driver_id: string | null;
          heading: number | null;
          job_id: string | null;
          latitude: number;
          longitude: number;
          quality_status: Database["public"]["Enums"]["telemetry_quality_status"];
          server_received_at: string;
          source: Database["public"]["Enums"]["telemetry_source"];
          speed: number | null;
          tracking_session_id: string | null;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          accuracy?: number | null;
          company_id: string;
          device_timestamp: string;
          driver_id?: string | null;
          heading?: number | null;
          job_id?: string | null;
          latitude: number;
          longitude: number;
          quality_status: Database["public"]["Enums"]["telemetry_quality_status"];
          server_received_at: string;
          source: Database["public"]["Enums"]["telemetry_source"];
          speed?: number | null;
          tracking_session_id?: string | null;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          accuracy?: number | null;
          company_id?: string;
          device_timestamp?: string;
          driver_id?: string | null;
          heading?: number | null;
          job_id?: string | null;
          latitude?: number;
          longitude?: number;
          quality_status?: Database["public"]["Enums"]["telemetry_quality_status"];
          server_received_at?: string;
          source?: Database["public"]["Enums"]["telemetry_source"];
          speed?: number | null;
          tracking_session_id?: string | null;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_latest_locations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_latest_locations_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_latest_locations_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_latest_locations_tracking_session_id_fkey";
            columns: ["tracking_session_id"];
            isOneToOne: false;
            referencedRelation: "tracking_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_latest_locations_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          assigned_driver_id: string | null;
          company_id: string;
          created_at: string;
          id: string;
          insurance_expiry: string | null;
          licence_expiry: string | null;
          make: string | null;
          model: string | null;
          notes: string | null;
          odometer: number | null;
          registration: string;
          status: Database["public"]["Enums"]["vehicle_status"];
          updated_at: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
          vin: string | null;
          year: number | null;
        };
        Insert: {
          assigned_driver_id?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          insurance_expiry?: string | null;
          licence_expiry?: string | null;
          make?: string | null;
          model?: string | null;
          notes?: string | null;
          odometer?: number | null;
          registration: string;
          status?: Database["public"]["Enums"]["vehicle_status"];
          updated_at?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
          vin?: string | null;
          year?: number | null;
        };
        Update: {
          assigned_driver_id?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          insurance_expiry?: string | null;
          licence_expiry?: string | null;
          make?: string | null;
          model?: string | null;
          notes?: string | null;
          odometer?: number | null;
          registration?: string;
          status?: Database["public"]["Enums"]["vehicle_status"];
          updated_at?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
          vin?: string | null;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_driver_id_fkey";
            columns: ["assigned_driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_alerts: {
        Row: {
          alert_type: string;
          company_id: string;
          created_at: string;
          detail: string | null;
          id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          source_id: string | null;
          source_type: string | null;
          status: string;
          title: string;
          warehouse_id: string | null;
        };
        Insert: {
          alert_type: string;
          company_id: string;
          created_at?: string;
          detail?: string | null;
          id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          source_id?: string | null;
          source_type?: string | null;
          status?: string;
          title: string;
          warehouse_id?: string | null;
        };
        Update: {
          alert_type?: string;
          company_id?: string;
          created_at?: string;
          detail?: string | null;
          id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          source_id?: string | null;
          source_type?: string | null;
          status?: string;
          title?: string;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_alerts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_alerts_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
          warehouse_id: string | null;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          warehouse_id?: string | null;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_audit_logs_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_cross_dock_jobs: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          inbound_dock_schedule_id: string | null;
          inbound_shipment_id: string;
          outbound_dock_schedule_id: string | null;
          staging_location_id: string | null;
          status: string;
          updated_at: string;
          warehouse_order_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          inbound_dock_schedule_id?: string | null;
          inbound_shipment_id: string;
          outbound_dock_schedule_id?: string | null;
          staging_location_id?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_order_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          inbound_dock_schedule_id?: string | null;
          inbound_shipment_id?: string;
          outbound_dock_schedule_id?: string | null;
          staging_location_id?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_cross_dock_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cross_dock_jobs_inbound_dock_schedule_id_fkey";
            columns: ["inbound_dock_schedule_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_dock_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cross_dock_jobs_inbound_shipment_id_fkey";
            columns: ["inbound_shipment_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_inbound_shipments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cross_dock_jobs_outbound_dock_schedule_id_fkey";
            columns: ["outbound_dock_schedule_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_dock_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cross_dock_jobs_staging_location_id_fkey";
            columns: ["staging_location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cross_dock_jobs_warehouse_order_id_fkey";
            columns: ["warehouse_order_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_cycle_count_lines: {
        Row: {
          company_id: string;
          counted_quantity: number | null;
          created_at: string;
          cycle_count_id: string;
          expected_quantity: number;
          id: string;
          notes: string | null;
          stock_id: string;
          updated_at: string;
          variance_quantity: number | null;
        };
        Insert: {
          company_id: string;
          counted_quantity?: number | null;
          created_at?: string;
          cycle_count_id: string;
          expected_quantity: number;
          id?: string;
          notes?: string | null;
          stock_id: string;
          updated_at?: string;
          variance_quantity?: number | null;
        };
        Update: {
          company_id?: string;
          counted_quantity?: number | null;
          created_at?: string;
          cycle_count_id?: string;
          expected_quantity?: number;
          id?: string;
          notes?: string | null;
          stock_id?: string;
          updated_at?: string;
          variance_quantity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_cycle_count_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cycle_count_lines_cycle_count_id_fkey";
            columns: ["cycle_count_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_cycle_counts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cycle_count_lines_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_cycle_counts: {
        Row: {
          approved_by: string | null;
          company_id: string;
          count_type: string;
          counted_by: string | null;
          created_at: string;
          id: string;
          location_id: string | null;
          scheduled_for: string | null;
          status: string;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          count_type: string;
          counted_by?: string | null;
          created_at?: string;
          id?: string;
          location_id?: string | null;
          scheduled_for?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          count_type?: string;
          counted_by?: string | null;
          created_at?: string;
          id?: string;
          location_id?: string | null;
          scheduled_for?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_cycle_counts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cycle_counts_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_cycle_counts_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_dock_schedules: {
        Row: {
          company_id: string;
          created_at: string;
          direction: string;
          dock_id: string;
          id: string;
          scheduled_end: string;
          scheduled_start: string;
          status: string;
          trailer_reference: string | null;
          updated_at: string;
          vehicle_id: string | null;
          warehouse_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          direction: string;
          dock_id: string;
          id?: string;
          scheduled_end: string;
          scheduled_start: string;
          status?: string;
          trailer_reference?: string | null;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          direction?: string;
          dock_id?: string;
          id?: string;
          scheduled_end?: string;
          scheduled_start?: string;
          status?: string;
          trailer_reference?: string | null;
          updated_at?: string;
          vehicle_id?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_dock_schedules_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_dock_schedules_dock_id_fkey";
            columns: ["dock_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_docks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_dock_schedules_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_dock_schedules_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_docks: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          location_id: string | null;
          max_vehicle_length_m: number | null;
          status: string;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          location_id?: string | null;
          max_vehicle_length_m?: number | null;
          status?: string;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          location_id?: string | null;
          max_vehicle_length_m?: number | null;
          status?: string;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_docks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_docks_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_docks_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_employees: {
        Row: {
          active: boolean;
          company_id: string;
          created_at: string;
          employee_role: Database["public"]["Enums"]["app_role"];
          id: string;
          updated_at: string;
          user_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          created_at?: string;
          employee_role: Database["public"]["Enums"]["app_role"];
          id?: string;
          updated_at?: string;
          user_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          created_at?: string;
          employee_role?: Database["public"]["Enums"]["app_role"];
          id?: string;
          updated_at?: string;
          user_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_employees_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_employees_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_equipment: {
        Row: {
          asset_tag: string;
          assigned_to: string | null;
          company_id: string;
          created_at: string;
          equipment_type: string;
          id: string;
          maintenance_status: string;
          next_maintenance_at: string | null;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          asset_tag: string;
          assigned_to?: string | null;
          company_id: string;
          created_at?: string;
          equipment_type: string;
          id?: string;
          maintenance_status?: string;
          next_maintenance_at?: string | null;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          asset_tag?: string;
          assigned_to?: string | null;
          company_id?: string;
          created_at?: string;
          equipment_type?: string;
          id?: string;
          maintenance_status?: string;
          next_maintenance_at?: string | null;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_equipment_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_equipment_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_inbound_shipments: {
        Row: {
          arrived_at: string | null;
          company_id: string;
          created_at: string;
          expected_at: string | null;
          id: string;
          notes: string | null;
          purchase_order_reference: string | null;
          status: string;
          supplier_name: string | null;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          arrived_at?: string | null;
          company_id: string;
          created_at?: string;
          expected_at?: string | null;
          id?: string;
          notes?: string | null;
          purchase_order_reference?: string | null;
          status?: string;
          supplier_name?: string | null;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          arrived_at?: string | null;
          company_id?: string;
          created_at?: string;
          expected_at?: string | null;
          id?: string;
          notes?: string | null;
          purchase_order_reference?: string | null;
          status?: string;
          supplier_name?: string | null;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_inbound_shipments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_inbound_shipments_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_inventory_movements: {
        Row: {
          company_id: string;
          created_at: string;
          from_location_id: string | null;
          from_status: Database["public"]["Enums"]["warehouse_inventory_status"] | null;
          id: string;
          metadata: Json;
          movement_type: string;
          performed_by: string | null;
          quantity: number;
          reference_id: string | null;
          reference_type: string | null;
          stock_id: string;
          to_location_id: string | null;
          to_status: Database["public"]["Enums"]["warehouse_inventory_status"] | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          from_location_id?: string | null;
          from_status?: Database["public"]["Enums"]["warehouse_inventory_status"] | null;
          id?: string;
          metadata?: Json;
          movement_type: string;
          performed_by?: string | null;
          quantity: number;
          reference_id?: string | null;
          reference_type?: string | null;
          stock_id: string;
          to_location_id?: string | null;
          to_status?: Database["public"]["Enums"]["warehouse_inventory_status"] | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          from_location_id?: string | null;
          from_status?: Database["public"]["Enums"]["warehouse_inventory_status"] | null;
          id?: string;
          metadata?: Json;
          movement_type?: string;
          performed_by?: string | null;
          quantity?: number;
          reference_id?: string | null;
          reference_type?: string | null;
          stock_id?: string;
          to_location_id?: string | null;
          to_status?: Database["public"]["Enums"]["warehouse_inventory_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_movements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_inventory_movements_from_location_id_fkey";
            columns: ["from_location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_inventory_movements_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_inventory_movements_to_location_id_fkey";
            columns: ["to_location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_loading_jobs: {
        Row: {
          company_id: string;
          created_at: string;
          dock_schedule_id: string | null;
          driver_id: string | null;
          id: string;
          loaded_at: string | null;
          seal_number: string | null;
          status: string;
          trailer_reference: string | null;
          updated_at: string;
          vehicle_id: string | null;
          verified_by: string | null;
          warehouse_order_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          dock_schedule_id?: string | null;
          driver_id?: string | null;
          id?: string;
          loaded_at?: string | null;
          seal_number?: string | null;
          status?: string;
          trailer_reference?: string | null;
          updated_at?: string;
          vehicle_id?: string | null;
          verified_by?: string | null;
          warehouse_order_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          dock_schedule_id?: string | null;
          driver_id?: string | null;
          id?: string;
          loaded_at?: string | null;
          seal_number?: string | null;
          status?: string;
          trailer_reference?: string | null;
          updated_at?: string;
          vehicle_id?: string | null;
          verified_by?: string | null;
          warehouse_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_loading_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_loading_jobs_dock_schedule_id_fkey";
            columns: ["dock_schedule_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_dock_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_loading_jobs_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_loading_jobs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_loading_jobs_warehouse_order_id_fkey";
            columns: ["warehouse_order_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_locations: {
        Row: {
          accepts_hazardous: boolean;
          aisle: string | null;
          bin_code: string | null;
          company_id: string;
          created_at: string;
          current_volume_m3: number;
          current_weight_kg: number;
          distance_rank: number;
          id: string;
          location_code: string;
          location_type: string;
          max_volume_m3: number | null;
          max_weight_kg: number | null;
          row_code: string | null;
          shelf_code: string | null;
          status: string;
          temperature_max_c: number | null;
          temperature_min_c: number | null;
          updated_at: string;
          warehouse_id: string;
          zone_id: string | null;
        };
        Insert: {
          accepts_hazardous?: boolean;
          aisle?: string | null;
          bin_code?: string | null;
          company_id: string;
          created_at?: string;
          current_volume_m3?: number;
          current_weight_kg?: number;
          distance_rank?: number;
          id?: string;
          location_code: string;
          location_type?: string;
          max_volume_m3?: number | null;
          max_weight_kg?: number | null;
          row_code?: string | null;
          shelf_code?: string | null;
          status?: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          updated_at?: string;
          warehouse_id: string;
          zone_id?: string | null;
        };
        Update: {
          accepts_hazardous?: boolean;
          aisle?: string | null;
          bin_code?: string | null;
          company_id?: string;
          created_at?: string;
          current_volume_m3?: number;
          current_weight_kg?: number;
          distance_rank?: number;
          id?: string;
          location_code?: string;
          location_type?: string;
          max_volume_m3?: number | null;
          max_weight_kg?: number | null;
          row_code?: string | null;
          shelf_code?: string | null;
          status?: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          updated_at?: string;
          warehouse_id?: string;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_locations_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_locations_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_order_lines: {
        Row: {
          allocated_quantity: number;
          company_id: string;
          created_at: string;
          id: string;
          packed_quantity: number;
          picked_quantity: number;
          product_id: string;
          replacement_product_id: string | null;
          requested_quantity: number;
          updated_at: string;
          warehouse_order_id: string;
        };
        Insert: {
          allocated_quantity?: number;
          company_id: string;
          created_at?: string;
          id?: string;
          packed_quantity?: number;
          picked_quantity?: number;
          product_id: string;
          replacement_product_id?: string | null;
          requested_quantity: number;
          updated_at?: string;
          warehouse_order_id: string;
        };
        Update: {
          allocated_quantity?: number;
          company_id?: string;
          created_at?: string;
          id?: string;
          packed_quantity?: number;
          picked_quantity?: number;
          product_id?: string;
          replacement_product_id?: string | null;
          requested_quantity?: number;
          updated_at?: string;
          warehouse_order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_order_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_order_lines_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_order_lines_replacement_product_id_fkey";
            columns: ["replacement_product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_order_lines_warehouse_order_id_fkey";
            columns: ["warehouse_order_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_orders: {
        Row: {
          company_id: string;
          created_at: string;
          customer_id: string | null;
          customer_visible: boolean;
          id: string;
          job_id: string | null;
          order_reference: string;
          priority: string;
          requested_dispatch_at: string | null;
          status: string;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          customer_id?: string | null;
          customer_visible?: boolean;
          id?: string;
          job_id?: string | null;
          order_reference: string;
          priority?: string;
          requested_dispatch_at?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          customer_id?: string | null;
          customer_visible?: boolean;
          id?: string;
          job_id?: string | null;
          order_reference?: string;
          priority?: string;
          requested_dispatch_at?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_orders_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_orders_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_orders_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_packages: {
        Row: {
          barcode: string;
          company_id: string;
          created_at: string;
          evidence_metadata: Json;
          expected_weight_kg: number | null;
          height_cm: number | null;
          id: string;
          length_cm: number | null;
          package_reference: string;
          packed_at: string | null;
          packed_by: string | null;
          qr_payload: string;
          verified_weight_kg: number | null;
          warehouse_order_id: string;
          width_cm: number | null;
        };
        Insert: {
          barcode: string;
          company_id: string;
          created_at?: string;
          evidence_metadata?: Json;
          expected_weight_kg?: number | null;
          height_cm?: number | null;
          id?: string;
          length_cm?: number | null;
          package_reference: string;
          packed_at?: string | null;
          packed_by?: string | null;
          qr_payload: string;
          verified_weight_kg?: number | null;
          warehouse_order_id: string;
          width_cm?: number | null;
        };
        Update: {
          barcode?: string;
          company_id?: string;
          created_at?: string;
          evidence_metadata?: Json;
          expected_weight_kg?: number | null;
          height_cm?: number | null;
          id?: string;
          length_cm?: number | null;
          package_reference?: string;
          packed_at?: string | null;
          packed_by?: string | null;
          qr_payload?: string;
          verified_weight_kg?: number | null;
          warehouse_order_id?: string;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_packages_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_packages_warehouse_order_id_fkey";
            columns: ["warehouse_order_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_receiving_lines: {
        Row: {
          accepted_quantity: number;
          batch_number: string | null;
          company_id: string;
          created_at: string;
          damage_notes: string | null;
          expected_quantity: number;
          expiry_date: string | null;
          id: string;
          inbound_shipment_id: string;
          inspection_status: string;
          lot_number: string | null;
          photo_evidence: Json;
          product_id: string;
          received_quantity: number;
          rejected_quantity: number;
          serial_number: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_quantity?: number;
          batch_number?: string | null;
          company_id: string;
          created_at?: string;
          damage_notes?: string | null;
          expected_quantity: number;
          expiry_date?: string | null;
          id?: string;
          inbound_shipment_id: string;
          inspection_status?: string;
          lot_number?: string | null;
          photo_evidence?: Json;
          product_id: string;
          received_quantity?: number;
          rejected_quantity?: number;
          serial_number?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_quantity?: number;
          batch_number?: string | null;
          company_id?: string;
          created_at?: string;
          damage_notes?: string | null;
          expected_quantity?: number;
          expiry_date?: string | null;
          id?: string;
          inbound_shipment_id?: string;
          inspection_status?: string;
          lot_number?: string | null;
          photo_evidence?: Json;
          product_id?: string;
          received_quantity?: number;
          rejected_quantity?: number;
          serial_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_receiving_lines_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_receiving_lines_inbound_shipment_id_fkey";
            columns: ["inbound_shipment_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_inbound_shipments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_receiving_lines_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_products";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_scan_history: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          identifier: string;
          identifier_type: string;
          scanned_by: string | null;
          stock_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          identifier: string;
          identifier_type: string;
          scanned_by?: string | null;
          stock_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          identifier?: string;
          identifier_type?: string;
          scanned_by?: string | null;
          stock_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_scan_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_scan_history_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_scan_history_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_stock: {
        Row: {
          allocated_quantity: number;
          batch_number: string | null;
          company_id: string;
          created_at: string;
          expiry_date: string | null;
          id: string;
          location_id: string | null;
          lot_number: string | null;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          serial_number: string | null;
          source_receiving_line_id: string | null;
          status: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          allocated_quantity?: number;
          batch_number?: string | null;
          company_id: string;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          location_id?: string | null;
          lot_number?: string | null;
          product_id: string;
          quantity: number;
          reserved_quantity?: number;
          serial_number?: string | null;
          source_receiving_line_id?: string | null;
          status?: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          allocated_quantity?: number;
          batch_number?: string | null;
          company_id?: string;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          location_id?: string | null;
          lot_number?: string | null;
          product_id?: string;
          quantity?: number;
          reserved_quantity?: number;
          serial_number?: string | null;
          source_receiving_line_id?: string | null;
          status?: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_stock_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_stock_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_stock_receiving_line_fkey";
            columns: ["source_receiving_line_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_receiving_lines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_tasks: {
        Row: {
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          priority: string;
          reference_id: string | null;
          reference_type: string | null;
          status: Database["public"]["Enums"]["warehouse_task_status"];
          task_type: Database["public"]["Enums"]["warehouse_task_type"];
          title: string;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          priority?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          status?: Database["public"]["Enums"]["warehouse_task_status"];
          task_type: Database["public"]["Enums"]["warehouse_task_type"];
          title: string;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          assigned_to?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          priority?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          status?: Database["public"]["Enums"]["warehouse_task_status"];
          task_type?: Database["public"]["Enums"]["warehouse_task_type"];
          title?: string;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_tasks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_tasks_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_transfers: {
        Row: {
          approved_by: string | null;
          company_id: string;
          created_at: string;
          from_location_id: string | null;
          from_warehouse_id: string;
          id: string;
          quantity: number;
          reason: string | null;
          requested_by: string | null;
          status: string;
          stock_id: string;
          to_location_id: string | null;
          to_warehouse_id: string;
          transfer_type: string;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          from_location_id?: string | null;
          from_warehouse_id: string;
          id?: string;
          quantity: number;
          reason?: string | null;
          requested_by?: string | null;
          status?: string;
          stock_id: string;
          to_location_id?: string | null;
          to_warehouse_id: string;
          transfer_type: string;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          from_location_id?: string | null;
          from_warehouse_id?: string;
          id?: string;
          quantity?: number;
          reason?: string | null;
          requested_by?: string | null;
          status?: string;
          stock_id?: string;
          to_location_id?: string | null;
          to_warehouse_id?: string;
          transfer_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_transfers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_transfers_from_location_id_fkey";
            columns: ["from_location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_transfers_from_warehouse_id_fkey";
            columns: ["from_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_transfers_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_transfers_to_location_id_fkey";
            columns: ["to_location_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_transfers_to_warehouse_id_fkey";
            columns: ["to_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouse_zones: {
        Row: {
          accepts_hazardous: boolean;
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          temperature_max_c: number | null;
          temperature_min_c: number | null;
          updated_at: string;
          warehouse_id: string;
          zone_type: string;
        };
        Insert: {
          accepts_hazardous?: boolean;
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          updated_at?: string;
          warehouse_id: string;
          zone_type?: string;
        };
        Update: {
          accepts_hazardous?: boolean;
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          updated_at?: string;
          warehouse_id?: string;
          zone_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_zones_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_zones_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      warehouses: {
        Row: {
          address: string | null;
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          is_temperature_controlled: boolean;
          max_volume_m3: number | null;
          max_weight_kg: number | null;
          name: string;
          status: string;
          temperature_max_c: number | null;
          temperature_min_c: number | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          is_temperature_controlled?: boolean;
          max_volume_m3?: number | null;
          max_weight_kg?: number | null;
          name: string;
          status?: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          is_temperature_controlled?: boolean;
          max_volume_m3?: number | null;
          max_weight_kg?: number | null;
          name?: string;
          status?: string;
          temperature_max_c?: number | null;
          temperature_min_c?: number | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      work_approvals: {
        Row: {
          amount: number | null;
          assigned_role: string | null;
          company_id: string;
          conflict_warnings: Json;
          created_at: string;
          domain: string;
          due_at: string | null;
          evidence: Json;
          id: string;
          impact: string | null;
          owning_rpc: string;
          policy_reference: string | null;
          prior_approvals: Json;
          requester_id: string;
          source_id: string;
          source_type: string;
          stage: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount?: number | null;
          assigned_role?: string | null;
          company_id: string;
          conflict_warnings?: Json;
          created_at?: string;
          domain: string;
          due_at?: string | null;
          evidence?: Json;
          id?: string;
          impact?: string | null;
          owning_rpc: string;
          policy_reference?: string | null;
          prior_approvals?: Json;
          requester_id: string;
          source_id: string;
          source_type: string;
          stage: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number | null;
          assigned_role?: string | null;
          company_id?: string;
          conflict_warnings?: Json;
          created_at?: string;
          domain?: string;
          due_at?: string | null;
          evidence?: Json;
          id?: string;
          impact?: string | null;
          owning_rpc?: string;
          policy_reference?: string | null;
          prior_approvals?: Json;
          requester_id?: string;
          source_id?: string;
          source_type?: string;
          stage?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_approvals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      work_escalations: {
        Row: {
          category: string;
          closure_verified_by: string | null;
          company_id: string;
          created_at: string;
          created_by: string;
          escalation_level: string;
          id: string;
          owner_id: string | null;
          reason: string;
          related_records: Json;
          required_response: string | null;
          resolution: string | null;
          severity: string;
          sla_due_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          closure_verified_by?: string | null;
          company_id: string;
          created_at?: string;
          created_by: string;
          escalation_level: string;
          id?: string;
          owner_id?: string | null;
          reason: string;
          related_records?: Json;
          required_response?: string | null;
          resolution?: string | null;
          severity: string;
          sla_due_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          closure_verified_by?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          escalation_level?: string;
          id?: string;
          owner_id?: string | null;
          reason?: string;
          related_records?: Json;
          required_response?: string | null;
          resolution?: string | null;
          severity?: string;
          sla_due_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_escalations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      work_task_dependencies: {
        Row: {
          company_id: string;
          created_at: string;
          depends_on_task_id: string;
          id: string;
          task_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          depends_on_task_id: string;
          id?: string;
          task_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          depends_on_task_id?: string;
          id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_task_dependencies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_task_dependencies_depends_on_task_id_fkey";
            columns: ["depends_on_task_id"];
            isOneToOne: false;
            referencedRelation: "work_tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_task_dependencies_task_company_fk";
            columns: ["task_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "work_tasks";
            referencedColumns: ["id", "company_id"];
          },
        ];
      };
      work_tasks: {
        Row: {
          checklist: Json;
          company_id: string;
          completion_reason: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_at: string | null;
          escalation_state: string | null;
          evidence: Json;
          id: string;
          owner_id: string | null;
          priority: string;
          related_entity_id: string | null;
          related_entity_type: string;
          source_id: string | null;
          source_type: string | null;
          status: string;
          team_key: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          checklist?: Json;
          company_id: string;
          completion_reason?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_at?: string | null;
          escalation_state?: string | null;
          evidence?: Json;
          id?: string;
          owner_id?: string | null;
          priority?: string;
          related_entity_id?: string | null;
          related_entity_type: string;
          source_id?: string | null;
          source_type?: string | null;
          status?: string;
          team_key?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          checklist?: Json;
          company_id?: string;
          completion_reason?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_at?: string | null;
          escalation_state?: string | null;
          evidence?: Json;
          id?: string;
          owner_id?: string | null;
          priority?: string;
          related_entity_id?: string | null;
          related_entity_type?: string;
          source_id?: string | null;
          source_type?: string | null;
          status?: string;
          team_key?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_tasks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_automation_actions: {
        Row: {
          action_type: string;
          company_id: string;
          created_at: string;
          human_approved_by: string | null;
          id: string;
          run_id: string;
          status: string;
          target_reference: Json;
        };
        Insert: {
          action_type: string;
          company_id: string;
          created_at?: string;
          human_approved_by?: string | null;
          id?: string;
          run_id: string;
          status: string;
          target_reference?: Json;
        };
        Update: {
          action_type?: string;
          company_id?: string;
          created_at?: string;
          human_approved_by?: string | null;
          id?: string;
          run_id?: string;
          status?: string;
          target_reference?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_actions_run_company_fk";
            columns: ["run_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "workflow_automation_runs";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "workflow_automation_actions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_automation_definitions: {
        Row: {
          active_version_id: string | null;
          company_id: string;
          created_at: string;
          id: string;
          lifecycle: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          active_version_id?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          lifecycle?: string;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          active_version_id?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          lifecycle?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_active_version_fk";
            columns: ["active_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_automation_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_automation_definitions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_automation_runs: {
        Row: {
          automation_version_id: string;
          company_id: string;
          completed_at: string | null;
          condition_result: Json;
          id: string;
          loop_path: Json;
          mode: string;
          phase22_event_id: string | null;
          started_at: string;
          status: string;
          trigger_result: Json;
        };
        Insert: {
          automation_version_id: string;
          company_id: string;
          completed_at?: string | null;
          condition_result?: Json;
          id?: string;
          loop_path?: Json;
          mode: string;
          phase22_event_id?: string | null;
          started_at?: string;
          status: string;
          trigger_result?: Json;
        };
        Update: {
          automation_version_id?: string;
          company_id?: string;
          completed_at?: string | null;
          condition_result?: Json;
          id?: string;
          loop_path?: Json;
          mode?: string;
          phase22_event_id?: string | null;
          started_at?: string;
          status?: string;
          trigger_result?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_automation_runs_automation_version_id_fkey";
            columns: ["automation_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_automation_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_automation_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_automation_runs_phase22_event_id_fkey";
            columns: ["phase22_event_id"];
            isOneToOne: false;
            referencedRelation: "integration_event_bus";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_automation_versions: {
        Row: {
          actions: Json;
          allowed_domains: Json;
          approved_at: string | null;
          company_id: string;
          conditions: Json;
          created_at: string;
          definition_id: string;
          execution_limit: number;
          failure_policy: string;
          id: string;
          immutable: boolean;
          reviewer_id: string | null;
          simulation_result: Json;
          trigger_config: Json;
          version: number;
        };
        Insert: {
          actions?: Json;
          allowed_domains?: Json;
          approved_at?: string | null;
          company_id: string;
          conditions?: Json;
          created_at?: string;
          definition_id: string;
          execution_limit?: number;
          failure_policy?: string;
          id?: string;
          immutable?: boolean;
          reviewer_id?: string | null;
          simulation_result?: Json;
          trigger_config: Json;
          version: number;
        };
        Update: {
          actions?: Json;
          allowed_domains?: Json;
          approved_at?: string | null;
          company_id?: string;
          conditions?: Json;
          created_at?: string;
          definition_id?: string;
          execution_limit?: number;
          failure_policy?: string;
          id?: string;
          immutable?: boolean;
          reviewer_id?: string | null;
          simulation_result?: Json;
          trigger_config?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_automation_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_automation_versions_definition_id_fkey";
            columns: ["definition_id"];
            isOneToOne: false;
            referencedRelation: "workflow_automation_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      zapp_brain_feedback: {
        Row: {
          company_id: string;
          created_at: string;
          feedback: string;
          id: string;
          insight_id: string;
          note: string | null;
          reason_label: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          feedback: string;
          id?: string;
          insight_id: string;
          note?: string | null;
          reason_label?: string;
          user_id?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          feedback?: string;
          id?: string;
          insight_id?: string;
          note?: string | null;
          reason_label?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zapp_brain_feedback_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zapp_brain_feedback_company_insight_fkey";
            columns: ["company_id", "insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zapp_brain_feedback_insight_id_fkey";
            columns: ["insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["id"];
          },
        ];
      };
      zapp_brain_insights: {
        Row: {
          affected_entities: Json;
          category: string;
          company_id: string;
          confidence: string;
          confidence_score: number | null;
          created_at: string;
          data_freshness: string | null;
          evidence: Json;
          evidence_coverage: number | null;
          expires_at: string | null;
          explanation: string | null;
          generated_at: string | null;
          id: string;
          recommendation: string | null;
          rule_code: string | null;
          run_id: string | null;
          sensitivity_classification: string | null;
          severity: string;
          source: string;
          source_module: string | null;
          source_record_id: string | null;
          source_record_type: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          affected_entities?: Json;
          category: string;
          company_id: string;
          confidence?: string;
          confidence_score?: number | null;
          created_at?: string;
          data_freshness?: string | null;
          evidence?: Json;
          evidence_coverage?: number | null;
          expires_at?: string | null;
          explanation?: string | null;
          generated_at?: string | null;
          id?: string;
          recommendation?: string | null;
          rule_code?: string | null;
          run_id?: string | null;
          sensitivity_classification?: string | null;
          severity: string;
          source?: string;
          source_module?: string | null;
          source_record_id?: string | null;
          source_record_type?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          affected_entities?: Json;
          category?: string;
          company_id?: string;
          confidence?: string;
          confidence_score?: number | null;
          created_at?: string;
          data_freshness?: string | null;
          evidence?: Json;
          evidence_coverage?: number | null;
          expires_at?: string | null;
          explanation?: string | null;
          generated_at?: string | null;
          id?: string;
          recommendation?: string | null;
          rule_code?: string | null;
          run_id?: string | null;
          sensitivity_classification?: string | null;
          severity?: string;
          source?: string;
          source_module?: string | null;
          source_record_id?: string | null;
          source_record_type?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zapp_brain_insights_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zapp_brain_insights_company_run_fkey";
            columns: ["company_id", "run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zapp_brain_insights_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      zapp_brain_learning_records: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          feedback_id: string | null;
          id: string;
          insight_id: string | null;
          label: string;
          learning_type: string;
          payload: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          feedback_id?: string | null;
          id?: string;
          insight_id?: string | null;
          label?: string;
          learning_type?: string;
          payload?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          feedback_id?: string | null;
          id?: string;
          insight_id?: string | null;
          label?: string;
          learning_type?: string;
          payload?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "zapp_brain_learning_records_company_feedback_fkey";
            columns: ["company_id", "feedback_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_feedback";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zapp_brain_learning_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zapp_brain_learning_records_company_insight_fkey";
            columns: ["company_id", "insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zapp_brain_learning_records_feedback_id_fkey";
            columns: ["feedback_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_feedback";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zapp_brain_learning_records_insight_id_fkey";
            columns: ["insight_id"];
            isOneToOne: false;
            referencedRelation: "zapp_brain_insights";
            referencedColumns: ["id"];
          },
        ];
      };
      zapp_brain_runs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error_message: string | null;
          generated_insight_count: number;
          id: string;
          input_summary: Json;
          output_summary: Json;
          source: string;
          stale_insight_count: number;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          generated_insight_count?: number;
          id?: string;
          input_summary?: Json;
          output_summary?: Json;
          source?: string;
          stale_insight_count?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          generated_insight_count?: number;
          id?: string;
          input_summary?: Json;
          output_summary?: Json;
          source?: string;
          stale_insight_count?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zapp_brain_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_agent_registry: {
        Row: {
          agent_code: string;
          approved_by: string | null;
          autonomous_actions_allowed: boolean;
          company_id: string;
          created_at: string;
          id: string;
          module_code: string;
          owner_id: string;
          purpose: string;
          reviewer_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          agent_code: string;
          approved_by?: string | null;
          autonomous_actions_allowed?: boolean;
          company_id: string;
          created_at?: string;
          id?: string;
          module_code: string;
          owner_id: string;
          purpose: string;
          reviewer_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          agent_code?: string;
          approved_by?: string | null;
          autonomous_actions_allowed?: boolean;
          company_id?: string;
          created_at?: string;
          id?: string;
          module_code?: string;
          owner_id?: string;
          purpose?: string;
          reviewer_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_agent_registry_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_agent_runs: {
        Row: {
          agent_id: string;
          api_request_id: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          recommendation_redacted: string | null;
          requires_human_review: boolean;
          status: string;
        };
        Insert: {
          agent_id: string;
          api_request_id?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          recommendation_redacted?: string | null;
          requires_human_review?: boolean;
          status?: string;
        };
        Update: {
          agent_id?: string;
          api_request_id?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          recommendation_redacted?: string | null;
          requires_human_review?: boolean;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_agent_runs_company_id_agent_id_fkey";
            columns: ["company_id", "agent_id"];
            isOneToOne: false;
            referencedRelation: "zip_agent_registry";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_agent_runs_company_id_api_request_id_fkey";
            columns: ["company_id", "api_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_requests";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_ai_evaluations: {
        Row: {
          availability: string;
          company_id: string;
          created_at: string;
          evaluated_by: string | null;
          evaluation_type: string;
          id: string;
          measurement_metadata: Json;
          response_id: string | null;
          score: number | null;
        };
        Insert: {
          availability: string;
          company_id: string;
          created_at?: string;
          evaluated_by?: string | null;
          evaluation_type: string;
          id?: string;
          measurement_metadata?: Json;
          response_id?: string | null;
          score?: number | null;
        };
        Update: {
          availability?: string;
          company_id?: string;
          created_at?: string;
          evaluated_by?: string | null;
          evaluation_type?: string;
          id?: string;
          measurement_metadata?: Json;
          response_id?: string | null;
          score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "zip_ai_evaluations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zip_ai_evaluations_company_id_response_id_fkey";
            columns: ["company_id", "response_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_responses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_audit_logs: {
        Row: {
          actor_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          company_id: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          actor_id?: string | null;
          company_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "zip_audit_logs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_chat_messages: {
        Row: {
          api_request_id: string | null;
          company_id: string;
          content_hash: string;
          content_redacted: string;
          created_at: string;
          id: string;
          response_id: string | null;
          sender_type: string;
          session_id: string;
        };
        Insert: {
          api_request_id?: string | null;
          company_id: string;
          content_hash: string;
          content_redacted: string;
          created_at?: string;
          id?: string;
          response_id?: string | null;
          sender_type: string;
          session_id: string;
        };
        Update: {
          api_request_id?: string | null;
          company_id?: string;
          content_hash?: string;
          content_redacted?: string;
          created_at?: string;
          id?: string;
          response_id?: string | null;
          sender_type?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_chat_messages_company_id_api_request_id_fkey";
            columns: ["company_id", "api_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_requests";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_chat_messages_company_id_response_id_fkey";
            columns: ["company_id", "response_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_responses";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_chat_messages_company_id_session_id_fkey";
            columns: ["company_id", "session_id"];
            isOneToOne: false;
            referencedRelation: "zip_chat_sessions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_chat_sessions: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          source_module: string;
          status: string;
          title_redacted: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          source_module: string;
          status?: string;
          title_redacted?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          source_module?: string;
          status?: string;
          title_redacted?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_chat_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_copilot_profiles: {
        Row: {
          allowed_dataset_contract_ids: Json;
          allowed_prompt_version_ids: Json;
          company_id: string;
          created_at: string;
          enabled: boolean;
          id: string;
          module_code: string;
          name: string;
          owner_id: string;
          purpose: string;
          reviewer_id: string | null;
          updated_at: string;
        };
        Insert: {
          allowed_dataset_contract_ids?: Json;
          allowed_prompt_version_ids?: Json;
          company_id: string;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          module_code: string;
          name: string;
          owner_id: string;
          purpose: string;
          reviewer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          allowed_dataset_contract_ids?: Json;
          allowed_prompt_version_ids?: Json;
          company_id?: string;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          module_code?: string;
          name?: string;
          owner_id?: string;
          purpose?: string;
          reviewer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_copilot_profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_executive_briefings: {
        Row: {
          briefing_date: string;
          company_id: string;
          confidence: number | null;
          created_at: string;
          generated_by: string;
          id: string;
          period_end: string;
          period_start: string;
          recommended_reviews: Json;
          reviewed_at: string | null;
          reviewed_by: string | null;
          risks: Json;
          status: string;
          summary_redacted: string | null;
        };
        Insert: {
          briefing_date: string;
          company_id: string;
          confidence?: number | null;
          created_at?: string;
          generated_by: string;
          id?: string;
          period_end: string;
          period_start: string;
          recommended_reviews?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risks?: Json;
          status?: string;
          summary_redacted?: string | null;
        };
        Update: {
          briefing_date?: string;
          company_id?: string;
          confidence?: number | null;
          created_at?: string;
          generated_by?: string;
          id?: string;
          period_end?: string;
          period_start?: string;
          recommended_reviews?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risks?: Json;
          status?: string;
          summary_redacted?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "zip_executive_briefings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_intelligence_api_requests: {
        Row: {
          blocked_reason: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          prompt_version_id: string | null;
          question_hash: string;
          question_redacted: string;
          request_kind: string;
          request_token: string;
          requested_by: string;
          retrieval_request_id: string | null;
          source_module: string;
          status: string;
          subject_reference: Json;
        };
        Insert: {
          blocked_reason?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          prompt_version_id?: string | null;
          question_hash: string;
          question_redacted: string;
          request_kind: string;
          request_token: string;
          requested_by: string;
          retrieval_request_id?: string | null;
          source_module: string;
          status?: string;
          subject_reference?: Json;
        };
        Update: {
          blocked_reason?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          prompt_version_id?: string | null;
          question_hash?: string;
          question_redacted?: string;
          request_kind?: string;
          request_token?: string;
          requested_by?: string;
          retrieval_request_id?: string | null;
          source_module?: string;
          status?: string;
          subject_reference?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "zip_intelligence_api_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zip_intelligence_api_requests_company_id_prompt_version_id_fkey";
            columns: ["company_id", "prompt_version_id"];
            isOneToOne: false;
            referencedRelation: "zip_prompt_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_intelligence_api_requests_company_id_retrieval_request_fkey";
            columns: ["company_id", "retrieval_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_retrieval_requests";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_intelligence_api_responses: {
        Row: {
          advisory_only: boolean;
          company_id: string;
          confidence: number | null;
          created_at: string;
          explanation_redacted: string | null;
          generated_by: string;
          id: string;
          insight_redacted: string | null;
          priority: string;
          recommendation_redacted: string | null;
          related_records: Json;
          request_id: string;
          state: string;
          unknowns: Json;
        };
        Insert: {
          advisory_only?: boolean;
          company_id: string;
          confidence?: number | null;
          created_at?: string;
          explanation_redacted?: string | null;
          generated_by: string;
          id?: string;
          insight_redacted?: string | null;
          priority: string;
          recommendation_redacted?: string | null;
          related_records?: Json;
          request_id: string;
          state: string;
          unknowns?: Json;
        };
        Update: {
          advisory_only?: boolean;
          company_id?: string;
          confidence?: number | null;
          created_at?: string;
          explanation_redacted?: string | null;
          generated_by?: string;
          id?: string;
          insight_redacted?: string | null;
          priority?: string;
          recommendation_redacted?: string | null;
          related_records?: Json;
          request_id?: string;
          state?: string;
          unknowns?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "zip_intelligence_api_responses_company_id_request_id_fkey";
            columns: ["company_id", "request_id"];
            isOneToOne: true;
            referencedRelation: "zip_intelligence_api_requests";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_intelligence_response_citations: {
        Row: {
          claim_reference: string | null;
          company_id: string;
          created_at: string;
          id: string;
          knowledge_chunk_id: string | null;
          response_id: string;
          retrieval_citation_id: string | null;
        };
        Insert: {
          claim_reference?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          knowledge_chunk_id?: string | null;
          response_id: string;
          retrieval_citation_id?: string | null;
        };
        Update: {
          claim_reference?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          knowledge_chunk_id?: string | null;
          response_id?: string;
          retrieval_citation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "zip_intelligence_response_cit_company_id_knowledge_chunk_i_fkey";
            columns: ["company_id", "knowledge_chunk_id"];
            isOneToOne: false;
            referencedRelation: "zip_knowledge_chunks";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_intelligence_response_cit_company_id_retrieval_citatio_fkey";
            columns: ["company_id", "retrieval_citation_id"];
            isOneToOne: false;
            referencedRelation: "zip_retrieval_citations";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_intelligence_response_citations_company_id_response_id_fkey";
            columns: ["company_id", "response_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_responses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_knowledge_chunks: {
        Row: {
          chunk_index: number;
          company_id: string;
          content_hash: string;
          content_redacted: string;
          created_at: string;
          document_version_id: string;
          embedding_model: string | null;
          embedding_provider: string | null;
          embedding_reference: string | null;
          embedding_status: string;
          id: string;
          lexical_terms: Json;
          token_count: number | null;
        };
        Insert: {
          chunk_index: number;
          company_id: string;
          content_hash: string;
          content_redacted: string;
          created_at?: string;
          document_version_id: string;
          embedding_model?: string | null;
          embedding_provider?: string | null;
          embedding_reference?: string | null;
          embedding_status?: string;
          id?: string;
          lexical_terms?: Json;
          token_count?: number | null;
        };
        Update: {
          chunk_index?: number;
          company_id?: string;
          content_hash?: string;
          content_redacted?: string;
          created_at?: string;
          document_version_id?: string;
          embedding_model?: string | null;
          embedding_provider?: string | null;
          embedding_reference?: string | null;
          embedding_status?: string;
          id?: string;
          lexical_terms?: Json;
          token_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "zip_knowledge_chunks_company_id_document_version_id_fkey";
            columns: ["company_id", "document_version_id"];
            isOneToOne: false;
            referencedRelation: "zip_knowledge_document_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_knowledge_document_versions: {
        Row: {
          approved_by: string | null;
          company_id: string;
          created_at: string;
          data_classification: string;
          document_id: string;
          extracted_content_redacted: string;
          id: string;
          indexed_at: string | null;
          owner_id: string;
          reviewer_id: string | null;
          source_content_hash: string;
          status: string;
          version: number;
        };
        Insert: {
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          data_classification: string;
          document_id: string;
          extracted_content_redacted: string;
          id?: string;
          indexed_at?: string | null;
          owner_id: string;
          reviewer_id?: string | null;
          source_content_hash: string;
          status?: string;
          version: number;
        };
        Update: {
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          data_classification?: string;
          document_id?: string;
          extracted_content_redacted?: string;
          id?: string;
          indexed_at?: string | null;
          owner_id?: string;
          reviewer_id?: string | null;
          source_content_hash?: string;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "zip_knowledge_document_versions_company_id_document_id_fkey";
            columns: ["company_id", "document_id"];
            isOneToOne: false;
            referencedRelation: "zip_knowledge_documents";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_knowledge_documents: {
        Row: {
          company_id: string;
          created_at: string;
          current_version_id: string | null;
          document_code: string;
          id: string;
          source_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          current_version_id?: string | null;
          document_code: string;
          id?: string;
          source_id: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          current_version_id?: string | null;
          document_code?: string;
          id?: string;
          source_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_knowledge_documents_company_id_source_id_fkey";
            columns: ["company_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "zip_knowledge_sources";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_knowledge_documents_current_version_fk";
            columns: ["company_id", "current_version_id"];
            isOneToOne: false;
            referencedRelation: "zip_knowledge_document_versions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_knowledge_sources: {
        Row: {
          allowed_roles: Json;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          data_classification: string;
          id: string;
          owner_id: string;
          owning_module: string;
          reviewer_id: string | null;
          source_record_id: string | null;
          source_type: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          allowed_roles?: Json;
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          data_classification: string;
          id?: string;
          owner_id: string;
          owning_module: string;
          reviewer_id?: string | null;
          source_record_id?: string | null;
          source_type: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          allowed_roles?: Json;
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          data_classification?: string;
          id?: string;
          owner_id?: string;
          owning_module?: string;
          reviewer_id?: string | null;
          source_record_id?: string | null;
          source_type?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_knowledge_sources_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_memory_records: {
        Row: {
          company_id: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          memory_key: string;
          memory_scope: string;
          session_id: string | null;
          status: string;
          team_reference: string | null;
          updated_at: string;
          user_id: string | null;
          value_hash: string;
          value_redacted: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          memory_key: string;
          memory_scope: string;
          session_id?: string | null;
          status?: string;
          team_reference?: string | null;
          updated_at?: string;
          user_id?: string | null;
          value_hash: string;
          value_redacted: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          memory_key?: string;
          memory_scope?: string;
          session_id?: string | null;
          status?: string;
          team_reference?: string | null;
          updated_at?: string;
          user_id?: string | null;
          value_hash?: string;
          value_redacted?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_memory_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_model_deployment_metadata: {
        Row: {
          company_id: string;
          created_at: string;
          deployment_status: string;
          evaluation_metadata: Json;
          fine_tuning_metadata: Json;
          id: string;
          model_registry_id: string | null;
          purpose: string;
          rollback_metadata: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          deployment_status?: string;
          evaluation_metadata?: Json;
          fine_tuning_metadata?: Json;
          id?: string;
          model_registry_id?: string | null;
          purpose: string;
          rollback_metadata?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          deployment_status?: string;
          evaluation_metadata?: Json;
          fine_tuning_metadata?: Json;
          id?: string;
          model_registry_id?: string | null;
          purpose?: string;
          rollback_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "zip_model_deployment_metadata_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_prompt_templates: {
        Row: {
          company_id: string;
          created_at: string;
          data_classification_limit: string;
          id: string;
          name: string;
          owner_id: string;
          prompt_code: string;
          purpose: string;
          target_module: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          data_classification_limit: string;
          id?: string;
          name: string;
          owner_id: string;
          prompt_code: string;
          purpose: string;
          target_module: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          data_classification_limit?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          prompt_code?: string;
          purpose?: string;
          target_module?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_prompt_templates_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_prompt_versions: {
        Row: {
          allowed_dataset_contract_ids: Json;
          approved_by: string | null;
          body_template: string;
          company_id: string;
          created_at: string;
          expected_input_schema: Json;
          expected_output_schema: Json;
          id: string;
          owner_id: string;
          prompt_template_id: string;
          redaction_rules: Json;
          review_note: string | null;
          reviewer_id: string | null;
          safety_metadata: Json;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          allowed_dataset_contract_ids?: Json;
          approved_by?: string | null;
          body_template: string;
          company_id: string;
          created_at?: string;
          expected_input_schema?: Json;
          expected_output_schema?: Json;
          id?: string;
          owner_id: string;
          prompt_template_id: string;
          redaction_rules?: Json;
          review_note?: string | null;
          reviewer_id?: string | null;
          safety_metadata?: Json;
          status?: string;
          updated_at?: string;
          version: number;
        };
        Update: {
          allowed_dataset_contract_ids?: Json;
          approved_by?: string | null;
          body_template?: string;
          company_id?: string;
          created_at?: string;
          expected_input_schema?: Json;
          expected_output_schema?: Json;
          id?: string;
          owner_id?: string;
          prompt_template_id?: string;
          redaction_rules?: Json;
          review_note?: string | null;
          reviewer_id?: string | null;
          safety_metadata?: Json;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "zip_prompt_versions_company_id_prompt_template_id_fkey";
            columns: ["company_id", "prompt_template_id"];
            isOneToOne: false;
            referencedRelation: "zip_prompt_templates";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_provider_configurations: {
        Row: {
          allowed_prompt_version_ids: Json;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          enabled: boolean;
          environment: string;
          id: string;
          maximum_data_classification: string;
          model_reference: string;
          owner_id: string;
          production_enabled: boolean;
          provider_code: string;
          reviewer_id: string | null;
          secret_reference: string | null;
          updated_at: string;
        };
        Insert: {
          allowed_prompt_version_ids?: Json;
          approved_by?: string | null;
          company_id: string;
          created_at?: string;
          enabled?: boolean;
          environment: string;
          id?: string;
          maximum_data_classification?: string;
          model_reference: string;
          owner_id: string;
          production_enabled?: boolean;
          provider_code: string;
          reviewer_id?: string | null;
          secret_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          allowed_prompt_version_ids?: Json;
          approved_by?: string | null;
          company_id?: string;
          created_at?: string;
          enabled?: boolean;
          environment?: string;
          id?: string;
          maximum_data_classification?: string;
          model_reference?: string;
          owner_id?: string;
          production_enabled?: boolean;
          provider_code?: string;
          reviewer_id?: string | null;
          secret_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_provider_configurations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_provider_gateway_calls: {
        Row: {
          company_id: string;
          cost_amount: number | null;
          created_at: string;
          duration_ms: number | null;
          failure_classification: string | null;
          gateway_request_id: string;
          id: string;
          input_token_count: number | null;
          model_reference: string;
          output_token_count: number | null;
          provider_code: string;
          response_hash: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          cost_amount?: number | null;
          created_at?: string;
          duration_ms?: number | null;
          failure_classification?: string | null;
          gateway_request_id: string;
          id?: string;
          input_token_count?: number | null;
          model_reference: string;
          output_token_count?: number | null;
          provider_code: string;
          response_hash?: string | null;
          status: string;
        };
        Update: {
          company_id?: string;
          cost_amount?: number | null;
          created_at?: string;
          duration_ms?: number | null;
          failure_classification?: string | null;
          gateway_request_id?: string;
          id?: string;
          input_token_count?: number | null;
          model_reference?: string;
          output_token_count?: number | null;
          provider_code?: string;
          response_hash?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_provider_gateway_calls_company_id_gateway_request_id_fkey";
            columns: ["company_id", "gateway_request_id"];
            isOneToOne: true;
            referencedRelation: "zip_provider_gateway_requests";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_provider_gateway_requests: {
        Row: {
          api_request_id: string | null;
          blocked_reason: string | null;
          classification_checked: string;
          company_id: string;
          completed_at: string | null;
          environment: string;
          id: string;
          input_hash: string;
          prompt_version_id: string | null;
          provider_configuration_id: string | null;
          redaction_metadata: Json;
          requested_at: string;
          safety_check_status: string;
          status: string;
        };
        Insert: {
          api_request_id?: string | null;
          blocked_reason?: string | null;
          classification_checked: string;
          company_id: string;
          completed_at?: string | null;
          environment: string;
          id?: string;
          input_hash: string;
          prompt_version_id?: string | null;
          provider_configuration_id?: string | null;
          redaction_metadata?: Json;
          requested_at?: string;
          safety_check_status?: string;
          status?: string;
        };
        Update: {
          api_request_id?: string | null;
          blocked_reason?: string | null;
          classification_checked?: string;
          company_id?: string;
          completed_at?: string | null;
          environment?: string;
          id?: string;
          input_hash?: string;
          prompt_version_id?: string | null;
          provider_configuration_id?: string | null;
          redaction_metadata?: Json;
          requested_at?: string;
          safety_check_status?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_provider_gateway_requests_company_id_api_request_id_fkey";
            columns: ["company_id", "api_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_requests";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_provider_gateway_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zip_provider_gateway_requests_company_id_prompt_version_id_fkey";
            columns: ["company_id", "prompt_version_id"];
            isOneToOne: false;
            referencedRelation: "zip_prompt_versions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_provider_gateway_requests_company_id_provider_configur_fkey";
            columns: ["company_id", "provider_configuration_id"];
            isOneToOne: false;
            referencedRelation: "zip_provider_configurations";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_retrieval_citations: {
        Row: {
          company_id: string;
          created_at: string;
          excerpt_redacted: string;
          id: string;
          knowledge_chunk_id: string;
          rank: number;
          retrieval_request_id: string;
          score: number | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          excerpt_redacted: string;
          id?: string;
          knowledge_chunk_id: string;
          rank: number;
          retrieval_request_id: string;
          score?: number | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          excerpt_redacted?: string;
          id?: string;
          knowledge_chunk_id?: string;
          rank?: number;
          retrieval_request_id?: string;
          score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "zip_retrieval_citations_company_id_knowledge_chunk_id_fkey";
            columns: ["company_id", "knowledge_chunk_id"];
            isOneToOne: false;
            referencedRelation: "zip_knowledge_chunks";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_retrieval_citations_company_id_retrieval_request_id_fkey";
            columns: ["company_id", "retrieval_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_retrieval_requests";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_retrieval_requests: {
        Row: {
          blocked_reason: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          query_hash: string;
          query_redacted: string;
          requested_by: string;
          requested_classification: string;
          source_module: string;
          status: string;
        };
        Insert: {
          blocked_reason?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          query_hash: string;
          query_redacted: string;
          requested_by: string;
          requested_classification: string;
          source_module: string;
          status?: string;
        };
        Update: {
          blocked_reason?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          query_hash?: string;
          query_redacted?: string;
          requested_by?: string;
          requested_classification?: string;
          source_module?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_retrieval_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      zip_safety_assessments: {
        Row: {
          action: string;
          api_request_id: string | null;
          assessment_type: string;
          company_id: string;
          created_at: string;
          findings_redacted: Json;
          gateway_request_id: string | null;
          id: string;
          status: string;
        };
        Insert: {
          action: string;
          api_request_id?: string | null;
          assessment_type: string;
          company_id: string;
          created_at?: string;
          findings_redacted?: Json;
          gateway_request_id?: string | null;
          id?: string;
          status: string;
        };
        Update: {
          action?: string;
          api_request_id?: string | null;
          assessment_type?: string;
          company_id?: string;
          created_at?: string;
          findings_redacted?: Json;
          gateway_request_id?: string | null;
          id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_safety_assessments_company_id_api_request_id_fkey";
            columns: ["company_id", "api_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_requests";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "zip_safety_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zip_safety_assessments_company_id_gateway_request_id_fkey";
            columns: ["company_id", "gateway_request_id"];
            isOneToOne: false;
            referencedRelation: "zip_provider_gateway_requests";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      zip_user_feedback: {
        Row: {
          company_id: string;
          created_at: string;
          feedback: string;
          id: string;
          note_redacted: string | null;
          response_id: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          feedback: string;
          id?: string;
          note_redacted?: string | null;
          response_id: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          feedback?: string;
          id?: string;
          note_redacted?: string | null;
          response_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zip_user_feedback_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "zip_user_feedback_company_id_response_id_fkey";
            columns: ["company_id", "response_id"];
            isOneToOne: false;
            referencedRelation: "zip_intelligence_api_responses";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
    };
    Views: {
      reliability_integration_health_source: {
        Row: {
          checked_at: string | null;
          company_id: string | null;
          detail_metadata: Json | null;
          health_area: string | null;
          integration_id: string | null;
          status: string | null;
        };
        Insert: {
          checked_at?: string | null;
          company_id?: string | null;
          detail_metadata?: Json | null;
          health_area?: string | null;
          integration_id?: string | null;
          status?: string | null;
        };
        Update: {
          checked_at?: string | null;
          company_id?: string | null;
          detail_metadata?: Json | null;
          health_area?: string | null;
          integration_id?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_health_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_health_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integration_registry";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_phase22_dlq_health: {
        Row: {
          backlog: number | null;
          company_id: string | null;
          oldest_due: string | null;
          source: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_dead_letter_queue_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      reliability_phase22_queue_health: {
        Row: {
          backlog: number | null;
          company_id: string | null;
          failures: number | null;
          oldest_due: string | null;
          source: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_retry_queue_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      assign_job_with_conflict_check: {
        Args: {
          _admin_override?: boolean;
          _driver_id: string;
          _job_id: string;
          _vehicle_id: string;
        };
        Returns: Json;
      };
      bi_can_read_report: { Args: { _report_id: string }; Returns: boolean };
      bi_can_write_report: { Args: { _report_id: string }; Returns: boolean };
      bi_dataset_allowed: {
        Args: { _company_id: string; _dataset_code: string };
        Returns: boolean;
      };
      bi_department_scope_allowed: {
        Args: { _company_id: string; _department_id: string };
        Returns: boolean;
      };
      bi_domain_allowed: {
        Args: { _company_id: string; _domain: string };
        Returns: boolean;
      };
      bi_is_executive: { Args: { _company_id: string }; Returns: boolean };
      bi_is_internal_reader: { Args: { _company_id: string }; Returns: boolean };
      bi_is_manager: { Args: { _company_id: string }; Returns: boolean };
      bi_report_is_signed: { Args: { _report_id: string }; Returns: boolean };
      bi_scope_allowed: {
        Args: { _company_id: string; _scope_id: string; _scope_type: string };
        Returns: boolean;
      };
      brain_contract_visible: {
        Args: { _classification: string; _company_id: string };
        Returns: boolean;
      };
      brain_is_administrator: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_analyst: { Args: { _company_id: string }; Returns: boolean };
      brain_is_evaluation_administrator: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_evaluation_analyst: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_evaluation_reader: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_evaluation_reviewer: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_internal_reader: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_ops_admin: { Args: { _company_id: string }; Returns: boolean };
      brain_is_ops_analyst: { Args: { _company_id: string }; Returns: boolean };
      brain_is_ops_executive: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      brain_is_ops_reader: { Args: { _company_id: string }; Returns: boolean };
      brain_is_ops_reviewer: { Args: { _company_id: string }; Returns: boolean };
      brain_is_reviewer: { Args: { _company_id: string }; Returns: boolean };
      brain_is_service: { Args: { _company_id: string }; Returns: boolean };
      claim_brain_job: {
        Args: {
          p_company_id: string;
          p_environment: string;
          p_job_id?: string;
          p_lease_seconds?: number;
          p_worker_id: string;
        };
        Returns: {
          attempt_count: number;
          available_at: string;
          brain_run_id: string | null;
          cancelled_at: string | null;
          causation_id: string | null;
          claim_expires_at: string | null;
          claimed_at: string | null;
          claimed_by: string | null;
          company_id: string;
          completed_at: string | null;
          correlation_id: string | null;
          created_at: string;
          dataset_contract_id: string | null;
          dry_run: boolean;
          environment: string;
          error_classification: string | null;
          error_metadata: Json;
          execution_classification: string;
          experimental: boolean;
          failed_at: string | null;
          feature_version_ids: Json;
          id: string;
          idempotency_key: string;
          input_hash: string;
          job_type: string;
          maximum_attempts: number;
          output_hash: string | null;
          phase22_dlq_id: string | null;
          phase22_retry_id: string | null;
          priority: number;
          recovery_of_job_id: string | null;
          requested_by: string | null;
          resource_metadata: Json;
          rule_pack_code: string | null;
          rule_version_ids: Json;
          schedule_id: string | null;
          started_at: string | null;
          status: string;
          trigger_event_id: string | null;
          trigger_type: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "brain_jobs";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      close_tracking_session_for_job: {
        Args: { _job_id: string; _reason?: string };
        Returns: undefined;
      };
      complete_device_fitment_job: {
        Args: { _company_id: string; _fitment_job_id: string };
        Returns: {
          assigned_at: string | null;
          assigned_by: string | null;
          assignment_type: Database["public"]["Enums"]["device_assignment_type"];
          company_id: string;
          created_at: string;
          device_id: string;
          id: string;
          reason: string | null;
          simulated: boolean;
          status: Database["public"]["Enums"]["device_assignment_status"];
          unassigned_at: string | null;
          unassigned_by: string | null;
          updated_at: string;
          vehicle_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "device_vehicle_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      compliance_can_manage: { Args: { _company_id: string }; Returns: boolean };
      compliance_can_operate: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      compliance_can_read: { Args: { _company_id: string }; Returns: boolean };
      compliance_is_own_driver: {
        Args: { _company_id: string; _driver_id: string };
        Returns: boolean;
      };
      compliance_transition_audit: {
        Args: {
          _audit_id: string;
          _note?: string;
          _to_status: Database["public"]["Enums"]["compliance_audit_status"];
        };
        Returns: {
          audit_type: string;
          authority_name: string | null;
          checklist: Json;
          company_id: string;
          completed_date: string | null;
          created_at: string;
          document_id: string | null;
          evidence_metadata: Json;
          id: string;
          lead_auditor_id: string | null;
          planned_date: string | null;
          scope: string;
          status: Database["public"]["Enums"]["compliance_audit_status"];
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "compliance_audits";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      compliance_transition_capa: {
        Args: {
          _capa_id: string;
          _note?: string;
          _to_status: Database["public"]["Enums"]["compliance_capa_status"];
        };
        Returns: {
          audit_finding_id: string | null;
          closed_at: string | null;
          company_id: string;
          corrective_action: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          incident_id: string | null;
          issue: string;
          owner_id: string | null;
          preventive_action: string | null;
          risk_id: string | null;
          root_cause: string | null;
          status: Database["public"]["Enums"]["compliance_capa_status"];
          updated_at: string;
          verification_notes: string | null;
          verified_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "compliance_capa_actions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      compliance_transition_incident: {
        Args: {
          _incident_id: string;
          _note?: string;
          _to_status: Database["public"]["Enums"]["compliance_incident_status"];
        };
        Returns: {
          closed_at: string | null;
          company_id: string;
          corrective_action_summary: string | null;
          created_at: string;
          description: string;
          driver_id: string | null;
          evidence_metadata: Json;
          id: string;
          incident_type: string;
          location: string | null;
          occurred_at: string;
          reporter_id: string | null;
          root_cause: string | null;
          severity: string;
          status: Database["public"]["Enums"]["compliance_incident_status"];
          title: string;
          updated_at: string;
          vehicle_id: string | null;
          verified_by: string | null;
          warehouse_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "compliance_incidents";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      connect_can_write: { Args: { _company_id: string }; Returns: boolean };
      connect_provider_ready: {
        Args: { _channel: string; _company_id: string };
        Returns: boolean;
      };
      connect_thread_access: { Args: { _thread_id: string }; Returns: boolean };
      create_customer_portal_invitation: {
        Args: {
          p_customer_id: string;
          p_email: string;
          p_role?: Database["public"]["Enums"]["customer_portal_role"];
        };
        Returns: Json;
      };
      create_operational_note: {
        Args: {
          _company_id: string;
          _correction_of_note_id?: string;
          _linked_entity_id: string;
          _linked_entity_type: string;
          _note_text: string;
          _visibility_level?: string;
        };
        Returns: {
          author_role: Database["public"]["Enums"]["app_role"];
          author_user_id: string;
          company_id: string;
          correction_of_note_id: string | null;
          created_at: string;
          id: string;
          linked_entity_id: string;
          linked_entity_type: string;
          note_text: string;
          visibility_level: string;
        };
        SetofOptions: {
          from: "*";
          to: "operational_notes";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_shipment_share_link: {
        Args: {
          p_expires_at: string;
          p_job_id: string;
          p_max_views: number;
          p_permissions: Json;
        };
        Returns: Json;
      };
      crm_can_manage_contracts: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      crm_can_manage_sales: { Args: { _company_id: string }; Returns: boolean };
      crm_can_manage_success: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      crm_can_manage_success_health: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      crm_can_read: { Args: { _company_id: string }; Returns: boolean };
      crm_can_view_finance: { Args: { _company_id: string }; Returns: boolean };
      crm_convert_quote_to_contract: {
        Args: {
          _contract_number: string;
          _effective_from: string;
          _effective_to: string;
          _quote_id: string;
        };
        Returns: {
          account_id: string;
          commercial_terms: Json;
          company_id: string;
          contract_number: string;
          contract_type: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          parent_contract_id: string | null;
          renewal_reminder_at: string | null;
          signed_at: string | null;
          source_quote_id: string | null;
          status: Database["public"]["Enums"]["crm_contract_status"];
          termination_reason: string | null;
          updated_at: string;
          version_number: number;
        };
        SetofOptions: {
          from: "*";
          to: "crm_contracts";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_create_portal_invitation: {
        Args: {
          _account_id: string;
          _email: string;
          _role?: Database["public"]["Enums"]["customer_portal_role"];
        };
        Returns: {
          accepted_at: string | null;
          company_id: string;
          created_at: string;
          customer_id: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          invited_email: string;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["customer_portal_role"];
          status: Database["public"]["Enums"]["customer_portal_invitation_status"];
          token_hash: string;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "customer_portal_invitations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_recalculate_quote: {
        Args: { _quote_id: string };
        Returns: {
          account_id: string;
          approval_required: boolean;
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: string;
          discount_amount: number;
          id: string;
          opportunity_id: string | null;
          parent_quote_id: string | null;
          pdf_metadata: Json;
          quote_number: string;
          quote_type: string;
          status: Database["public"]["Enums"]["crm_quote_status"];
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          updated_at: string;
          valid_from: string;
          valid_until: string;
          version_number: number;
        };
        SetofOptions: {
          from: "*";
          to: "crm_quotes";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_record_sla_breaches: {
        Args: { _company_id: string };
        Returns: number;
      };
      crm_transition_case: {
        Args: {
          _case_id: string;
          _escalate?: boolean;
          _resolution?: string;
          _to_status: Database["public"]["Enums"]["crm_case_status"];
        };
        Returns: {
          account_id: string;
          assigned_to: string | null;
          category: string;
          company_id: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          escalation_level: number;
          first_response_at: string | null;
          id: string;
          priority: string;
          resolution: string | null;
          resolution_due_at: string | null;
          resolved_at: string | null;
          response_due_at: string | null;
          sla_id: string | null;
          source_request_id: string | null;
          status: Database["public"]["Enums"]["crm_case_status"];
          subject: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "crm_cases";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_transition_contract: {
        Args: {
          _contract_id: string;
          _termination_reason?: string;
          _to_status: Database["public"]["Enums"]["crm_contract_status"];
        };
        Returns: {
          account_id: string;
          commercial_terms: Json;
          company_id: string;
          contract_number: string;
          contract_type: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          parent_contract_id: string | null;
          renewal_reminder_at: string | null;
          signed_at: string | null;
          source_quote_id: string | null;
          status: Database["public"]["Enums"]["crm_contract_status"];
          termination_reason: string | null;
          updated_at: string;
          version_number: number;
        };
        SetofOptions: {
          from: "*";
          to: "crm_contracts";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_transition_lead: {
        Args: {
          _lead_id: string;
          _reason?: string;
          _to_stage: Database["public"]["Enums"]["crm_lead_stage"];
        };
        Returns: {
          address: string | null;
          archived_at: string | null;
          assigned_to: string | null;
          company_id: string;
          company_name: string;
          contact_name: string | null;
          converted_account_id: string | null;
          created_at: string;
          email: string | null;
          estimated_monthly_value: number;
          id: string;
          lost_reason: string | null;
          notes: string | null;
          owner_id: string | null;
          phone: string | null;
          source: string;
          stage: Database["public"]["Enums"]["crm_lead_stage"];
          updated_at: string;
          whatsapp: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "crm_leads";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_transition_onboarding: {
        Args: {
          _onboarding_id: string;
          _to_stage: Database["public"]["Enums"]["crm_onboarding_stage"];
        };
        Returns: {
          account_id: string;
          commercial_setup: Json;
          company_id: string;
          completed_at: string | null;
          contract_id: string | null;
          created_at: string;
          credit_review_status: string;
          id: string;
          lead_id: string | null;
          operations_setup: Json;
          owner_id: string | null;
          portal_invitation_id: string | null;
          quote_id: string | null;
          stage: Database["public"]["Enums"]["crm_onboarding_stage"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "crm_onboarding";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_transition_opportunity: {
        Args: {
          _opportunity_id: string;
          _probability: number;
          _reason?: string;
          _to_stage: Database["public"]["Enums"]["crm_opportunity_stage"];
        };
        Returns: {
          account_id: string;
          closed_at: string | null;
          company_id: string;
          competitors: Json;
          created_at: string;
          expected_close_date: string | null;
          expected_value: number;
          id: string;
          lead_id: string | null;
          name: string;
          notes: string | null;
          owner_id: string | null;
          probability: number;
          stage: Database["public"]["Enums"]["crm_opportunity_stage"];
          updated_at: string;
          win_loss_reason: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "crm_opportunities";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_transition_quote: {
        Args: {
          _pdf_metadata?: Json;
          _quote_id: string;
          _to_status: Database["public"]["Enums"]["crm_quote_status"];
        };
        Returns: {
          account_id: string;
          approval_required: boolean;
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          currency_code: string;
          discount_amount: number;
          id: string;
          opportunity_id: string | null;
          parent_quote_id: string | null;
          pdf_metadata: Json;
          quote_number: string;
          quote_type: string;
          status: Database["public"]["Enums"]["crm_quote_status"];
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          updated_at: string;
          valid_from: string;
          valid_until: string;
          version_number: number;
        };
        SetofOptions: {
          from: "*";
          to: "crm_quotes";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crm_transition_task: {
        Args: {
          _assigned_to?: string;
          _task_id: string;
          _to_status: Database["public"]["Enums"]["crm_task_status"];
        };
        Returns: {
          account_id: string | null;
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          id: string;
          opportunity_id: string | null;
          priority: string;
          recurrence_rule: string | null;
          recurring_parent_id: string | null;
          status: Database["public"]["Enums"]["crm_task_status"];
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "crm_tasks";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_company_role: {
        Args: { _company_id: string };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      current_driver_id: { Args: { _company_id: string }; Returns: string };
      customer_warehouse_order_status: {
        Args: { _job_id: string };
        Returns: {
          order_reference: string;
          proof_of_loading_available: boolean;
          ready_for_dispatch: boolean;
          status: string;
        }[];
      };
      digits_only: { Args: { _value: string }; Returns: string };
      driver_complete_after_pod: {
        Args: { _job_id: string };
        Returns: {
          accepted_at: string | null;
          arrived_at: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_branch_id: string | null;
          customer_id: string | null;
          description: string | null;
          driver_id: string | null;
          dropoff_location: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          pickup_location: string | null;
          priority: Database["public"]["Enums"]["job_priority"];
          proof_lat: number | null;
          proof_lng: number | null;
          proof_notes: string | null;
          proof_photo_url: string | null;
          proof_recipient_name: string | null;
          proof_signature_url: string | null;
          reference: string;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver_depart_after_pod: {
        Args: { _job_id: string };
        Returns: {
          accepted_at: string | null;
          arrived_at: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_branch_id: string | null;
          customer_id: string | null;
          description: string | null;
          driver_id: string | null;
          dropoff_location: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          pickup_location: string | null;
          priority: Database["public"]["Enums"]["job_priority"];
          proof_lat: number | null;
          proof_lng: number | null;
          proof_notes: string | null;
          proof_photo_url: string | null;
          proof_recipient_name: string | null;
          proof_signature_url: string | null;
          reference: string;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver_fail_job: {
        Args: { _job_id: string; _notes?: string; _reason: string };
        Returns: {
          accepted_at: string | null;
          arrived_at: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_branch_id: string | null;
          customer_id: string | null;
          description: string | null;
          driver_id: string | null;
          dropoff_location: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          pickup_location: string | null;
          priority: Database["public"]["Enums"]["job_priority"];
          proof_lat: number | null;
          proof_lng: number | null;
          proof_notes: string | null;
          proof_photo_url: string | null;
          proof_recipient_name: string | null;
          proof_signature_url: string | null;
          reference: string;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver_queue_claim: {
        Args: {
          _batch_size?: number;
          _company_id: string;
          _device_id: string;
          _driver_id: string;
          _lease_seconds?: number;
          _session_id: string;
        };
        Returns: {
          acknowledged_at: string | null;
          attempt: number;
          checksum: string;
          claim_expires_at: string | null;
          claimed_at: string | null;
          company_id: string;
          created_at: string;
          dependency_id: string | null;
          device_id: string | null;
          driver_id: string;
          entity: string;
          entity_id: string;
          id: string;
          idempotency_key: string | null;
          last_error: string | null;
          next_retry_at: string | null;
          operation: string;
          payload: Json;
          priority: string;
          session_id: string | null;
          state: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "driver_offline_queue_items";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      driver_queue_enqueue: {
        Args: {
          _checksum: string;
          _company_id: string;
          _dependency_id?: string;
          _device_id: string;
          _driver_id: string;
          _entity: string;
          _entity_id: string;
          _idempotency_key: string;
          _operation: string;
          _payload: Json;
          _priority: string;
          _session_id: string;
        };
        Returns: {
          acknowledged_at: string | null;
          attempt: number;
          checksum: string;
          claim_expires_at: string | null;
          claimed_at: string | null;
          company_id: string;
          created_at: string;
          dependency_id: string | null;
          device_id: string | null;
          driver_id: string;
          entity: string;
          entity_id: string;
          id: string;
          idempotency_key: string | null;
          last_error: string | null;
          next_retry_at: string | null;
          operation: string;
          payload: Json;
          priority: string;
          session_id: string | null;
          state: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "driver_offline_queue_items";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver_queue_process_claim: {
        Args: { _queue_id: string };
        Returns: {
          acknowledged_at: string | null;
          attempt: number;
          checksum: string;
          claim_expires_at: string | null;
          claimed_at: string | null;
          company_id: string;
          created_at: string;
          dependency_id: string | null;
          device_id: string | null;
          driver_id: string;
          entity: string;
          entity_id: string;
          id: string;
          idempotency_key: string | null;
          last_error: string | null;
          next_retry_at: string | null;
          operation: string;
          payload: Json;
          priority: string;
          session_id: string | null;
          state: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "driver_offline_queue_items";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver_queue_summary: {
        Args: { _company_id: string; _driver_id: string };
        Returns: Json;
      };
      driver_submit_pod_for_review: {
        Args: {
          _job_id: string;
          _notes?: string;
          _photo_url?: string;
          _recipient_name: string;
          _signature_url?: string;
        };
        Returns: {
          company_id: string;
          completed_at: string;
          created_at: string;
          created_by: string | null;
          customer_visible: boolean;
          driver_id: string | null;
          finalized_at: string | null;
          id: string;
          job_id: string;
          notes: string | null;
          photo_url: string | null;
          recipient_name: string;
          signature_url: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "job_proofs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver_transition_job:
        | {
            Args: { _action: string; _job_id: string };
            Returns: {
              accepted_at: string | null;
              arrived_at: string | null;
              company_id: string;
              completed_at: string | null;
              created_at: string;
              created_by: string | null;
              customer_branch_id: string | null;
              customer_id: string | null;
              description: string | null;
              driver_id: string | null;
              dropoff_location: string | null;
              failed_at: string | null;
              failure_reason: string | null;
              id: string;
              notes: string | null;
              pickup_location: string | null;
              priority: Database["public"]["Enums"]["job_priority"];
              proof_lat: number | null;
              proof_lng: number | null;
              proof_notes: string | null;
              proof_photo_url: string | null;
              proof_recipient_name: string | null;
              proof_signature_url: string | null;
              reference: string;
              scheduled_at: string | null;
              started_at: string | null;
              status: Database["public"]["Enums"]["job_status"];
              updated_at: string;
              vehicle_id: string | null;
            };
            SetofOptions: {
              from: "*";
              to: "jobs";
              isOneToOne: true;
              isSetofReturn: false;
            };
          }
        | {
            Args: {
              _action: string;
              _app_version?: string;
              _device_installation_id?: string;
              _device_platform?: string;
              _job_id: string;
              _location_permission_state?: string;
            };
            Returns: {
              accepted_at: string | null;
              arrived_at: string | null;
              company_id: string;
              completed_at: string | null;
              created_at: string;
              created_by: string | null;
              customer_branch_id: string | null;
              customer_id: string | null;
              description: string | null;
              driver_id: string | null;
              dropoff_location: string | null;
              failed_at: string | null;
              failure_reason: string | null;
              id: string;
              notes: string | null;
              pickup_location: string | null;
              priority: Database["public"]["Enums"]["job_priority"];
              proof_lat: number | null;
              proof_lng: number | null;
              proof_notes: string | null;
              proof_photo_url: string | null;
              proof_recipient_name: string | null;
              proof_signature_url: string | null;
              reference: string;
              scheduled_at: string | null;
              started_at: string | null;
              status: Database["public"]["Enums"]["job_status"];
              updated_at: string;
              vehicle_id: string | null;
            };
            SetofOptions: {
              from: "*";
              to: "jobs";
              isOneToOne: true;
              isSetofReturn: false;
            };
          };
      driver_update_job_notes: {
        Args: { _job_id: string; _notes: string };
        Returns: {
          accepted_at: string | null;
          arrived_at: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_branch_id: string | null;
          customer_id: string | null;
          description: string | null;
          driver_id: string | null;
          dropoff_location: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          pickup_location: string | null;
          priority: Database["public"]["Enums"]["job_priority"];
          proof_lat: number | null;
          proof_lng: number | null;
          proof_notes: string | null;
          proof_photo_url: string | null;
          proof_recipient_name: string | null;
          proof_signature_url: string | null;
          reference: string;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      driver35_read: {
        Args: { _company_id: string; _driver_id?: string };
        Returns: boolean;
      };
      driver35_validate_device: {
        Args: {
          _company_id: string;
          _device_id: string;
          _driver_id: string;
          _session_id?: string;
        };
        Returns: boolean;
      };
      driver35_write: {
        Args: { _company_id: string; _driver_id: string };
        Returns: boolean;
      };
      ensure_driver_tracking_session: {
        Args: {
          _app_version?: string;
          _device_installation_id?: string;
          _device_platform?: string;
          _job_id: string;
          _location_permission_state?: string;
        };
        Returns: {
          app_version: string | null;
          company_id: string;
          created_at: string;
          device_installation_id: string | null;
          device_platform: string | null;
          driver_id: string;
          ended_at: string | null;
          id: string;
          job_id: string;
          last_telemetry_at: string | null;
          location_permission_state: string | null;
          source: Database["public"]["Enums"]["telemetry_source"];
          started_at: string | null;
          status: Database["public"]["Enums"]["tracking_session_status"];
          tracking_quality_status: Database["public"]["Enums"]["telemetry_quality_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "tracking_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      execute_simulated_device_command: {
        Args: {
          _command_type: string;
          _company_id: string;
          _device_id: string;
          _idempotency_key?: string;
          _request_payload?: Json;
        };
        Returns: {
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id: string | null;
          command_type: string;
          company_id: string;
          completed_at: string | null;
          device_id: string;
          id: string;
          idempotency_key: string;
          request_payload: Json;
          requested_at: string;
          result_payload: Json;
          result_status: Database["public"]["Enums"]["device_command_status"];
          simulated: boolean;
        };
        SetofOptions: {
          from: "*";
          to: "device_command_audit";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      fleet_intelligence_can_read: {
        Args: { _company: string };
        Returns: boolean;
      };
      fleet_intelligence_can_review: {
        Args: { _company: string };
        Returns: boolean;
      };
      has_any_role: {
        Args: {
          _company_id: string;
          _roles: Database["public"]["Enums"]["app_role"][];
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _company_id: string;
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
      haversine_meters: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number };
        Returns: number;
      };
      hr_assign_asset: {
        Args: { _asset_id: string; _condition?: string; _employee_id: string };
        Returns: {
          asset_id: string;
          company_id: string;
          condition_on_issue: string | null;
          condition_on_return: string | null;
          created_at: string;
          employee_id: string;
          id: string;
          issued_at: string;
          issued_by: string | null;
          replacement_reason: string | null;
          returned_at: string | null;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "hr_asset_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      hr_can_access_employee: {
        Args: { _company_id: string; _employee_id: string };
        Returns: boolean;
      };
      hr_can_manage: { Args: { _company_id: string }; Returns: boolean };
      hr_can_read: { Args: { _company_id: string }; Returns: boolean };
      hr_can_supervise: { Args: { _company_id: string }; Returns: boolean };
      hr_can_view_payroll: { Args: { _company_id: string }; Returns: boolean };
      hr_clock_attendance: {
        Args: { _action: string; _at?: string; _employee_id: string };
        Returns: {
          adjustment_notes: string | null;
          approved_by: string | null;
          break_minutes: number;
          clock_in_at: string | null;
          clock_out_at: string | null;
          company_id: string;
          created_at: string;
          employee_id: string;
          exception_type: string | null;
          id: string;
          overtime_minutes: number;
          updated_at: string;
          work_date: string;
        };
        SetofOptions: {
          from: "*";
          to: "hr_attendance_records";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      hr_complete_onboarding_step: {
        Args: { _onboarding_id: string; _step: string };
        Returns: {
          company_id: string;
          completed_at: string | null;
          contract_issued: boolean;
          created_at: string;
          documents_submitted: boolean;
          employee_id: string;
          employment_activated: boolean;
          equipment_assigned: boolean;
          id: string;
          identity_verified: boolean;
          induction_completed: boolean;
          medical_completed: boolean;
          owner_id: string | null;
          system_access_granted: boolean;
          training_scheduled: boolean;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "hr_onboarding";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      hr_is_self_or_manager: {
        Args: { _company_id: string; _employee_id: string };
        Returns: boolean;
      };
      hr_transition_employee: {
        Args: {
          _employee_id: string;
          _reason?: string;
          _to_status: Database["public"]["Enums"]["hr_employee_status"];
        };
        Returns: {
          address: string | null;
          banking_reference: Json;
          branch_id: string | null;
          company_id: string;
          cost_centre_id: string | null;
          created_at: string;
          department_id: string | null;
          driver_id: string | null;
          emergency_contacts: Json;
          employment_number: string;
          employment_type: string;
          end_date: string | null;
          first_name: string;
          id: string;
          last_name: string;
          manager_id: string | null;
          medical_summary: Json;
          national_id_reference: string | null;
          next_of_kin: Json;
          personal_email: string | null;
          phone: string | null;
          photo_metadata: Json;
          position_title: string;
          probation_end_date: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["hr_employee_status"];
          tax_number_reference: string | null;
          team_id: string | null;
          terminated_reason: string | null;
          updated_at: string;
          user_id: string | null;
          work_email: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "hr_employees";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      hr_transition_expense: {
        Args: {
          _expense_id: string;
          _note?: string;
          _to_status: Database["public"]["Enums"]["hr_expense_status"];
        };
        Returns: {
          amount: number;
          claim_type: string;
          company_id: string;
          created_at: string;
          currency_code: string;
          description: string | null;
          employee_id: string;
          id: string;
          incurred_on: string;
          manager_approved_by: string | null;
          payroll_approved_by: string | null;
          receipt_document_id: string | null;
          status: Database["public"]["Enums"]["hr_expense_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "hr_expense_claims";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      hr_transition_leave: {
        Args: {
          _leave_id: string;
          _note?: string;
          _to_status: Database["public"]["Enums"]["hr_leave_status"];
        };
        Returns: {
          company_id: string;
          created_at: string;
          employee_id: string;
          end_date: string;
          hr_approved_by: string | null;
          id: string;
          leave_type: string;
          manager_approved_by: string | null;
          reason: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["hr_leave_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "hr_leave_requests";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      hr_update_emergency_contacts: {
        Args: { _contacts: Json; _employee_id: string };
        Returns: {
          address: string | null;
          banking_reference: Json;
          branch_id: string | null;
          company_id: string;
          cost_centre_id: string | null;
          created_at: string;
          department_id: string | null;
          driver_id: string | null;
          emergency_contacts: Json;
          employment_number: string;
          employment_type: string;
          end_date: string | null;
          first_name: string;
          id: string;
          last_name: string;
          manager_id: string | null;
          medical_summary: Json;
          national_id_reference: string | null;
          next_of_kin: Json;
          personal_email: string | null;
          phone: string | null;
          photo_metadata: Json;
          position_title: string;
          probation_end_date: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["hr_employee_status"];
          tax_number_reference: string | null;
          team_id: string | null;
          terminated_reason: string | null;
          updated_at: string;
          user_id: string | null;
          work_email: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "hr_employees";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      ingest_tracking_telemetry: { Args: { _batch: Json }; Returns: Json };
      integration_developer: { Args: { _company: string }; Returns: boolean };
      integration_manager: { Args: { _company: string }; Returns: boolean };
      integration_owner_or_manager: {
        Args: { _company: string; _owner: string };
        Returns: boolean;
      };
      integration_reader: { Args: { _company: string }; Returns: boolean };
      integration_secure_reference: {
        Args: { _value: string };
        Returns: boolean;
      };
      is_company_member: { Args: { _company_id: string }; Returns: boolean };
      is_driver_relevant_job: { Args: { _job_id: string }; Returns: boolean };
      job_assignment_conflicts: {
        Args: {
          _company_id: string;
          _driver_id?: string;
          _job_id: string;
          _vehicle_id?: string;
        };
        Returns: Json;
      };
      log_compliance_audit: {
        Args: {
          _company_id: string;
          _entity_id: string;
          _entity_type: string;
          _event_type: string;
          _metadata?: Json;
        };
        Returns: string;
      };
      log_crm_audit: {
        Args: {
          _company_id: string;
          _entity_id: string;
          _entity_type: string;
          _event_type: string;
          _metadata?: Json;
        };
        Returns: string;
      };
      log_dispatcher_audit: {
        Args: {
          _action: string;
          _company_id: string;
          _entity_id?: string;
          _entity_type: string;
          _job_id?: string;
          _metadata?: Json;
          _tracking_session_id?: string;
        };
        Returns: {
          action: string;
          actor_user_id: string;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          job_id: string | null;
          metadata: Json;
          occurred_at: string;
          tracking_session_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "dispatcher_audit_log";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      log_field_audit: {
        Args: {
          _action: string;
          _company_id: string;
          _entity_id: string;
          _entity_type: string;
          _new_state?: Json;
          _old_state?: Json;
          _reason?: string;
          _source?: string;
        };
        Returns: {
          action: string;
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          actor_user_id: string | null;
          company_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          new_state: Json | null;
          old_state: Json | null;
          reason: string | null;
          source: string;
        };
        SetofOptions: {
          from: "*";
          to: "field_audit_ledger";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      log_hr_audit: {
        Args: {
          _company_id: string;
          _entity_id: string;
          _entity_type: string;
          _event_type: string;
          _metadata?: Json;
        };
        Returns: string;
      };
      log_job_event: {
        Args: {
          _company_id: string;
          _event_type: string;
          _job_id: string;
          _message?: string;
          _metadata?: Json;
        };
        Returns: string;
      };
      log_operational_alert_event: {
        Args: {
          _alert: Database["public"]["Tables"]["operational_alerts"]["Row"];
          _event_type: string;
          _metadata?: Json;
          _new_escalation?: Database["public"]["Enums"]["operational_escalation_level"];
          _new_status?: Database["public"]["Enums"]["operational_alert_status"];
          _old_escalation?: Database["public"]["Enums"]["operational_escalation_level"];
          _old_status?: Database["public"]["Enums"]["operational_alert_status"];
          _reason?: string;
        };
        Returns: string;
      };
      log_warehouse_audit: {
        Args: {
          _company_id: string;
          _entity_id: string;
          _entity_type: string;
          _event_type: string;
          _metadata?: Json;
          _warehouse_id: string;
        };
        Returns: string;
      };
      normalize_device_identifier: { Args: { _value: string }; Returns: string };
      notify_operations_users: {
        Args: {
          _body: string;
          _company_id: string;
          _link_path: string;
          _notification_type: Database["public"]["Enums"]["notification_type"];
          _title: string;
        };
        Returns: number;
      };
      open_shipment_share_link: { Args: { p_token: string }; Returns: Json };
      operations_intelligence_can_read: {
        Args: { c: string };
        Returns: boolean;
      };
      operations_intelligence_can_write: {
        Args: { c: string };
        Returns: boolean;
      };
      phase11_provisioning_rank: { Args: { _state: string }; Returns: number };
      platform_ingest_device_telemetry: {
        Args: {
          _company_id: string;
          _compression_type?: string;
          _delta?: boolean;
          _device_id: string;
          _event_id: string;
          _observed_at: string;
          _offline_buffered?: boolean;
          _payload_redacted: Json;
          _schema_version: number;
          _sequence_number: number;
          _transport: string;
        };
        Returns: string;
      };
      platform_is_admin: { Args: { _company_id: string }; Returns: boolean };
      platform_is_device_manager: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      platform_is_finance_manager: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      platform_is_global_admin: { Args: never; Returns: boolean };
      platform_is_global_reader: { Args: never; Returns: boolean };
      platform_is_mobile_user: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      platform_is_reader: { Args: { _company_id: string }; Returns: boolean };
      platform_is_service: { Args: { _company_id: string }; Returns: boolean };
      platform_start_device_provisioning: {
        Args: {
          _certificate_reference: string;
          _company_id: string;
          _device_id: string;
          _identity_reference: string;
          _token_hash: string;
        };
        Returns: string;
      };
      portal_action: {
        Args: { _action: string; _payload?: Json };
        Returns: Json;
      };
      portal_analytics: { Args: never; Returns: Json };
      portal_branch_visible: {
        Args: { _branch: string; _company: string; _customer: string };
        Returns: boolean;
      };
      portal_context: { Args: never; Returns: Json };
      portal_create_api_key: {
        Args: { _name: string; _type?: string };
        Returns: Json;
      };
      portal_dashboard: { Args: never; Returns: Json };
      portal_documents: { Args: never; Returns: Json };
      portal_has_access: {
        Args: { _company: string; _customer: string };
        Returns: boolean;
      };
      portal_membership: {
        Args: never;
        Returns: {
          accepted_at: string | null;
          company_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["customer_portal_role"];
          status: string;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "customer_portal_memberships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      portal_module: { Args: { _module: string }; Returns: Json };
      portal_shipment: { Args: { _job_id: string }; Returns: Json };
      portal_shipments: { Args: { _limit?: number }; Returns: Json };
      portal_zip_answer: { Args: { _question: string }; Returns: Json };
      proc_can_approve: { Args: { _company: string }; Returns: boolean };
      proc_can_manage: { Args: { _company: string }; Returns: boolean };
      proc_can_read: { Args: { _company: string }; Returns: boolean };
      proc_log: {
        Args: {
          _company: string;
          _data?: Json;
          _event: string;
          _id: string;
          _type: string;
        };
        Returns: string;
      };
      proc_transition_order: {
        Args: {
          _id: string;
          _note?: string;
          _to: Database["public"]["Enums"]["proc_order_status"];
        };
        Returns: {
          company_id: string;
          created_at: string;
          currency_code: string;
          document_id: string | null;
          id: string;
          items: Json;
          order_number: string;
          ordered_at: string | null;
          request_id: string | null;
          required_date: string | null;
          status: Database["public"]["Enums"]["proc_order_status"];
          supplier_id: string;
          total_amount: number;
          updated_at: string;
          vehicle_id: string | null;
          warehouse_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "proc_purchase_orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      purge_expired_provider_observation_cache: {
        Args: { _before?: string };
        Returns: number;
      };
      refresh_route_intelligence_for_company: {
        Args: { _company_id: string };
        Returns: Json;
      };
      refresh_tracking_summary: {
        Args: { _tracking_session_id: string };
        Returns: {
          accepted_point_count: number;
          average_observed_speed: number | null;
          company_id: string;
          created_at: string;
          first_point_at: string | null;
          gps_coverage_score: number | null;
          last_point_at: string | null;
          maximum_credible_speed: number | null;
          moving_duration: string | null;
          observed_distance: number;
          observed_point_count: number;
          rejected_point_count: number;
          stationary_duration: string | null;
          telemetry_quality_score: number | null;
          total_duration: string | null;
          tracking_session_id: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "tracking_summaries";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      reliability_can_approve: { Args: { p_company: string }; Returns: boolean };
      reliability_can_read: { Args: { p_company: string }; Returns: boolean };
      reliability_can_write: { Args: { p_company: string }; Returns: boolean };
      reliability_human_close_incident: {
        Args: { p_incident: string; p_resolution: string };
        Returns: undefined;
      };
      review_driver_pod: {
        Args: { _decision: string; _proof_id: string };
        Returns: {
          company_id: string;
          completed_at: string;
          created_at: string;
          created_by: string | null;
          customer_visible: boolean;
          driver_id: string | null;
          finalized_at: string | null;
          id: string;
          job_id: string;
          notes: string | null;
          photo_url: string | null;
          recipient_name: string;
          signature_url: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "job_proofs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      revoke_shipment_share_link: {
        Args: { p_link_id: string };
        Returns: undefined;
      };
      route_intelligence_route_key: {
        Args: {
          _customer_id: string;
          _dropoff_location: string;
          _pickup_location: string;
        };
        Returns: string;
      };
      security_can_approve: { Args: { c: string }; Returns: boolean };
      security_can_read: { Args: { c: string }; Returns: boolean };
      security_can_write: { Args: { c: string }; Returns: boolean };
      submit_job_proof: {
        Args: {
          _job_id: string;
          _notes?: string;
          _photo_url?: string;
          _recipient_name: string;
          _signature_url?: string;
        };
        Returns: {
          accepted_at: string | null;
          arrived_at: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_branch_id: string | null;
          customer_id: string | null;
          description: string | null;
          driver_id: string | null;
          dropoff_location: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          pickup_location: string | null;
          priority: Database["public"]["Enums"]["job_priority"];
          proof_lat: number | null;
          proof_lng: number | null;
          proof_notes: string | null;
          proof_photo_url: string | null;
          proof_recipient_name: string | null;
          proof_signature_url: string | null;
          reference: string;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      tracking34_customer_locations: {
        Args: never;
        Returns: {
          device_timestamp: string;
          freshness_state: string;
          general_area: string;
          latitude: number;
          longitude: number;
          vehicle_id: string;
          visibility_mode: string;
        }[];
      };
      tracking34_internal_read: { Args: { c: string }; Returns: boolean };
      tracking34_internal_write: { Args: { c: string }; Returns: boolean };
      transition_device_fitment_job: {
        Args: {
          _company_id: string;
          _fitment_job_id: string;
          _next_status: Database["public"]["Enums"]["fitment_job_status"];
          _override_reason?: string;
          _reason?: string;
        };
        Returns: {
          approved_at: string | null;
          blocked_reason: string | null;
          cancelled_at: string | null;
          checklist_template_id: string | null;
          checklist_template_version: number;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          device_id: string;
          id: string;
          installation_location: string | null;
          metadata: Json;
          notes: string | null;
          odometer_at_fitment: number | null;
          override_reason: string | null;
          reference: string;
          rejected_at: string | null;
          scheduled_at: string | null;
          sim_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["fitment_job_status"];
          submitted_at: string | null;
          supervisor_review_notes: string | null;
          supervisor_user_id: string | null;
          technician_user_id: string | null;
          updated_at: string;
          vehicle_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "device_fitment_jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      transition_operational_alert: {
        Args: {
          _action: string;
          _alert_id: string;
          _escalation_level?: Database["public"]["Enums"]["operational_escalation_level"];
          _note?: string;
        };
        Returns: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          acknowledgement_note: string | null;
          alert_type: string;
          company_id: string;
          created_at: string;
          dismissed_at: string | null;
          dismissed_by: string | null;
          escalated_at: string | null;
          escalated_by: string | null;
          escalation_level: Database["public"]["Enums"]["operational_escalation_level"];
          escalation_reason: string | null;
          id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          source_entity_id: string;
          source_entity_type: string;
          status: Database["public"]["Enums"]["operational_alert_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "operational_alerts";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      transition_shift_handover: {
        Args: {
          _handover_id: string;
          _next_status: Database["public"]["Enums"]["shift_handover_status"];
        };
        Returns: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          company_id: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          created_by: string;
          created_by_role: Database["public"]["Enums"]["app_role"];
          id: string;
          status: Database["public"]["Enums"]["shift_handover_status"];
          summary: Json;
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "shift_handovers";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      upsert_operational_alert: {
        Args: {
          _alert_type: string;
          _company_id: string;
          _source_entity_id: string;
          _source_entity_type: string;
        };
        Returns: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          acknowledgement_note: string | null;
          alert_type: string;
          company_id: string;
          created_at: string;
          dismissed_at: string | null;
          dismissed_by: string | null;
          escalated_at: string | null;
          escalated_by: string | null;
          escalation_level: Database["public"]["Enums"]["operational_escalation_level"];
          escalation_reason: string | null;
          id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          source_entity_id: string;
          source_entity_type: string;
          status: Database["public"]["Enums"]["operational_alert_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "operational_alerts";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      validate_device_company: {
        Args: { _company_id: string; _device_id: string };
        Returns: boolean;
      };
      validate_operations_source: {
        Args: {
          _company_id: string;
          _source_entity_id: string;
          _source_entity_type: string;
        };
        Returns: boolean;
      };
      warehouse_approve_cycle_count: {
        Args: { _approve: boolean; _cycle_count_id: string; _note?: string };
        Returns: {
          approved_by: string | null;
          company_id: string;
          count_type: string;
          counted_by: string | null;
          created_at: string;
          id: string;
          location_id: string | null;
          scheduled_for: string | null;
          status: string;
          updated_at: string;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_cycle_counts";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_assign_putaway: {
        Args: { _manual_location_id?: string; _stock_id: string };
        Returns: {
          allocated_quantity: number;
          batch_number: string | null;
          company_id: string;
          created_at: string;
          expiry_date: string | null;
          id: string;
          location_id: string | null;
          lot_number: string | null;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          serial_number: string | null;
          source_receiving_line_id: string | null;
          status: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at: string;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_stock";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_can_manage: { Args: { _company_id: string }; Returns: boolean };
      warehouse_can_operate: { Args: { _company_id: string }; Returns: boolean };
      warehouse_can_read: { Args: { _company_id: string }; Returns: boolean };
      warehouse_can_view_finance: {
        Args: { _company_id: string };
        Returns: boolean;
      };
      warehouse_inventory_valuation: {
        Args: { _company_id: string };
        Returns: {
          currency_code: string;
          inventory_value: number;
          product_id: string;
          quantity: number;
        }[];
      };
      warehouse_receive_stock: {
        Args: {
          _accepted_quantity: number;
          _damage_notes?: string;
          _photo_evidence?: Json;
          _receiving_line_id: string;
          _rejected_quantity?: number;
        };
        Returns: {
          allocated_quantity: number;
          batch_number: string | null;
          company_id: string;
          created_at: string;
          expiry_date: string | null;
          id: string;
          location_id: string | null;
          lot_number: string | null;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          serial_number: string | null;
          source_receiving_line_id: string | null;
          status: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at: string;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_stock";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_record_scan: {
        Args: {
          _company_id: string;
          _identifier: string;
          _identifier_type: string;
          _warehouse_id?: string;
        };
        Returns: {
          allocated_quantity: number;
          batch_number: string | null;
          company_id: string;
          created_at: string;
          expiry_date: string | null;
          id: string;
          location_id: string | null;
          lot_number: string | null;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          serial_number: string | null;
          source_receiving_line_id: string | null;
          status: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at: string;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_stock";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_schedule_dock: {
        Args: {
          _direction: string;
          _dock_id: string;
          _scheduled_end: string;
          _scheduled_start: string;
          _trailer_reference?: string;
          _vehicle_id?: string;
          _warehouse_id: string;
        };
        Returns: {
          company_id: string;
          created_at: string;
          direction: string;
          dock_id: string;
          id: string;
          scheduled_end: string;
          scheduled_start: string;
          status: string;
          trailer_reference: string | null;
          updated_at: string;
          vehicle_id: string | null;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_dock_schedules";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_transition_loading: {
        Args: {
          _loading_job_id: string;
          _seal_number?: string;
          _to_status: string;
        };
        Returns: {
          company_id: string;
          created_at: string;
          dock_schedule_id: string | null;
          driver_id: string | null;
          id: string;
          loaded_at: string | null;
          seal_number: string | null;
          status: string;
          trailer_reference: string | null;
          updated_at: string;
          vehicle_id: string | null;
          verified_by: string | null;
          warehouse_order_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_loading_jobs";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_transition_stock: {
        Args: {
          _metadata?: Json;
          _movement_type: string;
          _quantity: number;
          _reference_id?: string;
          _reference_type?: string;
          _stock_id: string;
          _to_location_id?: string;
          _to_status: Database["public"]["Enums"]["warehouse_inventory_status"];
        };
        Returns: {
          allocated_quantity: number;
          batch_number: string | null;
          company_id: string;
          created_at: string;
          expiry_date: string | null;
          id: string;
          location_id: string | null;
          lot_number: string | null;
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          serial_number: string | null;
          source_receiving_line_id: string | null;
          status: Database["public"]["Enums"]["warehouse_inventory_status"];
          updated_at: string;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_stock";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      warehouse_transition_task: {
        Args: {
          _assigned_to?: string;
          _task_id: string;
          _to_status: Database["public"]["Enums"]["warehouse_task_status"];
        };
        Returns: {
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          priority: string;
          reference_id: string | null;
          reference_type: string | null;
          status: Database["public"]["Enums"]["warehouse_task_status"];
          task_type: Database["public"]["Enums"]["warehouse_task_type"];
          title: string;
          updated_at: string;
          warehouse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "warehouse_tasks";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      zip_create_api_request: {
        Args: {
          _company_id: string;
          _prompt_version_id?: string;
          _question_hash: string;
          _question_redacted: string;
          _request_kind: string;
          _retrieval_request_id?: string;
          _source_module: string;
        };
        Returns: string;
      };
      zip_is_admin: { Args: { _company_id: string }; Returns: boolean };
      zip_is_executive: { Args: { _company_id: string }; Returns: boolean };
      zip_is_reader: { Args: { _company_id: string }; Returns: boolean };
      zip_is_reviewer: { Args: { _company_id: string }; Returns: boolean };
      zip_is_service: { Args: { _company_id: string }; Returns: boolean };
      zip_knowledge_source_visible: {
        Args: { _company_id: string; _source_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role:
        | "admin"
        | "fleet_manager"
        | "dispatcher"
        | "driver"
        | "viewer"
        | "warehouse_manager"
        | "warehouse_supervisor"
        | "warehouse_operator"
        | "inventory_controller"
        | "forklift_operator"
        | "receiving_clerk"
        | "packing_clerk"
        | "quality_inspector"
        | "sales_manager"
        | "sales_representative"
        | "customer_success_manager"
        | "customer_care"
        | "finance_manager"
        | "hr_manager"
        | "hr_officer"
        | "operations_manager"
        | "department_manager"
        | "payroll_officer"
        | "supervisor"
        | "employee"
        | "compliance_manager"
        | "safety_officer"
        | "quality_manager"
        | "procurement_manager"
        | "procurement_officer"
        | "finance_officer"
        | "executive"
        | "managing_director"
        | "commercial_manager"
        | "crm_manager"
        | "analyst"
        | "integration_manager"
        | "system_administrator"
        | "technical_administrator"
        | "api_developer"
        | "support_engineer"
        | "brain_administrator"
        | "brain_analyst"
        | "brain_reviewer"
        | "brain_service"
        | "fleet_controller"
        | "maintenance_manager"
        | "maintenance_coordinator";
      business_type:
        | "logistics"
        | "trucking"
        | "courier"
        | "food_delivery"
        | "last_mile"
        | "fuel_petroleum"
        | "passenger_transport"
        | "other";
      compliance_audit_status:
        "planned" | "in_progress" | "findings_issued" | "follow_up" | "closed" | "archived";
      compliance_capa_status:
        | "open"
        | "root_cause"
        | "action_in_progress"
        | "verification"
        | "closed"
        | "overdue"
        | "archived";
      compliance_incident_status:
        | "reported"
        | "under_investigation"
        | "root_cause_analysis"
        | "corrective_action"
        | "verification"
        | "closed";
      compliance_record_status:
        "valid" | "expiring" | "expired" | "suspended" | "pending" | "waived" | "archived";
      compliance_risk_status: "open" | "mitigating" | "accepted" | "closed" | "archived";
      crm_case_status: "open" | "in_progress" | "pending_customer" | "resolved" | "closed";
      crm_contract_status:
        "draft" | "awaiting_signature" | "active" | "expired" | "terminated" | "archived";
      crm_lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
        | "archived";
      crm_onboarding_stage:
        | "lead"
        | "qualification"
        | "quote"
        | "approval"
        | "contract"
        | "credit_review"
        | "account_creation"
        | "portal_invitation"
        | "operations_setup"
        | "commercial_setup"
        | "completed";
      crm_opportunity_stage:
        "discovery" | "qualified" | "proposal" | "negotiation" | "won" | "lost" | "archived";
      crm_quote_status:
        "draft" | "sent" | "approved" | "rejected" | "expired" | "converted" | "archived";
      crm_task_status: "open" | "assigned" | "in_progress" | "blocked" | "completed" | "cancelled";
      customer_portal_invitation_status: "pending" | "accepted" | "expired" | "revoked";
      customer_portal_role: "viewer" | "manager";
      customer_portal_share_status: "active" | "revoked" | "expired";
      customer_service_request_priority: "low" | "medium" | "high" | "urgent";
      customer_service_request_status: "open" | "in_progress" | "resolved" | "closed";
      device_assignment_status: "planned" | "active" | "inactive" | "removed";
      device_assignment_type: "primary" | "backup" | "temporary" | "simulator";
      device_command_status: "accepted" | "completed" | "rejected" | "failed";
      device_sim_status: "inventory" | "assigned" | "active" | "suspended" | "inactive" | "retired";
      device_status:
        | "unprovisioned"
        | "provisioned"
        | "active"
        | "inactive"
        | "degraded"
        | "maintenance"
        | "retired"
        | "blocked";
      device_type: "ZAPP_BOX" | "P1" | "ROAD_NODE" | "SIMULATOR";
      document_owner_type: "company" | "vehicle" | "driver" | "fitment_job";
      driver_status: "available" | "on_trip" | "off_duty" | "suspended";
      field_inventory_state:
        | "warehouse"
        | "reserved"
        | "issued_to_technician"
        | "in_fitment"
        | "active"
        | "returned"
        | "faulty"
        | "quarantined"
        | "retired";
      field_support_case_status:
        | "open"
        | "investigating"
        | "awaiting_field_visit"
        | "awaiting_parts"
        | "resolved"
        | "closed";
      firmware_release_status: "draft" | "approved" | "deprecated" | "blocked";
      firmware_rollout_plan_status:
        | "draft"
        | "awaiting_approval"
        | "approved"
        | "scheduled"
        | "cancelled"
        | "completed_simulation";
      fitment_job_status:
        | "planned"
        | "assigned"
        | "in_progress"
        | "blocked"
        | "awaiting_supervisor"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled";
      fitment_step_status: "pending" | "passed" | "failed" | "not_applicable" | "blocked";
      fitment_test_result: "passed" | "failed" | "warning" | "not_run";
      fitment_test_source:
        | "manual_measurement"
        | "manual"
        | "simulated"
        | "future_device_reported"
        | "device_reported_future";
      fleet_size: "1-5" | "6-20" | "21-50" | "51-100" | "100+";
      hr_asset_status: "available" | "assigned" | "returned" | "damaged" | "lost" | "retired";
      hr_employee_status:
        | "applicant"
        | "interview"
        | "offer"
        | "accepted"
        | "onboarding"
        | "active"
        | "probation"
        | "suspended"
        | "leave"
        | "terminated"
        | "retired"
        | "archived";
      hr_expense_status:
        | "draft"
        | "submitted"
        | "manager_approved"
        | "payroll_approved"
        | "rejected"
        | "paid"
        | "archived";
      hr_leave_status:
        "requested" | "manager_approved" | "hr_approved" | "rejected" | "cancelled" | "completed";
      incident_severity: "low" | "medium" | "high" | "critical";
      incident_status: "open" | "investigating" | "resolved";
      incident_type:
        | "accident"
        | "breakdown"
        | "vehicle_damage"
        | "delivery_issue"
        | "driver_issue"
        | "customer_issue"
        | "safety_issue"
        | "other";
      job_priority: "low" | "normal" | "high" | "critical";
      job_status:
        | "unassigned"
        | "assigned"
        | "accepted"
        | "in_progress"
        | "arrived"
        | "completed"
        | "failed"
        | "cancelled";
      maintenance_status: "reported" | "scheduled" | "in_progress" | "completed";
      maintenance_type:
        | "service"
        | "repair"
        | "inspection"
        | "tyres"
        | "brakes"
        | "engine"
        | "electrical"
        | "other";
      notification_type:
        | "job_assigned"
        | "job_accepted"
        | "job_started"
        | "job_delayed"
        | "job_completed"
        | "job_failed"
        | "incident_reported"
        | "incident_critical"
        | "maintenance_overdue"
        | "document_expiring"
        | "document_expired"
        | "operational_alert"
        | "handover_ready";
      operational_alert_status: "open" | "acknowledged" | "escalated" | "resolved" | "dismissed";
      operational_escalation_level: "normal" | "priority" | "urgent" | "critical";
      proc_order_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "ordered"
        | "partially_received"
        | "completed"
        | "cancelled";
      proc_request_status:
        | "draft"
        | "submitted"
        | "department_approved"
        | "procurement_approved"
        | "finance_approved"
        | "rejected"
        | "cancelled"
        | "converted";
      proc_supplier_status:
        | "prospective"
        | "application_submitted"
        | "compliance_review"
        | "finance_review"
        | "approved"
        | "active"
        | "suspended"
        | "blacklisted"
        | "archived";
      provider_observation_type: "weather" | "traffic";
      shift_handover_status: "draft" | "ready" | "acknowledged" | "completed";
      telemetry_movement_state: "moving" | "stationary" | "unknown";
      telemetry_quality_status: "high" | "acceptable" | "poor" | "rejected";
      telemetry_source:
        "DRIVER_PHONE" | "ZAPP_BOX" | "P1" | "ROAD_NODE" | "THIRD_PARTY_TELEMATICS" | "SIMULATOR";
      terminology: "trips" | "jobs" | "deliveries" | "loads" | "orders";
      tracking_session_status:
        "pending" | "active" | "paused" | "degraded" | "completed" | "terminated";
      vehicle_status: "available" | "in_use" | "maintenance" | "out_of_service";
      vehicle_type: "truck" | "van" | "car" | "motorcycle" | "bus" | "tanker" | "other";
      warehouse_inventory_status:
        | "received"
        | "quality_inspection"
        | "available"
        | "reserved"
        | "allocated"
        | "picked"
        | "packed"
        | "loaded"
        | "in_transit"
        | "delivered"
        | "returned"
        | "damaged"
        | "disposed"
        | "archived";
      warehouse_task_status:
        "open" | "assigned" | "in_progress" | "blocked" | "completed" | "cancelled";
      warehouse_task_type:
        | "receiving"
        | "putaway"
        | "picking"
        | "packing"
        | "loading"
        | "cycle_count"
        | "transfer"
        | "inspection"
        | "cleanup"
        | "maintenance";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "admin",
        "fleet_manager",
        "dispatcher",
        "driver",
        "viewer",
        "warehouse_manager",
        "warehouse_supervisor",
        "warehouse_operator",
        "inventory_controller",
        "forklift_operator",
        "receiving_clerk",
        "packing_clerk",
        "quality_inspector",
        "sales_manager",
        "sales_representative",
        "customer_success_manager",
        "customer_care",
        "finance_manager",
        "hr_manager",
        "hr_officer",
        "operations_manager",
        "department_manager",
        "payroll_officer",
        "supervisor",
        "employee",
        "compliance_manager",
        "safety_officer",
        "quality_manager",
        "procurement_manager",
        "procurement_officer",
        "finance_officer",
        "executive",
        "managing_director",
        "commercial_manager",
        "crm_manager",
        "analyst",
        "integration_manager",
        "system_administrator",
        "technical_administrator",
        "api_developer",
        "support_engineer",
        "brain_administrator",
        "brain_analyst",
        "brain_reviewer",
        "brain_service",
        "fleet_controller",
        "maintenance_manager",
        "maintenance_coordinator",
      ],
      business_type: [
        "logistics",
        "trucking",
        "courier",
        "food_delivery",
        "last_mile",
        "fuel_petroleum",
        "passenger_transport",
        "other",
      ],
      compliance_audit_status: [
        "planned",
        "in_progress",
        "findings_issued",
        "follow_up",
        "closed",
        "archived",
      ],
      compliance_capa_status: [
        "open",
        "root_cause",
        "action_in_progress",
        "verification",
        "closed",
        "overdue",
        "archived",
      ],
      compliance_incident_status: [
        "reported",
        "under_investigation",
        "root_cause_analysis",
        "corrective_action",
        "verification",
        "closed",
      ],
      compliance_record_status: [
        "valid",
        "expiring",
        "expired",
        "suspended",
        "pending",
        "waived",
        "archived",
      ],
      compliance_risk_status: ["open", "mitigating", "accepted", "closed", "archived"],
      crm_case_status: ["open", "in_progress", "pending_customer", "resolved", "closed"],
      crm_contract_status: [
        "draft",
        "awaiting_signature",
        "active",
        "expired",
        "terminated",
        "archived",
      ],
      crm_lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
        "archived",
      ],
      crm_onboarding_stage: [
        "lead",
        "qualification",
        "quote",
        "approval",
        "contract",
        "credit_review",
        "account_creation",
        "portal_invitation",
        "operations_setup",
        "commercial_setup",
        "completed",
      ],
      crm_opportunity_stage: [
        "discovery",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
        "archived",
      ],
      crm_quote_status: [
        "draft",
        "sent",
        "approved",
        "rejected",
        "expired",
        "converted",
        "archived",
      ],
      crm_task_status: ["open", "assigned", "in_progress", "blocked", "completed", "cancelled"],
      customer_portal_invitation_status: ["pending", "accepted", "expired", "revoked"],
      customer_portal_role: ["viewer", "manager"],
      customer_portal_share_status: ["active", "revoked", "expired"],
      customer_service_request_priority: ["low", "medium", "high", "urgent"],
      customer_service_request_status: ["open", "in_progress", "resolved", "closed"],
      device_assignment_status: ["planned", "active", "inactive", "removed"],
      device_assignment_type: ["primary", "backup", "temporary", "simulator"],
      device_command_status: ["accepted", "completed", "rejected", "failed"],
      device_sim_status: ["inventory", "assigned", "active", "suspended", "inactive", "retired"],
      device_status: [
        "unprovisioned",
        "provisioned",
        "active",
        "inactive",
        "degraded",
        "maintenance",
        "retired",
        "blocked",
      ],
      device_type: ["ZAPP_BOX", "P1", "ROAD_NODE", "SIMULATOR"],
      document_owner_type: ["company", "vehicle", "driver", "fitment_job"],
      driver_status: ["available", "on_trip", "off_duty", "suspended"],
      field_inventory_state: [
        "warehouse",
        "reserved",
        "issued_to_technician",
        "in_fitment",
        "active",
        "returned",
        "faulty",
        "quarantined",
        "retired",
      ],
      field_support_case_status: [
        "open",
        "investigating",
        "awaiting_field_visit",
        "awaiting_parts",
        "resolved",
        "closed",
      ],
      firmware_release_status: ["draft", "approved", "deprecated", "blocked"],
      firmware_rollout_plan_status: [
        "draft",
        "awaiting_approval",
        "approved",
        "scheduled",
        "cancelled",
        "completed_simulation",
      ],
      fitment_job_status: [
        "planned",
        "assigned",
        "in_progress",
        "blocked",
        "awaiting_supervisor",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      fitment_step_status: ["pending", "passed", "failed", "not_applicable", "blocked"],
      fitment_test_result: ["passed", "failed", "warning", "not_run"],
      fitment_test_source: [
        "manual_measurement",
        "manual",
        "simulated",
        "future_device_reported",
        "device_reported_future",
      ],
      fleet_size: ["1-5", "6-20", "21-50", "51-100", "100+"],
      hr_asset_status: ["available", "assigned", "returned", "damaged", "lost", "retired"],
      hr_employee_status: [
        "applicant",
        "interview",
        "offer",
        "accepted",
        "onboarding",
        "active",
        "probation",
        "suspended",
        "leave",
        "terminated",
        "retired",
        "archived",
      ],
      hr_expense_status: [
        "draft",
        "submitted",
        "manager_approved",
        "payroll_approved",
        "rejected",
        "paid",
        "archived",
      ],
      hr_leave_status: [
        "requested",
        "manager_approved",
        "hr_approved",
        "rejected",
        "cancelled",
        "completed",
      ],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: ["open", "investigating", "resolved"],
      incident_type: [
        "accident",
        "breakdown",
        "vehicle_damage",
        "delivery_issue",
        "driver_issue",
        "customer_issue",
        "safety_issue",
        "other",
      ],
      job_priority: ["low", "normal", "high", "critical"],
      job_status: [
        "unassigned",
        "assigned",
        "accepted",
        "in_progress",
        "arrived",
        "completed",
        "failed",
        "cancelled",
      ],
      maintenance_status: ["reported", "scheduled", "in_progress", "completed"],
      maintenance_type: [
        "service",
        "repair",
        "inspection",
        "tyres",
        "brakes",
        "engine",
        "electrical",
        "other",
      ],
      notification_type: [
        "job_assigned",
        "job_accepted",
        "job_started",
        "job_delayed",
        "job_completed",
        "job_failed",
        "incident_reported",
        "incident_critical",
        "maintenance_overdue",
        "document_expiring",
        "document_expired",
        "operational_alert",
        "handover_ready",
      ],
      operational_alert_status: ["open", "acknowledged", "escalated", "resolved", "dismissed"],
      operational_escalation_level: ["normal", "priority", "urgent", "critical"],
      proc_order_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "ordered",
        "partially_received",
        "completed",
        "cancelled",
      ],
      proc_request_status: [
        "draft",
        "submitted",
        "department_approved",
        "procurement_approved",
        "finance_approved",
        "rejected",
        "cancelled",
        "converted",
      ],
      proc_supplier_status: [
        "prospective",
        "application_submitted",
        "compliance_review",
        "finance_review",
        "approved",
        "active",
        "suspended",
        "blacklisted",
        "archived",
      ],
      provider_observation_type: ["weather", "traffic"],
      shift_handover_status: ["draft", "ready", "acknowledged", "completed"],
      telemetry_movement_state: ["moving", "stationary", "unknown"],
      telemetry_quality_status: ["high", "acceptable", "poor", "rejected"],
      telemetry_source: [
        "DRIVER_PHONE",
        "ZAPP_BOX",
        "P1",
        "ROAD_NODE",
        "THIRD_PARTY_TELEMATICS",
        "SIMULATOR",
      ],
      terminology: ["trips", "jobs", "deliveries", "loads", "orders"],
      tracking_session_status: [
        "pending",
        "active",
        "paused",
        "degraded",
        "completed",
        "terminated",
      ],
      vehicle_status: ["available", "in_use", "maintenance", "out_of_service"],
      vehicle_type: ["truck", "van", "car", "motorcycle", "bus", "tanker", "other"],
      warehouse_inventory_status: [
        "received",
        "quality_inspection",
        "available",
        "reserved",
        "allocated",
        "picked",
        "packed",
        "loaded",
        "in_transit",
        "delivered",
        "returned",
        "damaged",
        "disposed",
        "archived",
      ],
      warehouse_task_status: [
        "open",
        "assigned",
        "in_progress",
        "blocked",
        "completed",
        "cancelled",
      ],
      warehouse_task_type: [
        "receiving",
        "putaway",
        "picking",
        "packing",
        "loading",
        "cycle_count",
        "transfer",
        "inspection",
        "cleanup",
        "maintenance",
      ],
    },
  },
} as const;
