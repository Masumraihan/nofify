import { z } from "zod";
import { ASSIGN_TASK_STATUS } from "./assignTask.constant";
const crateAssignTaskValidation = z.object({
  body: z.object({
    taskId: z.string({ required_error: "Task ID is required" }),
    userId: z.string({ required_error: "User ID is required" }),
  }),
});

const crateManyAssignTaskValidation = z.object({
  body: z.object({
    taskId: z.string({ required_error: "Task ID is required" }),
    userIds: z.array(z.string({ required_error: "User ID is required" })),
  }),
});

const updateAssignTaskValidation = z.object({
  body: z.object({
    taskId: z.string().optional(),
    userId: z.string().optional(),
  }),
});

const updateAssignTaskStatus = z.object({
  body: z
    .object({
      isAccepted: z.boolean().optional(),
      status: z.enum([...Object.values(ASSIGN_TASK_STATUS)] as [string, ...string[]]).optional(),
    })
    .strict(),
});

export const AssignTaskValidations = {
  crateAssignTaskValidation,
  crateManyAssignTaskValidation,
  updateAssignTaskValidation,
  updateAssignTaskStatus,
};
