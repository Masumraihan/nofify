import { Settings } from "@prisma/client";
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

export const SettingsServices = { createSettings, getSettings, updateSettings };
