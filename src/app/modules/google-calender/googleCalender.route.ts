import { Router } from "express";
import { google } from "googleapis";
import { StatusCodes } from "http-status-codes";
import { isDate } from "moment";
import AppError from "../../errors/AppError";
import { getAccessTokenFromGoogle } from "../../shared/getAccessTokenFromGoogle";
import { oauth2Client } from "../../shared/oauth2Client";
import prisma from "../../shared/prisma";
import sendResponse from "../../shared/sendResponse";

const router = Router();

router.get("/authorization", async (req, res, next) => {
  try {
    const { taskId } = req.query;
    if (!taskId) {
      return next(new AppError(StatusCodes.BAD_REQUEST, "Task id is required"));
    }
    const task = await prisma.task.findFirstOrThrow({ where: { id: taskId as string } });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/calendar",
      ],
      prompt: "consent",
      state: JSON.stringify({ taskId }),
    });

    res.redirect(`${authUrl}`);
  } catch (error) {
    next(error);
  }
});

router.get("/save-into-calender", async (req, res, next) => {
  try {
    const { state } = req.query;

    const taskId = JSON.parse(state as string).taskId;

    const code = req.query.code as string;
    const access_token = await getAccessTokenFromGoogle({ code });
    const task = await prisma.task.findFirstOrThrow({ where: { id: taskId as string } });

    const { title, description, date, time, userId } = task;

    // check the date, if date is valid date then convert it to date time or if not then convert it to current date
    const dateTime = isDate(date) ? date : new Date();

    // Format the date and time into a Google Calendar-compatible format
    const startDateTime = new Date(dateTime).toISOString();
    const endDateTime = new Date(new Date(dateTime).getTime() + 60 * 60 * 1000).toISOString();

    oauth2Client.setCredentials({
      access_token,
    });

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: "UTC", // You can change the timezone if needed
      },
      end: {
        dateTime: endDateTime,
        timeZone: "UTC", // You can change the timezone if needed
      },
      attendees: [],
    };

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      //sendNotifications: true,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Event created successfully",
      data: response.data,
    });
  } catch (error) {
    next(error);
  }
});

export const GoogleCalenderRoutes = router;
