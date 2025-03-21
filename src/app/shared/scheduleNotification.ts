import { User } from "@prisma/client";
import schedule, { Job } from "node-schedule";

// Assuming you have an existing function to send notifications
function sendNotification(message: string): void {
  console.log(`[${new Date().toISOString()}] Notification: ${message}`);
  // Implement actual notification-sending logic here
}

// Map to track active jobs
const activeJobs: Map<string, Job[]> = new Map();

/**
 * Schedules a notification at a specified datetime and continues sending
 * notifications at regular intervals in UTC time.
 *
 * @param targetDateTimeUTC - The initial datetime (must be in UTC)
 * @param reminderIntervalHours - Interval in hours for recurring notifications
 * @returns A unique identifier for stopping the scheduled notifications
 */
export function scheduleNotifications(
  targetDateTimeUTC: Date,
  reminderIntervalHours: number,
  payload: {
    message: string;
    recurringMessage?: string;
    userId: string;
  },
): string {
  const now = new Date();
  if (targetDateTimeUTC < now) {
    console.error("Target datetime is in the past. Notification not scheduled.");
    return "";
  }

  console.log({ payload });

  const scheduleId = `${targetDateTimeUTC.getTime()}-${reminderIntervalHours}`;
  const jobs: Job[] = [];

  // Schedule the initial notification
  const initialJob = schedule.scheduleJob(targetDateTimeUTC, () => {
    sendNotification("Initial notification at the specified datetime (UTC).");
  });
  jobs.push(initialJob);

  // Schedule recurring notifications
  const recurringJob = schedule.scheduleJob(
    { start: targetDateTimeUTC, rule: `*/${reminderIntervalHours} * * * *` },
    () => {
      sendNotification(`Recurring notification every ${reminderIntervalHours} hour(s) (UTC).`);
    },
  );
  jobs.push(recurringJob);

  // Store active jobs for cancellation later
  activeJobs.set(scheduleId, jobs);
  console.log(`Scheduled notifications with ID: ${scheduleId}`);

  return scheduleId;
}

/**
 * Stops a scheduled notification.
 *
 * @param scheduleId - The unique ID returned by `scheduleNotifications`
 */
function stopNotifications(scheduleId: string): void {
  const jobs = activeJobs.get(scheduleId);
  if (jobs) {
    jobs.forEach((job) => job.cancel());
    activeJobs.delete(scheduleId);
    console.log(`Stopped notifications for schedule ID: ${scheduleId}`);
  } else {
    console.log(`No active notification found for schedule ID: ${scheduleId}`);
  }
}
