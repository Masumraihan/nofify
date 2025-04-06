import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";
import express from "express";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFoundErrorHandler from "./app/middlewares/notFoundErrorHandler";
import router from "./app/routes";
import passport, { use } from "passport";
import GoogleStrategy from "passport-google-oauth20";
import session from "express-session";
import config from "./app/config";
import sendResponse from "./app/shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import prisma from "./app/shared/prisma";
import AppError from "./app/errors/AppError";
import { USER_ROLE } from "./app/enums";
import { createToken } from "./app/helpers/jwtHelper";
import { executeAlarm } from "./app/modules/alarm/alarm.service";
import { CipherKey } from "crypto";
import { User } from "@prisma/client";
import { oauth2Client } from "./app/shared/oauth2Client";
const app = express();

const Strategy = GoogleStrategy.Strategy;

const corsOrigins = [
  "http://localhost:5012",
  "http://192.168.10.188:5012",
  "http://192.168.10.188:5012",
  "http://localhost",
  "http://127.0.0.1",
  "http://192.168.10.133:3000",
  "http://localhost:5011",
  "http://192.168.10.43:5011",
];

// PARSERS
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
i18next.use(Backend).init({
  //debug: true,
  preload: ["en", "es"],
  fallbackLng: "en",
  detection: {
    order: ["header"],
    caches: ["cookie"],
  },
  backend: {
    loadPath: __dirname + "/translation/{{lng}}/translation.json",
  },
});
app.use(i18nextMiddleware.handle(i18next));
// RUN CRON JOBS EVERY HOUR
//cron.schedule("0 * * * *", async () => {
//  const result = await executeAlarm();
//  console.log(result);
//});

app.use(
  session({
    secret: config.auth.googleLoginSecret as CipherKey, // Replace with a secure secret
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  // Store the user's ID or any unique identifier in the session
  done(null, user); // or use `user.email` or `user.id` (whichever is unique)
});

passport.deserializeUser(async (user: User, done) => {
  try {
    // Fetch user data from database using the stored ID
    const userData = await prisma.user.findFirst({ where: { id: user.id } });
    done(null, userData); // Attaches the full user object to `req.user`
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new Strategy(
    {
      clientID: config.auth.googleClientId as string,
      clientSecret: config.auth.googleClientSecret as string,
      callbackURL: config.auth.googleRedirectUrl as string,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile?.emails?.length ? profile.emails[0].value : null,
        token: accessToken,
      };

      return done(null, user); // Pass the user object
    },
  ),
);
// Routes
app.get(
  "/auth/google",
  async (req, res, next) => {
    try {
      const role = req.headers.role || USER_ROLE.USER;

      if (!Object.values(USER_ROLE).includes(role as any)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Please provide a valid role");
      }

      if (role) {
        req.body = {
          role,
        };
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  passport.authenticate("google", { scope: ["email", "profile"] }),
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: true }),
  async (req, res, next) => {
    try {
  

      const user = req.user;
      if (user && "email" in user) {
        const userData = await prisma.user.findFirst({
          where: { email: user?.email as string },
        });

      

        let accessToken = null;
        let refreshToken = null;

        if (userData) {
          if (userData?.isDelete) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
          }

          if (!userData?.isActive) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
          }

          const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
          accessToken = createToken(
            jwtPayload,
            config.jwt.jwtAccessTokenSecret as string,
            config.jwt.jwtAccessTokenExpires as string,
          );

          refreshToken = createToken(
            jwtPayload,
            config.jwt.jwtRefreshTokenSecret as string,
            config.jwt.jwtRefreshTokenExpires as string,
          );
        } else {
          const usersCount = await prisma.user.count({});
          const referCode = `NOFIFY_${usersCount + 1}`;

          const newUser = await prisma.user.create({
            data: {
              email: user?.email as string,
              role: req.body.role as string,
              firstName: "",
              lastName: "",
              phoneNumber: "",
              code: referCode,
            },
          });
        }

        res.cookie("accessToken", accessToken, {
          secure: config.nodeEnv === "production",
          httpOnly: true,
          sameSite: "none",
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        res.cookie("refreshToken", refreshToken, {
          secure: config.nodeEnv === "production",
          httpOnly: true,
          sameSite: "none",
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: "User logged in successfully",
          data: {
            accessToken,
            refreshToken,
            googleToken: (user as any).token,
          },
        });
      }
    } catch (error) {
      next();
    }
  },
);

app.get("/", (req, res) => {
  res.json({ message: "Hello from server" });
});

app.use("/api/v1", router);

// ERROR HANDLERS
app.use(globalErrorHandler);
app.use(notFoundErrorHandler);

export default app;
