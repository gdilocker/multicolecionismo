// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLogin?: string;
  // Contact Info for WHOIS
  contactInfo: ContactInfo;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  organization?: string;
}

// Domain Management Types
export interface Domain {
  id: string;
  name: string;
  userId: string;
  status: 'active' | 'pending' | 'expired' | 'suspended' | 'transferred';
  registeredAt: string;
  expiresAt: string;
  autoRenew: boolean;
  whoisPrivacy: boolean;
  nameservers: string[];
  dnsRecords: DNSRecord[];
  registrarInfo: RegistrarInfo;
  createdAt: string;
  updatedAt: string;
  // Domain type and transfer flags
  domain_type?: string;
  is_transferable?: boolean;
}

export interface DomainLicenseHistory {
  id: string;
  domain_id: string;
  previous_status?: string;
  new_status: string;
  previous_type?: string;
  new_type?: string;
  changed_by?: string;
  change_reason?: string;
  changed_at: string;
  metadata?: Record<string, any>;
}

export interface LicenseActionPayload {
  domain_id: string;
  reason: string;
  admin_user_id: string;
}

export interface DNSRecord {
  id: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrarInfo {
  registrar: string;
  registrarUrl: string;
  whoisServer: string;
  referralUrl?: string;
  status: string[];
}

// Order and Payment Types
export interface Order {
  id: string;
  userId: string;
  domain: string;
  type: 'registration' | 'renewal' | 'transfer';
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider: 'paypal' | 'stripe';
  providerOrderId: string;
  providerCaptureId?: string;
  amount: number;
  currency: string;
  years: number;
  whoisPrivacy: boolean;
  autoRenew: boolean;
  logs: OrderLog[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface OrderLog {
  id: string;
  timestamp: string;
  event: string;
  status: 'success' | 'error' | 'info' | 'warning';
  message: string;
  details?: any;
  userId?: string;
  ipAddress?: string;
}

// Transfer Types
export interface TransferRequest {
  id: string;
  userId: string;
  domain: string;
  authCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  logs: TransferLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TransferLog {
  id: string;
  timestamp: string;
  event: string;
  status: 'success' | 'error' | 'info' | 'warning';
  message: string;
  details?: any;
  adminUserId?: string;
}

// System Log Types
export interface SystemLog {
  id: string;
  userId?: string;
  adminUserId?: string;
  action: string;
  resource: 'user' | 'domain' | 'order' | 'transfer' | 'dns' | 'system';
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDomains: number;
  activeDomains: number;
  expiringDomains: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingTransfers: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  phoneCountryPrefix: string;
  acceptTerms: boolean;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: number;
  premium?: boolean;
  suggestions?: string[];
}

export interface DNSRecordForm {
  type: DNSRecord['type'];
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface TransferForm {
  domain: string;
  authCode: string;
  contactInfo: ContactInfo;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}