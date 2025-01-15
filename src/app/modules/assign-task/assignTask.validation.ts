import { z } from "zod";
const crateAssignTaskValidation = z.object({
  body: z.object({
    taskId: z.string({ required_error: "Task ID is required" }),
    userId: z.string({ required_error: "User ID is required" }),
  }),
});

const updateAssignTaskValidation = z.object({
  body: z.object({
    taskId: z.string().optional(),
    userId: z.string().optional(),
  }),
});

const updateAssignTaskStatus = z.object({
  body: z.object({
    taskId: z.string({ required_error: "Task ID is required" }),
    isAccepted: z.boolean({ required_error: "isAccepted is required" }),
    status: z.string().optional(),
  }),
});

export const AssignTaskValidations = {
  crateAssignTaskValidation,
  updateAssignTaskValidation,
  updateAssignTaskStatus,
};
