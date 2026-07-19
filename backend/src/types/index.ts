import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export enum UserRole {
  USER = 'USER',
  GARAGE_OWNER = 'GARAGE_OWNER',
  ADMIN = 'ADMIN'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  SEARCHING_GARAGE = 'SEARCHING_GARAGE',
  REQUEST_SENT = 'REQUEST_SENT',
  GARAGE_ACCEPTED = 'GARAGE_ACCEPTED',
  MECHANIC_ASSIGNED = 'MECHANIC_ASSIGNED',
  MECHANIC_ON_THE_WAY = 'MECHANIC_ON_THE_WAY',
  MECHANIC_ARRIVED = 'MECHANIC_ARRIVED',
  INSPECTION_STARTED = 'INSPECTION_STARTED',
  QUOTATION_SENT = 'QUOTATION_SENT',
  QUOTATION_APPROVED = 'QUOTATION_APPROVED',
  SERVICE_IN_PROGRESS = 'SERVICE_IN_PROGRESS',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  FINAL_PAYMENT_PENDING = 'FINAL_PAYMENT_PENDING',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentType {
  BOOKING_FEE = 'BOOKING_FEE',
  FINAL_SERVICE_PAYMENT = 'FINAL_SERVICE_PAYMENT',
  REFUND = 'REFUND'
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISED = 'REVISED',
  EXPIRED = 'EXPIRED'
}

export enum MechanicStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  ON_THE_WAY = 'ON_THE_WAY',
  WORKING = 'WORKING',
  OFFLINE = 'OFFLINE'
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export enum NotificationType {
  REQUEST_CREATED = 'REQUEST_CREATED',
  GARAGE_ACCEPTED = 'GARAGE_ACCEPTED',
  GARAGE_REJECTED = 'GARAGE_REJECTED',
  MECHANIC_ASSIGNED = 'MECHANIC_ASSIGNED',
  MECHANIC_ARRIVING = 'MECHANIC_ARRIVING',
  QUOTATION_RECEIVED = 'QUOTATION_RECEIVED',
  QUOTATION_APPROVED = 'QUOTATION_APPROVED',
  PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  COMPLAINT_UPDATED = 'COMPLAINT_UPDATED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED'
}

export enum VehicleType {
  BIKE = 'BIKE',
  SCOOTER = 'SCOOTER',
  CAR = 'CAR',
  SUV = 'SUV',
  VAN = 'VAN',
  OTHER = 'OTHER'
}

export enum IssueCategory {
  TYRE_PUNCTURE = 'TYRE_PUNCTURE',
  DEAD_BATTERY = 'DEAD_BATTERY',
  VEHICLE_NOT_STARTING = 'VEHICLE_NOT_STARTING',
  FUEL_SHORTAGE = 'FUEL_SHORTAGE',
  ENGINE_OVERHEATING = 'ENGINE_OVERHEATING',
  BRAKE_ISSUE = 'BRAKE_ISSUE',
  ELECTRICAL_ISSUE = 'ELECTRICAL_ISSUE',
  MINOR_MECHANICAL = 'MINOR_MECHANICAL',
  TOWING_REQUIRED = 'TOWING_REQUIRED',
  OTHER = 'OTHER'
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  googleId?: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGarage {
  _id: string;
  owner: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  serviceRadius: number;
  services: string[];
  openingTime: string;
  closingTime: string;
  weeklyOff?: string;
  is24x7: boolean;
  numberOfMechanics: number;
  supportedVehicleTypes: VehicleType[];
  images: Array<{
    url: string;
    publicId: string;
    type: string;
  }>;
  documents: Array<{
    url: string;
    publicId: string;
    type: string;
  }>;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

export interface TokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface LocationPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface StatusHistory {
  status: RequestStatus;
  updatedBy: string;
  updatedAt: Date;
  notes?: string;
}

export interface QuotationPart {
  name: string;
  quantity: number;
  price: number;
}
