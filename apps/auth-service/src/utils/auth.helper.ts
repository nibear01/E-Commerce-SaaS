import crypto from "crypto";
import { NextFunction } from "express";
import { ValidationError } from "../../../../packages/error-handler";
import redis from "../../../../packages/libs/redis";

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const validationRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password(userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing required fields!");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format!");
  }
};

export const checkOtpRestrictions = (email: String, next: NextFunction) => {};

export const sendOtp = async (
  name: String,
  email: String,
  template: String
) => {
  const otp = crypto.randomInt(1000, 9999).toString();

  // send this otp into our redis db with the email for a particular time
  // we will be using redis db for this

  await sendEmail();

  await redis.set(`opt:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};
