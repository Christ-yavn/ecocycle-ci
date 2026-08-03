// Type Database pour le client Supabase typé.
// Référence les tables du schéma public.
// Pour régénérer : npx supabase gen types typescript --project-id <id>

import type {
  UserRow,
  LotRow,
  ConfirmationRow,
  AnalyseIaRow,
  SignalementRow,
  StockRow,
  PointTransactionRow,
  AbonnementRow,
  NotificationRow,
  AppelOffreRow,
  PropositionOffreRow,
} from "./database.types";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & { id: string; role: UserRow["role"] };
        Update: Partial<Omit<UserRow, "id">>;
      };
      lots: {
        Row: LotRow;
        Insert: Partial<LotRow> & {
          producteur_id: string;
          type_dechet: LotRow["type_dechet"];
        };
        Update: Partial<Omit<LotRow, "id">>;
      };
      confirmations: {
        Row: ConfirmationRow;
        Insert: Partial<ConfirmationRow> & {
          lot_id: string;
          step: ConfirmationRow["step"];
        };
        Update: Partial<Omit<ConfirmationRow, "id">>;
      };
      analyse_ia: {
        Row: AnalyseIaRow;
        Insert: Partial<AnalyseIaRow>;
        Update: Partial<Omit<AnalyseIaRow, "id">>;
      };
      signalements: {
        Row: SignalementRow;
        Insert: Partial<SignalementRow>;
        Update: Partial<Omit<SignalementRow, "id">>;
      };
      stocks: {
        Row: StockRow;
        Insert: Partial<StockRow> & {
          owner_id: string;
          type_matiere: string;
        };
        Update: Partial<Omit<StockRow, "id">>;
      };
      point_transactions: {
        Row: PointTransactionRow;
        Insert: Partial<PointTransactionRow> & {
          producteur_id: string;
          points: number;
        };
        Update: Partial<Omit<PointTransactionRow, "id">>;
      };
      abonnements: {
        Row: AbonnementRow;
        Insert: Partial<AbonnementRow> & { utilisateur_id: string };
        Update: Partial<Omit<AbonnementRow, "id">>;
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & {
          user_id: string;
          type: string;
          title: string;
        };
        Update: Partial<Omit<NotificationRow, "id">>;
      };
      appels_offres: {
        Row: AppelOffreRow;
        Insert: Partial<AppelOffreRow> & {
          acheteur_id: string;
          type_matiere: string;
          volume_demande_kg: number;
        };
        Update: Partial<Omit<AppelOffreRow, "id">>;
      };
      propositions_offres: {
        Row: PropositionOffreRow;
        Insert: Partial<PropositionOffreRow> & {
          appel_id: string;
          recycleur_id: string;
          volume_propose_kg: number;
        };
        Update: Partial<Omit<PropositionOffreRow, "id">>;
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: UserRow["role"];
      lot_status: LotRow["status"];
      type_dechet: LotRow["type_dechet"];
      confirmation_step: ConfirmationRow["step"];
      confirmation_status: ConfirmationRow["status"];
      stock_status: StockRow["status"];
      signalement_status: SignalementRow["status"];
      abonnement_plan: AbonnementRow["plan"];
      abonnement_statut: AbonnementRow["statut"];
    };
  };
};
