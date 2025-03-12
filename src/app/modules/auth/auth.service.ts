import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import moment from "moment";
import path from "path";
import config from "../../config";
import AppError from "../../errors/AppError";
import { createToken, verifyToken } from "../../helpers/jwtHelper";
import { sendMail } from "../../helpers/sendMail";
import prisma from "../../shared/prisma";
import { sendOTP, sendSNSMessage } from "../../shared/sendSNSMessage";
import { TTokenUser } from "../../types/common";
import { generateReferCode } from "./auth.utils";
import { sendMessage, sendTwilioMessage } from "../../shared/sendMessage";

const signUpIntoDb = async (payload: any) => {
  const isUserExist = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exist with this email");
  }

  const isMobileNumberExist = await prisma.user.findFirst({
    where: {
      phoneNumber: payload.phoneNumber,
    },
  });

  if (isMobileNumberExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exist with this mobile number");
  }

  const code = await generateReferCode();
  const result = await prisma.$transaction(async (transactionClient) => {
    let hashedPassword;
    if (payload.password) {
      hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));
    }

    const user = await transactionClient.user.create({
      data: {
        ...payload,
        fullName: payload.firstName + " " + payload.lastName,
        password: hashedPassword,
        code,
      },
    });

    const jwtPayload = {
      email: user.email,
      role: user.role,
      id: user.id,
    };

    const token = createToken(
      jwtPayload,
      config.jwt.jwtVerifyAccountSecret as Secret,
      config.jwt.jwtVerifyAccountExpires as string,
    );

    //  SEND EMAIL FOR VERIFICATION
    const otp = Math.floor(100000 + Math.random() * 900000);
    const currentTime = new Date();

    // generate token
    const expiresAt = moment(currentTime).add(
      process.env.NODE_ENV === "development" ? 2 : 5,
      "minute",
    );

    const validation = await transactionClient.validation.create({
      data: {
        otp,
        isVerified: false,
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
      },
    });

    if (!user || !validation) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Failed to create user");
    }

    if (payload.referralCode) {
      const referUser = await transactionClient.user.findFirst({
        where: {
          referralCode: payload?.referralCode,
        },
      });

      // ADD 200 COIN TO REFER USER
      if (referUser) {
        await transactionClient.user.update({
          where: {
            id: referUser.id,
          },
          data: {
            totalCoins: {
              increment: 200,
            },
          },
        });
      }
    }

    const parentMailTemplate = path.join(process.cwd(), "/src/template/verify.html");
    const forgetOtpEmail = fs.readFileSync(parentMailTemplate, "utf-8");
    const html = forgetOtpEmail
      .replace(/{{name}}/g, user.email)
      .replace(/{{otp}}/g, otp.toString());
    await sendMail({
      to: user.email,
      html,
      subject: "Verify OTP From Pentagon",
    });

    //if (user.phoneNumber) {
    //  //CREATE TWILIO NUMBER
    //}

    return { token };
  });

  return result;
};

const googleCallback = async (user: TTokenUser) => {
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
    const code = await generateReferCode();

    const newUser = await prisma.user.create({
      data: {
        email: user?.email as string,
        role: user.role as string,
        firstName: "",
        lastName: "",
        phoneNumber: "",
        code,
      },
    });

    const jwtPayload = { email: newUser.email, role: newUser.role, id: newUser.id };
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
  }

  return { accessToken, refreshToken, role: userData?.role, id: userData?.id };
};
const verifyAccount = async (token: string, payload: { otp: number }) => {
  if (!token) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please provide your token");
  }

  const decode = verifyToken(token, config.jwt.jwtVerifyAccountSecret as Secret);
  if (!decode) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Token");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: decode.id, email: decode.email, isDelete: false },
    include: {
      validation: true,
    },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
  }

  if (userData.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }

  if (userData.validation?.isVerified === true) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is already verified");
  }

  if (userData.validation?.otp !== payload.otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Otp");
  }

  await prisma.validation.update({
    where: {
      userId: userData.id,
    },
    data: {
      isVerified: true,
      otp: null,
      expiresAt: null,
    },
  });

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpires as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.jwtRefreshTokenSecret as string,
    config.jwt.jwtRefreshTokenExpires as string,
  );

  return {
    accessToken,
    refreshToken,
    role: userData.role,
    id: userData.id,
  };
};

const resendOtp = async (payload: { email?: string; phoneNumber?: string; type?: string }) => {
  if (!payload.email && !payload.phoneNumber) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please provide email or phone number");
  }

  const userData = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
      isDelete: false,
    },
  });

  if (!userData?.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
  }
  if (userData?.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }
  //  SEND EMAIL FOR VERIFICATION
  const otp = Math.floor(100000 + Math.random() * 900000);
  const currentTime = new Date();
  // generate token
  const expiresAt = moment(currentTime).add(3, "minute");
  await prisma.validation.update({
    where: {
      userId: userData.id,
    },
    data: {
      otp,
      expiresAt: expiresAt.toISOString(),
      isVerified: false,
    },
  });

  if (payload.type === "mobile") {
    //  SEND SMS FOR VERIFICATION
    const res = await sendMessage(userData.phoneNumber as string, otp.toString());


    //const res = await sendVerificationCode(userData.phoneNumber as string);
  } else {
    //  SEND EMAIL FOR VERIFICATION
    const parentMailTemplate = path.join(process.cwd(), "/src/template/email.html");
    const forgetOtpEmail = fs.readFileSync(parentMailTemplate, "utf-8");
    const html = forgetOtpEmail
      .replace(/{{name}}/g, userData.email)
      .replace(/{{otp}}/g, otp.toString());
    sendMail({ to: userData.email, html, subject: "OTP From United Threads" });
    // after send verification email put the otp into db
  }
  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id.toString() };
  const token = createToken(
    jwtPayload,
    config.jwt.jwtVerifyAccountSecret as string,
    config.jwt.jwtVerifyAccountExpires as string,
  );

  return {
    token,
  };
};

const signInIntoDb = async (payload: {
  email: string;
  password?: string;
  fcmToken?: string;
  phoneNumber?: string;
}) => {
  const userData = await prisma.user.findFirstOrThrow({
    where: {
      OR: [{ email: payload.email }, { phoneNumber: payload?.phoneNumber }],
      isDelete: false,
    },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
  }
  if (userData.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }

  const isVerified = await prisma.validation.findUnique({
    where: { userId: userData.id, isVerified: true },
  });

  if (!isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is not verified");
  }

  if (!payload.password) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is required");
  }

  if (payload?.password && userData?.password) {
    const isMatch = await bcrypt.compare(payload.password, userData?.password);
    if (!isMatch) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Password");
    }
  }

  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpires as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.jwtRefreshTokenSecret as string,
    config.jwt.jwtRefreshTokenExpires as string,
  );

  return {
    accessToken,
    refreshToken,
    role: userData.role,
    id: userData.id,
  };
};

const refreshToken = async (refreshToken: string) => {
  const payload = verifyToken(refreshToken, config.jwt.jwtRefreshTokenSecret as Secret);
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: payload.id, email: payload.email, isDelete: false },
  });

  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
  }

  if (userData.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }

  const isVerified = await prisma.validation.findUnique({
    where: {
      userId: userData.id,
      isVerified: true,
    },
  });

  if (!isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is not verified");
  }

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpires as string,
  );

  return {
    accessToken,
    refreshToken,
    role: userData.role,
    id: userData.id,
  };
};

const changePassword = async (
  user: TTokenUser,
  payload: { email: string; oldPassword: string; newPassword: string },
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: payload.email, id: user.id },
  });
  if (!userData) {
    throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
  }
  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
  }
  if (userData.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }

  const isVerified = await prisma.validation.findUnique({
    where: {
      userId: userData.id,
      isVerified: true,
    },
  });

  if (!isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is not verified");
  }

  if (userData?.password) {
    const isMatch = await bcrypt.compare(payload.oldPassword, userData?.password);
    if (!isMatch) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Password");
    }
  }

  const newPassword = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));
  await prisma.user.update({
    where: {
      id: user.id,
      isDelete: false,
    },
    data: {
      password: newPassword,
    },
  });
  return null;
};

const forgetPasswordIntoDb = async (payload: {
  email?: string;
  phoneNumber?: string;
  type?: string;
}) => {
  if (!payload.email && !payload.phoneNumber) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Email or Phone number is required");
  }

  const userData = await prisma.user.findFirstOrThrow({
    where: {
      OR: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
      isDelete: false,
    },
  });
  if (!userData) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invalid Email");
  }
  if (userData.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  const currentTime = new Date();
  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id.toString() };
  // generate token
  const expiresAt = moment(currentTime).add(60, "minute");
  const token = createToken(
    jwtPayload,
    config.jwt.jwtVerifyAccountSecret as Secret,
    config.jwt.jwtVerifyAccountExpires as string,
  );

  //  find user and update validation
  await prisma.validation.update({
    where: {
      userId: userData.id,
    },
    data: {
      otp,
      isVerified: false,
      expiresAt: expiresAt.toISOString(),
    },
  });
  const parentMailTemplate = path.join(process.cwd(), "/src/template/email.html");
  const forgetOtpEmail = fs.readFileSync(parentMailTemplate, "utf-8");

  if (payload.type === "mobile") {
    if (!userData?.phoneNumber) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Phone number not found");
    }

    //const res = await sendSNSMessage({
    //  Message: `Your OTP from NOFIFY is: ${otp}`,
    //  PhoneNumber: userData.phoneNumber,
    //});
    const res = await sendMessage(userData.phoneNumber, `Your OTP from NOFIFY is: ${otp}`);
    console.log({ res });
  } else {
    const html = forgetOtpEmail
      .replace(/{{name}}/g, userData.email)
      .replace(/{{otp}}/g, otp.toString());
    sendMail({ to: userData.email, html, subject: "Forget Password Otp From United Threads" });
  }

  return {
    token,
  };
};

const resetPassword = async (
  token: string,
  payload: { password: string },
  token_type: string | null,
) => {
  const decode = verifyToken(
    token,
    token_type === "access_token"
      ? (config.jwt.jwtAccessTokenSecret as Secret)
      : (config.jwt.jwtVerifyAccountSecret as Secret),
  ) as TTokenUser;
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: decode.email, id: decode.id, isDelete: false },
  });

  if (userData.isDelete) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Deleted");
  }
  if (!userData.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is Blocked");
  }

  const isVerified = await prisma.validation.findUnique({
    where: {
      userId: userData.id,
      isVerified: true,
    },
  });

  if (!isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is not verified");
  }

  const newPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

  await prisma.user.update({
    where: {
      id: userData.id,
      isDelete: false,
    },
    data: {
      password: newPassword,
    },
  });

  const jwtPayload = { email: userData.email, role: userData.role, id: userData.id };
  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpires as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.jwtRefreshTokenSecret as string,
    config.jwt.jwtRefreshTokenExpires as string,
  );

  return {
    accessToken,
    refreshToken,
    role: userData.role,
    id: userData.id,
  };
};

const googleLogin = async (payload: any) => {
  const isUserHave = false;
  let jwtPayload;
  try {
    if (!isUserHave) {
      //const user = await User.create({
      //  name: payload?.name,
      //  email: payload?.email,
      //  image: payload?.picture,
      //  verification: {
      //    otp: "0",
      //    status: payload?.email_verified,
      //  },
      //  isGoogleLogin: true,
      //});
      //console.log("🚀  googleLogin  user:", user);
      //return;
      const user = {
        _id: "",
        role: "role",
      };
      jwtPayload = {
        id: user?._id?.toString() as string,
        role: user?.role,
      };
    } else {
      //if (!isUserHave) {
      //  throw new AppError(StatusCodes.NOT_FOUND, "User not found");
      //}
      //if (isUserHave?.isDeleted) {
      //  throw new AppError(StatusCodes.FORBIDDEN, "This user is deleted");
      //}
      //if (!isUserHave?.verification?.status) {
      //  throw new AppError(StatusCodes.FORBIDDEN, "User account is not verified");
      //}
      //jwtPayload = {
      //  id: isUserHave?._id?.toString() as string,
      //  role: isUserHave?.role,
      //  email: isUserHave?.email,
      //};
    }

    //const accessToken = createToken(
    //  jwtPayload,
    //  config.jwt.jwtAccessTokenSecret as Secret,
    //  config.jwt.jwtAccessTokenExpires as string,
    //);

    //const refreshToken = createToken(
    //  jwtPayload,
    //  config.jwt.jwtRefreshTokenSecret as Secret,
    //  config.jwt.jwtRefreshTokenExpires as string,
    //);

    return {
      //accessToken,
      refreshToken,
    };
  } catch (error: any) {
    console.log(error);
    throw new AppError(StatusCodes.BAD_REQUEST, error?.messages);
  }
};

export const AuthServices = {
  signUpIntoDb,
  googleCallback,
  signInIntoDb,
  refreshToken,
  forgetPasswordIntoDb,
  resetPassword,
  verifyAccount,
  resendOtp,
  changePassword,
  googleLogin,
};
