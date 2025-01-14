import { z } from "zod";
import { TASK_ASSIGNED_TO } from "../assign-task/task.constant";

const documentValidationSchema = z.object({
  key: z.string({ required_error: "Document Key is required" }),
  url: z.string({ required_error: "Document URL is required" }),
});

const createTaskValidationSchema = z.object({
  title: z.string({ required_error: "Title is required" }),
  assignedTo: z.enum([...Object.keys(TASK_ASSIGNED_TO)] as [string, ...string[]], {
    required_error: "Assigned to is required",
    invalid_type_error: "Assigned to must be a MYSELF or MULTIPLE",
  }),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  subCategoryId: z.string().optional(),
  subCategory: z.string().optional(),
  date: z.string({ required_error: "Date is required" }),
  time: z.string({ required_error: "Time is required" }),
  description: z.string({ required_error: "Description is required" }),
  documents: z.array(documentValidationSchema).optional(),
});

const updateTaskValidationSchema = z.object({
  title: z.string().optional(),
  assignedTo: z
    .enum([...Object.keys(TASK_ASSIGNED_TO)] as [string, ...string[]], {
      invalid_type_error: "Assigned to must be a MYSELF or MULTIPLE",
    })
    .optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  subCategoryId: z.string().optional(),
  subCategory: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  description: z.string().optional(),
  documents: z.array(documentValidationSchema).optional(),
});

export const TaskValidation = {
  createTaskValidationSchema,
  updateTaskValidationSchema,
};
