import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Notification, IUser } from '../models';
import { AppError } from '../utils/appError';
import { Types } from 'mongoose';
import crypto from 'crypto';
import mongoose from 'mongoose';

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email }) as IUser | null;
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    // If referral code provided, find the referrer
    let referredBy = undefined;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode }) as IUser | null;
      if (referrer) {
        referredBy = referrer._id;
        // Create notification for referrer
        await Notification.create({
          user: referrer._id,
          message: `You referred ${name} to ReWash!`,
          type: 'POINTS_EARNED',
          data: { referredUser: name }
        });
      }
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      referredBy,
    }) as IUser;

    // Generate JWT token
    const token = signToken((newUser._id as Types.ObjectId).toString());

    // Remove password from output
    const userObj = newUser.toObject() as IUser;
    (userObj as any).password = undefined;

    res.status(201).json({
      success: true,
      token,
      data: {
        user: userObj,
      },
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password') as IUser | null;
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Generate JWT token
    const token = signToken((user._id as Types.ObjectId).toString());

    // Remove password from output
    const userObj = user.toObject() as IUser;
    (userObj as any).password = undefined;

    res.status(200).json({
      success: true,
      token,
      data: {
        user: userObj,
      },
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('No user found with that email address', 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    (user as any).resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    (user as any).resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // In a real application, you would send an email with the reset token
    // For now, we'll just return it in the response
    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email',
      resetToken // Remove this in production
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }) as IUser | null;
    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }
    (user as any).password = password;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};