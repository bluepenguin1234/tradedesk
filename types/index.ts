export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type ProjectStatus = 'lead' | 'quoted' | 'in_progress' | 'complete' | 'invoiced' | 'paid';

export interface LineItem {
  description: string;
  qty: number;
  unit_price: number;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  trade: string | null;
  business_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarded: boolean;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  quote_number: string | null;
  status: QuoteStatus;
  line_items: LineItem[];
  tax_rate: number;
  subtotal: number;
  total: number;
  notes: string | null;
  expires_at: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  accepted_name: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  quote_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  line_items: LineItem[];
  tax_rate: number;
  subtotal: number;
  total: number;
  due_date: string | null;
  stripe_payment_link: string | null;
  stripe_payment_intent_id: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}
