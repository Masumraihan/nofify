export const PAYMENT_STATUS = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  REFUNDED: "REFUNDED",
} as const;
export type TPaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
