export type TIssue = {
  field: string | number;
  message: string;
};

export type TErrorResponse = {
  statusCode: number;
  message: string;
  errorDetails: { issues: TIssue[] };
};
