export const taskSearchableFields = ["title", "description"];
export const assignTaskFilterableFields = ["status", "isAccepted", "userId", "date"];
export const ASSIGN_TASK_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};
export const taskFilterableFields = [
  "assignedTo",
  "categoryId",
  "subCategoryId",
  "date",
  "time",
  "searchTerm",
];

export const ALARM_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  TRIGGERED: "TRIGGERED",
};

export type TAlarmStatus = (typeof ALARM_STATUS)[keyof typeof ALARM_STATUS];
