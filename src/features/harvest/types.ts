export interface HarvestUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  weekly_capacity: number;
  is_active: boolean;
}

export interface HarvestTimeEntry {
  id: number;
  spent_date: string;
  hours: number;
  hours_without_timer: number;
  rounded_hours: number;
  notes: string | null;
  is_locked: boolean;
  locked_reason: string | null;
  approval_status: string;
  is_closed: boolean;
  is_billed: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
  };
  client: {
    id: number;
    name: string;
    currency: string;
  } | null;
  project: {
    id: number;
    name: string;
    code: string | null;
  } | null;
  task: {
    id: number;
    name: string;
  } | null;
}

export interface HarvestTimeEntriesResponse {
  time_entries: HarvestTimeEntry[];
  per_page: number;
  total_pages: number;
  total_entries: number;
  page: number;
  next_page: number | null;
  previous_page: number | null;
  links: {
    first: string;
    next: string | null;
    previous: string | null;
    last: string;
  };
}

export interface HarvestAccount {
  id: number;
  name: string;
  product: 'harvest' | 'forecast';
  google_sign_in_required?: boolean;
  mfa_required?: boolean;
}

export interface HarvestAccountsResponse {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  accounts: HarvestAccount[];
}
