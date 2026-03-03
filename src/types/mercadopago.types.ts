export interface MercadoPagoPaymentNotification {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'merchant_order';
  date_created: string;
  user_id: number;
  api_version: string;
  action: 'payment.created' | 'payment.updated';
  data: {
    id: string;
  };
}

export interface MercadoPagoPayment {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded';
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
  payment_type_id: string;
  payer: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  metadata: Record<string, string>;
  date_created: string;
  date_approved: string | null;
}
