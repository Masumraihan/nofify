class AppError extends Error {
  statuscode: number;
  message: string;
  constructor(statusCode: number, message: string, stack?: "") {
    super();
    this.statuscode = statusCode;
    this.message = message;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default AppError;
