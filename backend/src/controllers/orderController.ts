import { Request, Response, NextFunction } from 'express';
import { Order, User, LoyaltyPointsHistory, IUser, Notification, Service } from '../models';
import { AppError } from '../utils/appError';

export const placeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Use authenticated user
    const authUser = req.user as IUser | undefined;
    if (!authUser?._id) {
      throw new AppError('Unauthorized', 401);
    }

    const {
      items,
      pointsRedeemed,
      paymentMethod,
      pickupAddress,
      deliveryAddress,
      scheduledPickup,
      scheduledDelivery
    } = req.body;

    // Basic validations
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }
    if (!deliveryAddress) {
      throw new AppError('Delivery address is required', 400);
    }

    // Validate items and compute totals
    let totalAmount = 0;
    const normalizedItems = [] as Array<{ service: any; quantity: number; price: number }>;

    for (const it of items) {
      if (!it?.service) throw new AppError('Item service is required', 400);
      const qty = Number(it.quantity ?? 1);
      if (!Number.isFinite(qty) || qty < 1) throw new AppError('Item quantity must be at least 1', 400);

      const svc = await Service.findById(it.service);
      if (!svc) throw new AppError('Service not found', 404);

      const unitPrice = svc.price;
      totalAmount += unitPrice * qty;
      normalizedItems.push({ service: svc._id, quantity: qty, price: unitPrice });
    }

    // Fetch user fresh (for points updates)
    const foundUser = await User.findById(authUser._id) as IUser | null;
    if (!foundUser) throw new AppError('User not found', 404);

    const method = (paymentMethod as string) || 'CASH';

    // Calculate points earned (1 point per $10 spent)
    const pointsEarned = Math.floor(totalAmount / 10);
    let newPoints = foundUser.points + pointsEarned - (pointsRedeemed || 0);
    if (newPoints < 0) newPoints = 0;

    // Create order
    const order = await Order.create({
      user: foundUser._id,
      items: normalizedItems,
      totalAmount,
      pointsEarned,
      pointsRedeemed: pointsRedeemed || 0,
      paymentMethod: method as any,
      paymentStatus: method === 'POINTS' ? 'PAID' : 'PENDING',
      pickupAddress,
      deliveryAddress,
      scheduledPickup,
      scheduledDelivery,
    });

    // Update user points and tier
    foundUser.points = newPoints;
    (foundUser as IUser).updateLoyaltyTier();
    await foundUser.save();

    // Add loyalty points history (earned)
    if (pointsEarned > 0) {
      await LoyaltyPointsHistory.create({
        user: foundUser._id,
        order: order._id,
        points: pointsEarned,
        type: 'EARNED',
        description: 'Points earned from order',
        balance: foundUser.points,
      });
      // Create notification for points earned
      await Notification.create({
        user: foundUser._id,
        type: 'POINTS_EARNED',
        message: `You earned ${pointsEarned} points from your order. Order ID: ${order._id}`,
      });
    }
    // Add loyalty points history (redeemed)
    if (pointsRedeemed && pointsRedeemed > 0) {
      await LoyaltyPointsHistory.create({
        user: foundUser._id,
        order: order._id,
        points: -pointsRedeemed,
        type: 'REDEEMED',
        description: 'Points redeemed for order',
        balance: foundUser.points,
      });
    }

    // Create notification for order placed
    await Notification.create({
      user: foundUser._id,
      type: 'ORDER_STATUS',
      message: `Your order has been placed successfully. Order ID: ${order._id}`,
    });

    // Simulate order completion after 5 seconds (non-blocking)
    setTimeout(async () => {
      try {
        order.status = 'COMPLETED';
        await order.save();
        await Notification.create({
          user: foundUser._id,
          type: 'ORDER_STATUS',
          message: `Your order has been completed. Order ID: ${order._id}`,
        });
      } catch {}
    }, 5000);

    // Response shape expected by tests
    res.status(201).json(order);
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: { orders },
    });
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as IUser;
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('items.service');

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as IUser;
    const order = await Order.findOne({
      _id: req.params.id,
      user: user._id
    }).populate('items.service');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};