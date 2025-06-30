import { User } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import { CipherKey } from "crypto";
import express from "express";
import session from "express-session";
import { StatusCodes } from "http-status-codes";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import config from "./app/config";
import { USER_ROLE } from "./app/enums";
import AppError from "./app/errors/AppError";
import { createToken } from "./app/helpers/jwtHelper";
import globalErrorHandler from "./app/middlewares/globalErrorHandlers";
import notFoundErrorHandler from "./app/middlewares/notFoundErrorHandler";
import router from "./app/routes";
import prisma from "./app/shared/prisma";
import { generateReferCode } from "./app/modules/auth/auth.utils";
import { getSecret } from "./app/constant/secretManager";
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
  "http://204.197.173.195:5011",
  "http://204.197.173.195:3000",
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

const getSecrets = async () => {
  try {
    const secret = await getSecret("nof_app");
    const data = JSON.parse(secret as string);
  } catch (error) {
    console.log(error);
  }
};

getSecrets();

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
  done(null, user.id); // or use `user.email` or `user.id` (whichever is unique)
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
  "/api/v1/auth/google",
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
      const user: any = req.user;
      if (user && "email" in user) {
        const userData = await prisma.user.findFirst({
          where: { email: user?.email as string },
        });

        let accessToken = null;
        let refreshToken = null;
        let role = null;
        let id = null;

        if (userData) {
          try {
            if (userData?.isDelete) {
              throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
            }

            if (!userData?.isActive) {
              throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
            }

            const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
            role = userData.role;
            id = userData.id;
            if (config.jwt.jwtAccessTokenSecret) {
              accessToken = createToken(
                jwtPayload,
                config.jwt.jwtAccessTokenSecret as string,
                config.jwt.jwtAccessTokenExpires as string,
              );
            }

            if (config.jwt.jwtRefreshTokenSecret) {
              refreshToken = createToken(
                jwtPayload,
                config.jwt.jwtRefreshTokenSecret as string,
                config.jwt.jwtRefreshTokenExpires as string,
              );
            }
          } catch (error) {
            next();
          }
        } else {
          try {
            const referCode = await generateReferCode();
            const newUser = await prisma.$transaction(async (tx) => {
              const newUser = await tx.user.create({
                data: {
                  role: USER_ROLE.USER,
                  phoneNumber: "",
                  code: referCode,
                  profilePicture: user?.photos?.length ? user.photos[0].value : "",
                  signUpMethod: "GOOGLE",
                  firstName: user?.displayName?.split(" ")[0] || "",
                  lastName: user?.displayName?.split(" ")[1] || "",
                  email: user?.email as string,
                },
              });

              return newUser;
            });

            role = newUser?.role;
            id = newUser.id;

            const jwtPayload = { email: newUser.email, role: newUser.role, id: newUser.id };
            if (config.jwt.jwtAccessTokenSecret) {
              accessToken = createToken(
                jwtPayload,
                config.jwt.jwtAccessTokenSecret as string,
                config.jwt.jwtAccessTokenExpires as string,
              );
            }

            if (config.jwt.jwtRefreshTokenSecret) {
              refreshToken = createToken(
                jwtPayload,
                config.jwt.jwtRefreshTokenSecret as string,
                config.jwt.jwtRefreshTokenExpires as string,
              );
            }
          } catch (error) {
            next(error);
          }
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

        res.redirect(
          `${config.server_url}/api/v1/auth/success?role=${role}&id=${id}&accessToken=${accessToken}&refreshToken=${refreshToken}`,
        );
      } else {
        next();
      }
    } catch (error) {
      next();
    }
  },
);

app.get("/", (req, res) => {
  res.json({ message: "Hello from server" });
});

app.get("/health", (req, res) => {
  res.json({ message: "The server is heathy" });
});

app.use("/api/v1", router);

// ERROR HANDLERS
app.use(globalErrorHandler);
app.use(notFoundErrorHandler);

export default app;

//app.get(
//  "/auth/google/callback",
//  passport.authenticate("google", { session: true }),
//  async (req, res, next) => {
//    try {
//      const googleAuthorizationCode = req.query.code as string;
//      const prompt = req.query.prompt as string;

//      // IF TYPE IS SAVE INTO CALENDER THEN GET THE ACCESS TOKEN FROM URL QUERY AND REDIRECT TO SAVE INTO CALENDER API
//      console.log(prompt === "consent");
//      if (prompt === "consent") {
//        try {
//          // Verify OAuth2 client configuration
//          console.log("OAuth2 Client Config:", {
//            clientId: oauth2Client._clientId,
//          });

//          // Exchange the code for tokens
//          console.log("Attempting token exchange...");
//          const { tokens } = await oauth2Client.getToken(googleAuthorizationCode);
//          console.log("Token exchange successful");

//          if (!tokens.access_token) {
//            throw new Error("No access token received from Google");
//          }

//          oauth2Client.setCredentials(tokens);
//          const encodedToken = encodeURIComponent(tokens.access_token);
//          const redirectUrl = `http://192.168.10.188:2000/api/v1/google-calendar/save-into-calendar?access_token=${encodedToken}`;

//          console.log("Redirecting to:", redirectUrl);
//          return res.redirect(redirectUrl);
//        } catch (error) {
//          next(error);
//        }
//      } else {
//        // IF TYPE IS NOT SAVE INTO CALENDER THEN GET THE USER DATA AND CREATE A NEW USER.
//        const user = req.user;
//        if (user && "email" in user) {
//          const userData = await prisma.user.findFirst({
//            where: { email: user?.email as string },
//          });

//          let accessToken = null;
//          let refreshToken = null;

//          if (userData) {
//            if (userData?.isDelete) {
//              throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
//            }

//            if (!userData?.isActive) {
//              throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
//            }

//            const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
//            accessToken = createToken(
//              jwtPayload,
//              config.jwt.jwtAccessTokenSecret as string,
//              config.jwt.jwtAccessTokenExpires as string,
//            );

//            refreshToken = createToken(
//              jwtPayload,
//              config.jwt.jwtRefreshTokenSecret as string,
//              config.jwt.jwtRefreshTokenExpires as string,
//            );
//          } else {
//            const usersCount = await prisma.user.count({});
//            const referCode = `NOFIFY_${usersCount + 1}`;

//            const newUser = await prisma.user.create({
//              data: {
//                email: user?.email as string,
//                role: req.body.role as string,
//                firstName: "",
//                lastName: "",
//                phoneNumber: "",
//                code: referCode,
//              },
//            });
//          }

//          res.cookie("accessToken", accessToken, {
//            secure: config.nodeEnv === "production",
//            httpOnly: true,
//            sameSite: "none",
//            maxAge: 1000 * 60 * 60 * 24 * 365,
//          });
//          res.cookie("refreshToken", refreshToken, {
//            secure: config.nodeEnv === "production",
//            httpOnly: true,
//            sameSite: "none",
//            maxAge: 1000 * 60 * 60 * 24 * 365,
//          });

//          sendResponse(res, {
//            statusCode: StatusCodes.OK,
//            success: true,
//            message: "User logged in successfully",
//            data: {
//              accessToken,
//              refreshToken,
//              //googleToken: (user as any).token,
//              googleAuthorizationCode,
//            },
//          });
//        }
//      }
//    } catch (error) {
//      next();
//    }
//  },
//);
