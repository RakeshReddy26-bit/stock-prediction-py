import { Request, Response, NextFunction } from 'express';
import { User, LoyaltyPointsHistory } from '../models';
import { AppError } from '../utils/appError';

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    // Get loyalty points history
    const history = await LoyaltyPointsHistory.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: {
        user,
        history,
      },
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};