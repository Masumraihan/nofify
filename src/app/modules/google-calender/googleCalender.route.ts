import { Router } from "express";
import { google } from "googleapis";
import { oauth2Client } from "../../shared/oauth2Client";
import auth from "../../middlewares/auth";
import prisma from "../../shared/prisma";
import sendResponse from "../../shared/sendResponse";

const router = Router();

router.get("/authorization", (req, res, next) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/calendar",
      ],
      prompt: "consent",
      //redirect_uri: "http://localhost:2000/api/v1/google-calender/save-into-calender",
    });
    console.log({ authUrl });
    res.redirect(`${authUrl}`);
  } catch (error) {
    next(error);
  }
});

router.get("/save-into-calender", async (req, res, next) => {
  try {
    //const { taskId } = req.params;

    const access_token = req.query.access_token as string;
    const task = await prisma.task.findFirstOrThrow();

    const { title, description, date, time, userId } = task;

    // Format the date and time into a Google Calendar-compatible format
    const startDateTime = new Date(`${new Date()}`).toISOString();
    const endDateTime = new Date(
      new Date(`${new Date()}`).getTime() + 60 * 60 * 1000,
    ).toISOString();

    console.log({ startDateTime, endDateTime });

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
      sendNotifications: true,
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
