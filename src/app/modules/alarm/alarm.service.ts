import { Alarm, Task, User } from "@prisma/client";
import prisma from "../../shared/prisma";
import { ALARM_STATUS } from "../assign-task/assignTask.constant";
import cron from "node-cron";
import dayjs from "dayjs";
import { sendNotification } from "../../shared/sendNotification";
export const executeAlarm = async () => {
  const allAlarms = await prisma.alarm.findMany({
    where: { status: ALARM_STATUS.ACTIVE },
    include: { assignTask: { include: { task: true, addTask: { include: { user: true } } } } },
  });

  allAlarms.forEach((alarm) => {
    const { dateTime, interval } = alarm; // `dateTime` is when the alarm should first trigger
    scheduleAlarm(
      dateTime,
      interval,
      alarm,
      alarm.assignTask.task,
      alarm.assignTask?.addTask?.user,
    );
  });
};

// Schedule an alarm
function scheduleAlarm(dateTime: Date, interval: number, alarm: Alarm, task: Task, user: User) {
  const intervalInSeconds = interval * 60 * 60; // Convert hours to seconds

  cron.schedule(`*/${intervalInSeconds} * * * *`, async () => {
    const currentTime = dayjs().utc().toDate();

    // Check if it's time to trigger the alarm
    if (currentTime >= dayjs(dateTime).utc().toDate()) {
      await triggerAlarmNotification(alarm, task, user);

      // After triggering, mark it as triggered in the database
      await prisma.alarm.update({
        where: { id: alarm.id },
        data: { status: ALARM_STATUS.TRIGGERED },
      });
    }
  });
}

// Trigger the alarm notification (using your existing notification function)
async function triggerAlarmNotification(alarm: Alarm, task: Task, user: User) {
  const message = alarm.message;
  console.log(`Alarm triggered: ${message}`);

  if (user?.fcmToken) {
    await sendNotification([user.fcmToken], {
      title: `Remainder for your task, ${task.title}`,
      body: message,
      userId: user.id,
    });
  }
}
