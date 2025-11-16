import { Request, Response } from 'express';
import { Service } from '../models/Service';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const services = await Service.find();
  res.status(200).json({
    success: true,
    data: services
  });
});

export const getService = catchAsync(async (req: Request, res: Response) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  res.status(200).json({
    success: true,
    data: service
  });
});

export const createService = catchAsync(async (req: Request, res: Response) => {
  const service = await Service.create(req.body);
  res.status(201).json({
    success: true,
    data: service
  });
});

export const updateService = catchAsync(async (req: Request, res: Response) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  res.status(200).json({
    success: true,
    data: service
  });
});

export const deleteService = catchAsync(async (req: Request, res: Response) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  res.status(200).json({
    success: true,
    data: null
  });
});