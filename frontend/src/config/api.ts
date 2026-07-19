export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    USER_REGISTER: '/auth/user/register',
    USER_LOGIN: '/auth/login',
    GARAGE_REGISTER: '/auth/garage/register',
    GARAGE_LOGIN: '/auth/login',
    ADMIN_LOGIN: '/auth/login',
    GOOGLE_AUTH: '/auth/google',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/password',
  },
  
  // Vehicles
  VEHICLES: {
    LIST: '/vehicles',
    CREATE: '/vehicles',
    GET: (id: string) => `/vehicles/${id}`,
    UPDATE: (id: string) => `/vehicles/${id}`,
    DELETE: (id: string) => `/vehicles/${id}`,
  },
  
  // Garages
  GARAGES: {
    NEARBY: '/garages/nearby',
    REVERSE_GEOCODE: '/garages/reverse-geocode',
    GEOCODE: '/garages/geocode',
    LIST: '/garages',
    GET: (id: string) => `/garages/${id}`,
    MY: '/garages/my/profile',
    UPDATE: '/garages/my/profile',
    TOGGLE_AVAILABILITY: '/garages/my/availability',
    ADD_IMAGES: '/garages/my/images',
  },
  
  // Mechanics
  MECHANICS: {
    LIST: '/mechanics',
    CREATE: '/mechanics',
    GET: (id: string) => `/mechanics/${id}`,
    UPDATE: (id: string) => `/mechanics/${id}`,
    DELETE: (id: string) => `/mechanics/${id}`,
    UPDATE_LOCATION: (id: string) => `/mechanics/${id}/location`,
  },
  
  // Requests
  REQUESTS: {
    CREATE: '/requests',
    MY: '/requests/my',
    GARAGE: '/requests/garage',
    GET: (id: string) => `/requests/${id}`,
    ACCEPT: (id: string) => `/requests/${id}/accept`,
    REJECT: (id: string) => `/requests/${id}/reject`,
    ASSIGN_MECHANIC: (id: string) => `/requests/${id}/assign-mechanic`,
    UPDATE_STATUS: (id: string) => `/requests/${id}/status`,
    GENERATE_OTP: (id: string) => `/requests/${id}/generate-otp`,
    VERIFY_OTP: (id: string) => `/requests/${id}/verify-otp`,
    CANCEL: (id: string) => `/requests/${id}/cancel`,
  },
  
  // Quotations
  QUOTATIONS: {
    CREATE: '/quotations',
    GET: (id: string) => `/quotations/${id}`,
    BY_REQUEST: (requestId: string) => `/quotations/request/${requestId}`,
    SEND: (id: string) => `/quotations/${id}/send`,
    APPROVE: (id: string) => `/quotations/${id}/approve`,
    REJECT: (id: string) => `/quotations/${id}/reject`,
    UPDATE: (id: string) => `/quotations/${id}`,
  },
  
  // Payments
  PAYMENTS: {
    CREATE_BOOKING_ORDER: '/payments/create-booking-order',
    CREATE_FINAL_ORDER: '/payments/create-final-order',
    VERIFY: '/payments/verify',
    MY: '/payments/my',
    GARAGE: '/payments/garage',
    GET: (id: string) => `/payments/${id}`,
  },
  
  // Reviews
  REVIEWS: {
    CREATE: '/reviews',
    MY: '/reviews/my',
    GARAGE: (garageId: string) => `/reviews/garage/${garageId}`,
    RESPOND: (id: string) => `/reviews/${id}/respond`,
    DELETE: (id: string) => `/reviews/${id}`,
  },
  
  // Complaints
  COMPLAINTS: {
    CREATE: '/complaints',
    MY: '/complaints/my',
    GET: (id: string) => `/complaints/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    GARAGE_OWNERS: '/admin/garage-owners',
    VERIFICATIONS: '/admin/verifications',
    GARAGE_DETAILS: (id: string) => `/admin/garages/${id}`,
    APPROVE_GARAGE: (id: string) => `/admin/garages/${id}/approve`,
    REJECT_GARAGE: (id: string) => `/admin/garages/${id}/reject`,
    REQUEST_CHANGES: (id: string) => `/admin/garages/${id}/request-changes`,
    SUSPEND_GARAGE: (id: string) => `/admin/garages/${id}/suspend`,
    REACTIVATE_GARAGE: (id: string) => `/admin/garages/${id}/reactivate`,
    BLOCK_USER: (id: string) => `/admin/users/${id}/block`,
    REQUESTS: '/admin/requests',
    PAYMENTS: '/admin/payments',
    COMPLAINTS: '/admin/complaints',
    RESOLVE_COMPLAINT: (id: string) => `/admin/complaints/${id}/resolve`,
    HIDE_REVIEW: (id: string) => `/admin/reviews/${id}/hide`,
  },
};
