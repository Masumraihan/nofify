import { TaskRemainderMinutes, Settings } from "@prisma/client";
import prisma from "../../shared/prisma";

const createSettings = async (payload: Settings) => {
  const result = await prisma.settings.create({ data: payload });
  return result;
};

const getSettings = async (label: string) => {
  const result = await prisma.settings.findFirst({
    where: {
      label,
    },
  });
  return result;
};

const updateSettings = async (payload: Settings) => {
  const result = await prisma.settings.upsert({
    where: { label: payload.label },
    update: payload,
    create: payload,
  });
  return result;
};

const getTaskRemainderMinutes = async () => {
  const result = await prisma.taskRemainderMinutes.findMany();
  return result;
};

const createTaskRemainderMinutes = async (payload: TaskRemainderMinutes) => {
  const result = await prisma.taskRemainderMinutes.upsert({
    where: { label: payload.label },
    update: payload,
    create: payload,
  });
  return result;
};

const deleteTaskRemainderMinutes = async (id: string) => {
  const result = await prisma.taskRemainderMinutes.delete({ where: { id } });
  return result;
};

export const SettingsServices = {
  createSettings,
  getSettings,
  updateSettings,
  getTaskRemainderMinutes,
  createTaskRemainderMinutes,
  deleteTaskRemainderMinutes,
};
