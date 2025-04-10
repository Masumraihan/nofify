import { google } from "googleapis";
import config from "../config";

export const oauth2Client = new google.auth.OAuth2(
  config.calender.googleClientId,
  config.calender.googleClientSecret,
  config.calender.googleRedirectUrl,
  //"http://localhost:2000/api/v1/google-calender/save-into-calender",
);
