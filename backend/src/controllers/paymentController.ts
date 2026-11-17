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
    // Determine if this is a direct garage request or broadcast
    if (request.garageId) {
      // Direct garage request
      request.status = RequestStatus.GARAGE_SELECTED;
      request.statusHistory.push({
        status: RequestStatus.GARAGE_SELECTED,
        updatedBy: req.user!.userId as any,
        updatedAt: new Date(),
        notes: 'Booking fee paid - Direct garage request',
      });
      await request.save();

      // Notify selected garage
      const garage = await Garage.findById(request.garageId).populate('owner');
      if (garage && garage.owner) {
        await createNotification({
          recipient: (garage.owner as any)._id || garage.owner,
          recipientRole: UserRole.GARAGE_OWNER,
          title: 'New Request Received',
          message: `You have received a new assistance request`,
          type: NotificationType.REQUEST_CREATED,
          redirectUrl: `/garage/requests/${request._id}`,
        });
      }
    } else {
      // Broadcast request - find eligible garages
      request.status = RequestStatus.BROADCASTED;
      request.statusHistory.push({
        status: RequestStatus.BROADCASTED,
        updatedBy: req.user!.userId as any,
        updatedAt: new Date(),
        notes: 'Booking fee paid - Broadcasting to eligible garages',
      });
      await request.save();

      // Find eligible garages near the request location
      const eligibleGarages = await Garage.find({
        verificationStatus: 'APPROVED',
        isAvailable: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: request.location.coordinates,
            },
            $maxDistance: 20000, // 20km max
          },
        },
      }).limit(10);

      // Notify eligible garages
      for (const garage of eligibleGarages) {
        await createNotification({
          recipient: garage.owner,
          recipientRole: UserRole.GARAGE_OWNER,
          title: 'New Broadcast Request',
          message: `A customer needs assistance nearby. Submit your offer!`,
          type: NotificationType.REQUEST_BROADCASTED,
          redirectUrl: `/garage/requests/${request._id}`,
        });
      }
    }
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
export const getGaragePayments = asyncHandler(async (req: AuthRequest, res: Response) => {  const garage = await Garage.findOne({ owner: req.user!.userId });
  
  if (!garage) {
    throw new ApiError(404, 'Garage not found');
  }

  const payments = await Payment.find({
    garageId: garage._id,
    status: { $in: [PaymentStatus.SUCCESS, PaymentStatus.DEMO_PAID] },
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

// ─────────────────────────────────────────────────────────────────────────────
// DEMO PAYMENT — creates + immediately verifies a simulated ₹99 booking
// Only available in development. Backend independently enforces this.
// ─────────────────────────────────────────────────────────────────────────────
export const createDemoBookingOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    throw new ApiError(403, 'Demo payments are only available in development mode');
  }

  const { requestId } = req.body;

  const request = await AssistanceRequest.findOne({
    _id: requestId,
    userId: req.user!.userId,
  });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.status !== RequestStatus.PAYMENT_PENDING && request.status !== RequestStatus.DRAFT) {
    throw new ApiError(400, 'Payment already completed or request invalid');
  }

  // Prevent duplicate demo payments
  const existingPayment = await Payment.findOne({
    requestId,
    status: { $in: [PaymentStatus.SUCCESS, PaymentStatus.DEMO_PAID, PaymentStatus.PENDING] },
  });

  if (existingPayment) {
    throw new ApiError(400, 'Payment already exists for this request');
  }

  // Set to PAYMENT_PENDING if still in DRAFT
  if (request.status === RequestStatus.DRAFT) {
    request.status = RequestStatus.PAYMENT_PENDING;
    request.statusHistory.push({
      status: RequestStatus.PAYMENT_PENDING,
      updatedBy: req.user!.userId as any,
      updatedAt: new Date(),
      notes: 'Demo payment initiated',
    });
    await request.save();
  }

  const demoOrderId = `demo_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const payment = await Payment.create({
    userId: req.user!.userId,
    requestId,
    garageId: request.garageId,
    type: PaymentType.DEMO_BOOKING_FEE,
    amount: request.bookingFee,
    razorpayOrderId: demoOrderId,
    status: PaymentStatus.CREATED,
    metadata: { isDemoPayment: true, demoOrderId },
  });

  res.json({
    success: true,
    data: {
      orderId: demoOrderId,
      amount: request.bookingFee * 100,
      currency: 'INR',
      paymentId: payment._id,
      isDemoMode: true,
    },
  });
});

export const confirmDemoPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    throw new ApiError(403, 'Demo payments are only available in development mode');
  }

  const { paymentDbId } = req.body;

  const payment = await Payment.findOne({
    _id: paymentDbId,
    userId: req.user!.userId,
    type: PaymentType.DEMO_BOOKING_FEE,
  });

  if (!payment) {
    throw new ApiError(404, 'Demo payment not found');
  }

  if (payment.status === PaymentStatus.DEMO_PAID) {
    throw new ApiError(400, 'Demo payment already confirmed');
  }

  if (!payment.metadata?.isDemoPayment) {
    throw new ApiError(400, 'Not a valid demo payment');
  }

  payment.status = PaymentStatus.DEMO_PAID;
  payment.razorpayPaymentId = `demo_pay_${Date.now()}`;
  await payment.save();

  const request = await AssistanceRequest.findById(payment.requestId);
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.garageId) {
    // Direct garage assignment
    request.status = RequestStatus.GARAGE_SELECTED;
    request.statusHistory.push({
      status: RequestStatus.GARAGE_SELECTED,
      updatedBy: req.user!.userId as any,
      updatedAt: new Date(),
      notes: 'Demo booking fee confirmed — direct garage request',
    });
    await request.save();

    // Notify selected garage owner
    const garage = await Garage.findById(request.garageId).populate('owner');
    if (garage && garage.owner) {
      await createNotification({
        recipient: (garage.owner as any)._id || garage.owner,
        recipientRole: UserRole.GARAGE_OWNER,
        title: '🔔 New Assistance Request',
        message: `New demo booking received — ${request.issueCategory.replace(/_/g, ' ')}`,
        type: NotificationType.REQUEST_CREATED,
        redirectUrl: `/garage/requests/${request._id}`,
      });

      // Emit real-time socket event
      const { emitToUser } = await import('../sockets');
      emitToUser(String((garage.owner as any)._id || garage.owner), 'request:new', {
        requestId: request._id,
        issueCategory: request.issueCategory,
        address: request.address,
      });
    }
  } else {
    // Broadcast
    request.status = RequestStatus.BROADCASTED;
    request.statusHistory.push({
      status: RequestStatus.BROADCASTED,
      updatedBy: req.user!.userId as any,
      updatedAt: new Date(),
      notes: 'Demo booking fee confirmed — broadcasting',
    });
    await request.save();
  }

  // Notify user of payment success
  const { emitToUser } = await import('../sockets');
  emitToUser(req.user!.userId, 'payment:success', {
    requestId: request._id,
    amount: payment.amount,
    isDemoPayment: true,
  });

  res.json({
    success: true,
    message: 'Demo payment confirmed. Booking created successfully.',
    data: {
      payment,
      request: await AssistanceRequest.findById(request._id)
        .populate('garageId', 'name phone address')
        .populate('vehicleId'),
    },
  });
});
