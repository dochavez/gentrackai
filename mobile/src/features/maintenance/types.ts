export type MaintenanceStatus = 'done' | 'overdue' | 'soon' | 'scheduled';

/** Matches the backend MaintenanceItemResource. */
export type MaintenanceItem = {
  id: string;
  title: string;
  detail: string | null;
  done: boolean;
  status: MaintenanceStatus;
  statusLabel: string;
  /** Raw due date (YYYY-MM-DD) for editing; `dateLabel` is the display string. */
  dueDate: string | null;
  dateLabel: string | null;
  /** Cost paid, set when the service is completed. */
  cost: number | null;
  costLabel: string | null;
  /** "You" / member name / "Unassigned" — computed backend-side. */
  assigneeName: string;
  assigneeInitials: string | null;
  unassigned: boolean;
  assignedToMe: boolean;
};

/** Report period windows (match the backend MaintenanceReport::PERIODS keys). */
export type ReportPeriod = '3mo' | '6mo' | '9mo' | '1y' | '5y';

export type ReportSummary = {
  services: number;
  totalPaid: number;
  totalPaidLabel: string;
  estSaved: number;
  estSavedLabel: string;
};

export type ReportService = {
  id: string;
  dateLabel: string | null;
  title: string;
  generatorName: string | null;
  cost: number | null;
  costLabel: string;
};

/** Matches the backend MaintenanceReport service payload. */
export type MaintenanceReport = {
  period: ReportPeriod;
  periodLabel: string;
  summary: ReportSummary;
  services: ReportService[];
  note: string;
};

/** Quick-pick due window for the "schedule a service" form. */
export type DueOption = { label: string; days: number };

/** A selectable report period option (chip). */
export type PeriodOption = { key: ReportPeriod; label: string };

/** Design-token color pair for a maintenance status badge. */
export type StatusColors = { color: string; bg: string };
