import { Response } from 'express';
import { AuthRequest, PaymentStatus, PaymentType, RequestStatus, NotificationType, UserRole } from '../types';
import { Payment } from '../models/Payment';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { Quotation } from '../models/Quotation';
import { Garage } from '../models/Garage';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { getRazorpayInstance } from '../config/razorpay';
import { verifyRazorpaySignature } from '../utils/helpers';
import { createNotification } from '../services/notificationService';

// Create Payment Order (Booking Fee)
export const createBookingPaymentOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.body;

  const request = await AssistanceRequest.findOne({
    _id: requestId,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.status !== RequestStatus.PAYMENT_PENDING) {
    throw new ApiError(400, 'Payment already completed or request cancelled');
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({
    requestId,
    type: PaymentType.BOOKING_FEE,
    status: { $in: [PaymentStatus.SUCCESS, PaymentStatus.PENDING] },
  });

  if (existingPayment) {
    throw new ApiError(400, 'Payment already exists for this request');
  }

  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: request.bookingFee * 100, // Convert to paise
    currency: 'INR',
    receipt: `booking_${requestId}_${Date.now()}`,
  });

  const payment = await Payment.create({
    userId: req.user!.userId,
    requestId,
    type: PaymentType.BOOKING_FEE,
    amount: request.bookingFee,
    razorpayOrderId: order.id,
    status: PaymentStatus.CREATED,
  });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    },
  });
});

// Create Final Payment Order
export const createFinalPaymentOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.body;

  const request = await AssistanceRequest.findOne({
    _id: requestId,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.status !== RequestStatus.SERVICE_COMPLETED) {
    throw new ApiError(400, 'Service must be completed before payment');
  }

  const quotation = await Quotation.findOne({
    requestId,
    status: 'APPROVED',
  });

  if (!quotation) {
    throw new ApiError(404, 'Approved quotation not found');
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({
    requestId,
    type: PaymentType.FINAL_SERVICE_PAYMENT,
    status: { $in: [PaymentStatus.SUCCESS, PaymentStatus.PENDING] },
  });

  if (existingPayment) {
    throw new ApiError(400, 'Payment already exists for this request');
  }

  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: quotation.totalAmount * 100, // Convert to paise
    currency: 'INR',
    receipt: `final_${requestId}_${Date.now()}`,
  });

  const payment = await Payment.create({
    userId: req.user!.userId,
    requestId,
    garageId: request.garageId,
    quotationId: quotation._id,
    type: PaymentType.FINAL_SERVICE_PAYMENT,
    amount: quotation.totalAmount,
    razorpayOrderId: order.id,
    status: PaymentStatus.CREATED,
  });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    },
  });
});

// Verify Payment
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, paymentId, signature, paymentDbId } = req.body;

  if (!orderId || !paymentId || !signature || !paymentDbId) {
    throw new ApiError(400, 'Missing payment verification details');
  }

  // Verify signature
  const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

  if (!isValid) {
    throw new ApiError(400, 'Invalid payment signature');
  }

  const payment = await Payment.findOne({
    _id: paymentDbId,
    userId: req.user!.userId,
  });

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (payment.status === PaymentStatus.SUCCESS) {
    throw new ApiError(400, 'Payment already verified');
  }

  payment.razorpayPaymentId = paymentId;
  payment.razorpaySignature = signature;
  payment.status = PaymentStatus.SUCCESS;
  await payment.save();

  // Update request status based on payment type
  const request = await AssistanceRequest.findById(payment.requestId);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (payment.type === PaymentType.BOOKING_FEE) {
    request.status = RequestStatus.SEARCHING_GARAGE;
    request.statusHistory.push({
      status: RequestStatus.SEARCHING_GARAGE,
      updatedBy: req.user!.userId as any,
      updatedAt: new Date(),
      notes: 'Booking fee paid',
    });
    await request.save();

    // TODO: Notify nearby garages via Socket.IO
  } else if (payment.type === PaymentType.FINAL_SERVICE_PAYMENT) {
    request.status = RequestStatus.PAID;
    request.statusHistory.push({
      status: RequestStatus.PAID,
      updatedBy: req.user!.userId as any,
      updatedAt: new Date(),
      notes: 'Final payment completed',
    });
    await request.save();

    // Notify garage
    if (request.garageId) {
      const garage = await Garage.findById(request.garageId);
      if (garage) {
        await createNotification({
          recipient: garage.owner,
          recipientRole: UserRole.GARAGE_OWNER,
          title: 'Payment Received',
          message: `Payment of ₹${payment.amount} received for request`,
          type: NotificationType.PAYMENT_SUCCESSFUL,
          redirectUrl: `/garage/requests/${request._id}`,
        });
      }
    }
  }

  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: payment,
  });
});

// Get My Payments
export const getMyPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payments = await Payment.find({ userId: req.user!.userId })
    .populate('requestId', 'issueCategory address createdAt')
    .populate('garageId', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: payments,
  });
});

// Get Single Payment
export const getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await Payment.findById(req.params.id)
    .populate('requestId')
    .populate('garageId')
    .populate('quotationId');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  // Authorization
  const isUser = payment.userId.toString() === req.user!.userId;
  const garage = payment.garageId && (await Garage.findOne({ _id: payment.garageId, owner: req.user!.userId }));
  const isGarageOwner = !!garage;
  const isAdmin = req.user!.role === UserRole.ADMIN;

  if (!isUser && !isGarageOwner && !isAdmin) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: payment,
  });
});

// Razorpay Webhook Handler
export const handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    throw new ApiError(400, 'Missing signature');
  }

  // Verify webhook signature
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const event = req.body.event;
  const paymentEntity = req.body.payload.payment.entity;

  if (event === 'payment.captured') {
    // Update payment status
    await Payment.findOneAndUpdate(
      { razorpayPaymentId: paymentEntity.id },
      { status: PaymentStatus.SUCCESS }
    );
  } else if (event === 'payment.failed') {
    await Payment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      {
        status: PaymentStatus.FAILED,
        failureReason: paymentEntity.error_description,
      }
    );
  }

  res.json({ success: true });
});

// Get Garage Payments (for garage owners)
export const getGaragePayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const payments = await Payment.find({
    garageId: garage._id,
    status: PaymentStatus.SUCCESS,
  })
    .populate('userId', 'name')
    .populate('requestId', 'issueCategory address')
    .sort({ createdAt: -1 });

  const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

  res.json({
    success: true,
    data: {
      payments,
      totalEarnings,
    },
  });
});
