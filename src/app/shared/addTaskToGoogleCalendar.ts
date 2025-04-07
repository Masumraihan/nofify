import { Task } from "@prisma/client";
import { google } from "googleapis";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/AppError";
import { oauth2Client } from "./oauth2Client";

export const addTaskToGoogleCalendar = async ({ task }: { task: Task }) => {
  try {
    // Assuming task is an object with the following structure:
    // task = { title, description, date, time, categoryName, subCategoryName, userId }

    const { title, description, date, time, userId } = task;

    // Format the date and time into a Google Calendar compatible format
    const startDateTime = new Date(`${date}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Assuming duration is 1 hour

    // Get OAuth2 client

    const SCOPES = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      // You can also include other relevant scopes based on your use case
    ];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES, // Add this scope
      redirect_uri: config.auth.googleRedirectUrl,
    });

    //if (credentials.refresh_token) {
    //  await prisma.user.updateMany({
    //    where: { email: user?.email as string },
    //    data: { googleRefreshToken: credentials.refresh_token },
    //  });
    //}

    // Set the access token (assume it's already obtained)
    //oauth2Client.setCredentials({
    //  access_token: credentials.access_token,
    //});

    // Initialize the Google Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Event details to be added to Google Calendar
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
      attendees: [
        // Add attendees if needed
        // {
        //   email: `user${userId}@yourdomain.com`, // You can replace this with the actual user's email
        // },
      ],
    };

    // Insert event into the calendar
    const response: any = await calendar.events.insert({
      calendarId: "primary", // Can be changed to any calendarId (e.g., 'primary')
      requestBody: event, // Correctly use `requestBody` instead of `resource`
      sendNotifications: true,
      supportsAttachments: true,
      sendUpdates: "all",
    });

    console.log("Event created: " + response?.data?.htmlLink); // Link to the created event
    return response?.data;
  } catch (error: any) {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.message === "Insufficient Permission"
    ) {
      // This handles the specific "Insufficient Permission" error
      console.error(
        "Google API Error: Insufficient Permission. Please check your OAuth token and permissions.",
      );
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Insufficient permissions to add event to Google Calendar.",
      );
    } else {
      console.error("Error adding task to Google Calendar:", error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "An unexpected error occurred while adding the task to Google Calendar.",
      );
    }
  }
};
