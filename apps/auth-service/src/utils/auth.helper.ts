import crypto from "crypto";
import { NextFunction } from "express";
import { ValidationError } from "@packages/error-handler";
import redis from "@packages/libs/redis";
import { sendEmail } from "./sendMail";

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const validationRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;

  // Fixed: Corrected the condition logic
  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing required fields!");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format!");
  }
};

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
) => {
  // if failed multiple time for verifying otp, account gets locked
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "Account locked due to multiple failed attempts! Try again after 30 minutes"
      )
    );
  }

  // checks spam email and if found, otp sending gets locked for 1 hour
  // Fixed: Changed otp_spam_lock to include email
  if (await redis.get(`otp_spam_locked:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP requests! Please wait 1hour before requesting again."
      )
    );
  }

  // Fixed: Changed opt_cooldown to otp_cooldown
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError("Please wait 1minute before requesting a new OTP!")
    );
  }
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_locked:${email}`, "locked", "EX", 3600); //lock for 1hour
    return next(
      new ValidationError(
        "Too many OTP requests! Please wait 1hour before requesting again."
      )
    );
  }

  await redis.set(otpRequestKey, (otpRequests + 1).toString(), "EX", 3600);  //tracking req for 1hour lock system
};

export const sendOtp = async (
  email: string,
  name: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString();

  // send this otp into our redis db with the email for a particular time
  // we will be using redis db for this

  await sendEmail(email, "Verify Your Email", template, { name, otp });
  // Fixed: Changed opt to otp
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};
