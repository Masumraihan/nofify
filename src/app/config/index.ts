import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT,
  ip: process.env.IP,
  nodeEnv: process.env.NODE_ENV,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  server_url: process.env.SERVER_URL,
  db: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    jwtAccessTokenExpires: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
    jwtRefreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    jwtRefreshTokenExpires: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
    jwtVerifyAccountSecret: process.env.VERIFY_ACCOUNT_SECRET,
    jwtVerifyAccountExpires: process.env.VERIFY_ACCOUNT_EXPIRATION_TIME,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET,
  },
  payment: {
    secretKey: process.env.PAYMENT_GATEWAY_SECRET_KEY,
    webHookUrl: process.env.WEB_HOOK_URL,
  },
  message: {
    twilioAccountSID: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    twilioServiceSID: process.env.TWILIO_SERVICE_ID,
  },
  auth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL,
    googleLoginSecret: process.env.GOOGLE_LOGIN_SECRET,
  },
  calender: {
    googleClientId: process.env.GOOGLE_CLIENT_ID_CALENDER,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET_CALENDER,
    googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL_CALENDER,
  },
};
