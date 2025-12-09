import { NextFunction, Response, Request } from "express";
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validationRegistrationData,
} from "../utils/auth.helper";
import prisma from "../../../../packages/libs/prisma";
import { ValidationError } from "../../../../packages/error-handler";

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validationRegistrationData(req.body, "user");
    const { name, email } = req.body;

    const existingUser = await prisma.users.findUnique({ where: email });

    if (existingUser) {
      return next(new ValidationError("User already exist with this email!"));
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(email, name, "user-activation-mail");

    res.status(200).json({
      message: "OTP sent to email. Please verify your account",
    });
  } catch (error) {
    return next(error);
  }
};
