import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import zodError from "../errors/zodError";
import { JsonWebTokenError } from "jsonwebtoken";
import AppError from "../errors/AppError";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong!";
  let errorDetails = null;
  let error = err;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const zod = zodError(err);
    statusCode = zod.statusCode;
    message = zod.message;
    errorDetails = zod.errorDetails;
  }
  // Handle Prisma client known errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint violation
        statusCode = StatusCodes.CONFLICT;
        const duplicateField = err.meta?.target ? (err.meta.target as string) : "Field";
        message = `${duplicateField} already exists.`;
        errorDetails = err.meta;
        break;
      case "P2003": // Foreign key constraint violation
        statusCode = StatusCodes.BAD_REQUEST;
        message = err.meta?.modelName
          ? `${err.meta.modelName} cannot be deleted because it is dependent on other data.`
          : "Foreign key constraint violation.";
        errorDetails = err.meta;
        break;
      case "P2025": // Record not found
        statusCode = StatusCodes.NOT_FOUND;
        console.log(err);
        message = err.meta?.modelName
          ? `${err.meta.modelName} not found.`
          : error.message || "Record not found.";
        errorDetails = err.meta;
        break;
      case "P2014":
        statusCode = StatusCodes.BAD_REQUEST;
        message = err.meta?.modelName;
        break;
      case "P2032":
        const regexPatterns: {
          pattern: RegExp;
          message: (match: RegExpMatchArray) => string;
        }[] = [
          {
            pattern:
              /Error converting field "(.+?)" of expected non-nullable type "(.+?)", found incompatible value of "(.*?)"\./,
            message: (match) =>
              `Error converting field '${match[1]}' of expected non-nullable type '${match[2]}', found incompatible value '${match[3]}'.`,
          },
        ];

        statusCode = StatusCodes.BAD_REQUEST;

        message = err.message;

        for (const pattern of regexPatterns) {
          const match = message.match(pattern.pattern);
          if (match) {
            message = pattern.message(match as RegExpMatchArray);
            break;
          }
        }

        break;
      default:
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = err.message;
        errorDetails = err.meta;
        break;
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;

    // Define the regex patterns and their corresponding messages
    const regexPatterns: {
      pattern: RegExp;
      message: (match: RegExpMatchArray) => string;
    }[] = [
      {
        pattern: /Argument `(.+)` is missing/,
        message: (match) => `${match[1]} is required.`,
      },
      {
        pattern: /Unknown argument `(.+?)`\..+Available options are(.+)/,
        message: (match) =>
          `Unknown argument '${match[1]}'. Available options are:${match[2].trim()}`,
      },
      {
        pattern: /Field `(.+?)` of type `(.+?)` is invalid\..+/,
        message: (match) => `Invalid field '${match[1]}' of type '${match[2]}'.`,
      },
      {
        pattern: /Unique constraint failed on the fields: \((.+)\)/,
        message: (match) => `Unique constraint failed on the fields: ${match[1]}`,
      },
      {
        pattern: /Invalid value for argument `(.+)`: premature end of input\. Expected (.+)\./,
        message: (match) => `Invalid value for argument '${match[1]}'. Expected: ${match[2]}.`,
      },
      {
        pattern: /Argument `where` of type (.+?) needs at least one of `(.+?)`/,
        message: (match) =>
          `The 'where' argument of type '${
            match[1]
          }' requires at least one of the following fields: ${match[2].replace(/`/g, "")}.`,
      },
      {
        pattern:
          /Invalid value for argument `(.+)`: We could not serialize \[object (.+?)\] value\..+/,
        message: (match) =>
          `Invalid value for argument '${match[1]}'. The value '[object ${match[2]}]' could not be serialized. Ensure it is a valid JSON or implement a '.toJSON()' method on it.`,
      },
      {
        pattern:
          /Error converting field "(.+?)" of expected non-nullable type "(.+?)", found incompatible value of "(.+?)"\./,
        message: (match) =>
          `Field '${match[1]}' of type '${match[2]}' expects a non-nullable value but received '${match[3]}'. Please provide a valid value.`,
      },
    ];

    // Default message if no pattern matches
    message = err.message;

    // Check each regex pattern
    for (const { pattern, message: formatMessage } of regexPatterns) {
      const match = err.message.match(pattern);
      if (match) {
        message = formatMessage(match as RegExpMatchArray); // Explicitly assert match is a valid array
        break;
      }
    }
  }

  // Handle JWT errors (Unauthorized)
  else if (err instanceof JsonWebTokenError) {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = err.message;
  }
  // Handle custom application errors (AppError)
  else if (err instanceof AppError) {
    statusCode = err.statuscode || StatusCodes.INTERNAL_SERVER_ERROR;
    message = err.message || "Something went wrong.";
  }
  // Generic server error handler (if no specific case is matched)
  else {
    message = err.message || "Internal Server Error";
  }

  // Logging errors (Development-only logging for debugging)
  if (process.env.NODE_ENV === "development") {
    console.error("Error stack:", err.stack); // Log the stack trace
  }

  console.log(error);

  res.status(statusCode).json({
    success: false,
    message: req.t(message),
    errorDetails,
    error: process.env.NODE_ENV === "development" ? error : {}, // Hide full error details in production
  });
};

export default globalErrorHandler;
