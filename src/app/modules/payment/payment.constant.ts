export const PAYMENT_STATUS = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  REFUNDED: "REFUNDED",
} as const;
export type TPaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const paymentSearchableFields = ["stripeTransactionId", "transactionId", "status"];
export const paymentFilterableFields = [
  "userId",
  "stripeTransactionId",
  "transactionId",
  "subscriptionId",
  "status",
  "searchTerm",
  "firstName",
  "lastName",
  "email",
];
