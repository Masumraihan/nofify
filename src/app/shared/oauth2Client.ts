import { google } from "googleapis";
import config from "../config";

export const oauth2Client = new google.auth.OAuth2(
  config.auth.googleClientId,
  config.auth.googleClientSecret,
  config.auth.googleRedirectUrl,
);
