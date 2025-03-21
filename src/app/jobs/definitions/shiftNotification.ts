import Agenda from "agenda";
import prisma from "../../shared/prisma";
import { sendNotification } from "../../shared/sendNotification";

export const shiftNotificationDefinition = async (agenda: Agenda) => {
  agenda.define("send shift start notification", async (job: any) => {
    // Use TypeScript types for job data
    const { assignTaskId, fcmToken }: { assignTaskId: string; fcmToken: string } = job.attrs.data;

    const assignTask = await prisma.assignTask.findUniqueOrThrow({
      where: { id: assignTaskId },
      include: { addTask: true },
    });

    console.log(`Sending shift start notification for user ${assignTask.addTask.userId}`);

    await sendNotification([fcmToken], {
      title: "Shift Start",
      body: `Your shift on from .`,
      userId: assignTask.addTask.userId,
    });
  });

  agenda.define("send shift end notification", async (job: any) => {
    const { assignTaskId, fcmToken }: { assignTaskId: string; fcmToken: string } = job.attrs.data;

    const assignTask = await prisma.assignTask.findUniqueOrThrow({
      where: { id: assignTaskId },
      include: { addTask: true },
    });

    console.log(`Sending shift end notification for user ${assignTask.addTask.userId}`);
    await sendNotification([fcmToken], {
      title: "Shift End",
      body: `Your shift on ${assignTask.taskId}.`,
      userId: assignTask.addTask.userId,
    });
  });
};
