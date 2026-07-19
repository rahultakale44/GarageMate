import { z } from 'zod';

export const createQuotationSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  inspectionNotes: z.string().min(10, 'Please provide inspection notes'),
  labourCharge: z.number().min(0, 'Labour charge must be positive'),
  visitingCharge: z.number().min(0, 'Visiting charge must be positive'),
  parts: z.array(
    z.object({
      name: z.string().min(1, 'Part name is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      price: z.number().min(0, 'Price must be positive'),
    })
  ).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  estimatedRepairTime: z.string().min(1, 'Estimated repair time is required'),
  terms: z.string().optional(),
  validUntil: z.string().optional(),
});

export const approveQuotationSchema = z.object({
  quotationId: z.string().min(1, 'Quotation ID is required'),
});

export const rejectQuotationSchema = z.object({
  quotationId: z.string().min(1, 'Quotation ID is required'),
  reason: z.string().min(10, 'Please provide a reason for rejection'),
});
