import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import AppError from "../../errors/AppError";
import { CustomRequest, TTokenUser } from "../../types/common";
import { AuthServices } from "./auth.service";
import config from "../../config";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import passport from "passport";
import { USER_ROLE } from "../../enums";

const signUp = catchAsync(async (req, res) => {
  const result = await AuthServices.signUpIntoDb(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sign Up successfully!, please verify your email",
    data: result,
  });
});

const googleLogin = catchAsync(async (req, res, next) => {
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
});

const googleCallback = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  if (user && "email" in user) {
    const { accessToken, refreshToken, role, id } = await AuthServices.googleCallback(user);
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
      data: {},
    });
  }
});

const verifyAccount = catchAsync(async (req, res) => {
  const { token } = req.headers;
  const { accessToken, refreshToken, role, id } = await AuthServices.verifyAccount(
    token as string,
    req.body,
  );

  res.cookie("refreshToken", refreshToken, {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Account verified successfully, Please login now",
    data: {
      accessToken,
      role,
      id,
    },
  });
});

const resendOtp = catchAsync(async (req, res) => {
  //const t = req.headers.token as string;

  //const t2 = req.body.token;
  //if (!t2 && !t) {
  //  throw new AppError(StatusCodes.UNAUTHORIZED, "Please provide your token");
  //}

  //const decode = jwt.decode(t2 || t) as TTokenUser;
  //if (!decode) {
  //  throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid Token");
  //}

  const { token } = await AuthServices.resendOtp( req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Otp resend successfully",
    data: {
      token: token,
    },
  });
});

const signIn = catchAsync(async (req, res) => {
  const result = await AuthServices.signInIntoDb(req.body);

  const { accessToken, refreshToken, role, id } = result;
  res.cookie("refreshToken", refreshToken, {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    sameSite: "strict",
  });

  res.cookie("accessToken", accessToken, {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    sameSite: "strict",
  });

  //if (paymentLink) {
  //  sendResponse(res, {
  //    statusCode: StatusCodes.OK,
  //    success: true,
  //    message: "Please complete your payment before login!",
  //    data: paymentLink,
  //  });
  //} else {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sign In successfully!",
    data: {
      accessToken,
      refreshToken,
      role,
      id,
    },
  });
  //}
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const refreshFromHeaders = req.headers.token as string;
  if (!refreshToken && !refreshFromHeaders) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please provide your refresh token");
  }
  const refreshTokenFromDB = refreshFromHeaders || refreshToken;

  const {
    accessToken,
    role,
    id,
    refreshToken: rToken,
  } = await AuthServices.refreshToken(refreshTokenFromDB);
  res.cookie("token", accessToken, {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token successfully",
    data: {
      accessToken,
      refreshToken: rToken,
      role,
      id,
    },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await AuthServices.changePassword(user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.forgetPasswordIntoDb(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Please check you ${req?.body?.phoneNumber ? "mobile number" : "email"} `,
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.token as string;
    const token_type = req.headers.token_type as string;
  if (!token) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Please provide your token");
  }
  const { accessToken, refreshToken, role, id } = await AuthServices.resetPassword(
    token as string,
    req.body,
    token_type,
  );

  res.cookie("refreshToken", refreshToken, {
    secure: config.nodeEnv === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password reset successfully!",
    data: {
      accessToken,
      role,
      id,
    },
  });
});

//const googleLogin = catchAsync(async (req, res) => {
//  const user = (req as any).user;
//  const result = await AuthServices.googleLogin(user);
//  console.log(result);
//  sendResponse(res, {
//    statusCode: StatusCodes.OK,
//    success: true,
//    message: "Logged in successfully",
//    data: result,
//  });
//});

const googleAuth = catchAsync(async (req, res) => {
  passport.authenticate("google", { scope: ["profile", "email"] });
});

const googleCallBack = catchAsync(async (req, res) => {
  res.redirect("/api/v1/auth/profile");
});

export const AuthController = {
  signUp,
  googleCallback,
  googleLogin,
  signIn,
  refreshToken,
  forgetPassword,
  resetPassword,
  verifyAccount,
  resendOtp,
  changePassword,
};
