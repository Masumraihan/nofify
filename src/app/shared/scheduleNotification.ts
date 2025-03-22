import { Job } from "node-schedule";
import schedule from "node-schedule";
import { sendNotification } from "./sendNotification";
import AppError from "../errors/AppError";
import { StatusCodes } from "http-status-codes";

// Map to track active jobs
const activeJobs: Map<string, { job?: Job; interval?: NodeJS.Timeout }> = new Map();

/**
 * Schedules a notification at a specified datetime and continues sending
 * notifications at regular intervals.
 *
 * @param targetDateTimeUTC - The initial datetime (must be in UTC)
 * @param reminderIntervalSeconds - Interval in seconds for recurring notifications
 * @returns A unique identifier for stopping the scheduled notifications
 */
export function scheduleNotifications(
  targetDateTimeUTC: Date,
  reminderIntervalSeconds: number,
  payload: {
    message: string;
    recurringMessage?: string;
    userId: string;
    fcmToken: string;
  },
): string {
  try {
    const now = new Date();
    if (targetDateTimeUTC < now) {
      console.error("Target datetime is in the past. Notification not scheduled.");
      return "";
    }

    console.log(`Scheduling notification for user ${payload.userId}`);

    const scheduleId = `${new Date().getTime()}-${reminderIntervalSeconds}`;

    // Store active job initially without the interval
    activeJobs.set(scheduleId, {});

    // Schedule the initial notification
    const initialJob = schedule.scheduleJob(targetDateTimeUTC, () => {
      sendNotification([payload.fcmToken], {
        title: "Your task is starting now",
        body: payload.message,
        userId: payload.userId,
      });

      // Start recurring notifications only after the first one is sent
      const interval = setInterval(() => {
        console.log(reminderIntervalSeconds);
        sendNotification([payload.fcmToken], {
          title: "Reminder from Notify, " + scheduleId,
          body: payload.recurringMessage || payload.message,
          userId: payload.userId,
          data: {
            type: "reminder",
          },
        });
      }, reminderIntervalSeconds * 1000);

      // Update the stored job with the interval reference
      activeJobs.set(scheduleId, { job: initialJob, interval });
    });

    // Store initial job reference
    activeJobs.set(scheduleId, { job: initialJob });

    console.log(`Scheduled notifications with ID: ${scheduleId}`);
    return scheduleId;
  } catch (error) {
    console.error(error);
    throw new AppError(StatusCodes.BAD_REQUEST, "Error scheduling notifications");
  }
}

/**
 * Stops a scheduled notification.
 *
 * @param scheduleId - The unique ID returned by `scheduleNotifications`
 */
export function stopNotifications(scheduleId: string): void {
  const jobData = activeJobs.get(scheduleId);
  if (jobData) {
    if (jobData.job) jobData.job.cancel();
    if (jobData.interval) {
      clearInterval(jobData.interval);
      console.log(`Cleared interval for schedule ID: ${scheduleId}`);
    }
    activeJobs.delete(scheduleId);

    console.log(`Stopped notifications for schedule ID: ${scheduleId}`);
  } else {
    console.log(`No active notification found for schedule ID: ${scheduleId}`);
  }
}
