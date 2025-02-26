export const TASK_ASSIGNED_TO = {
  MYSELF: "MYSELF",
  MULTIPLE: "MULTIPLE",
} as const;
export type TTaskAssignedTo = (typeof TASK_ASSIGNED_TO)[keyof typeof TASK_ASSIGNED_TO];
