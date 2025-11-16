import { Request, Response, NextFunction } from 'express';
import { User, LoyaltyPointsHistory } from '../models';
import { AppError } from '../utils/appError';
import { Parser } from 'json2csv';

export const adjustUserLoyalty = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const { points, loyaltyTier } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (typeof points === 'number') user.points = points;
    if (loyaltyTier) user.loyaltyTier = loyaltyTier;
    await user.save();
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const getLoyaltyAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Example: total users, total points, tier breakdown
    const totalUsers = await User.countDocuments();
    const totalPoints = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$points' } } },
    ]);
    const tierBreakdown = await User.aggregate([
      { $group: { _id: '$loyaltyTier', count: { $sum: 1 } } },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalPoints: totalPoints[0]?.total || 0,
        tierBreakdown,
      },
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const exportLoyaltyData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const history = await LoyaltyPointsHistory.find().populate('user', 'email name');
    const fields = ['user.email', 'user.name', 'points', 'type', 'description', 'balance', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(history);
    res.header('Content-Type', 'text/csv');
    res.attachment('loyalty_points_history.csv');
    return res.send(csv);
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const schedulePromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // This is a stub. In a real app, you'd save the promo and trigger notifications.
    const { title, message, pointsBonus, startDate, endDate } = req.body;
    // Save promo to DB, send notifications, etc.
    res.status(201).json({
      status: 'success',
      data: { title, message, pointsBonus, startDate, endDate },
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};