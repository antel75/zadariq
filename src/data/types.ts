export type CategoryId = 'pharmacy' | 'doctor' | 'shops' | 'restaurants' | 'cafes' | 'parking' | 'transport' | 'emergency' | 'events' | 'publicServices';

export type VerificationStatus = 'owner' | 'community' | 'unverified' | 'possibly_incorrect';

export type OccupancyLevel = 'quiet' | 'normal' | 'busy';

export interface WorkingHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface BusinessAnalytics {
  viewsToday: number;
  callsClicked: number;
  navigationClicks: number;
}

export interface Business {
  id: string;
  name: string;
  category: CategoryId;
  address: string;
  phone: string;
  website?: string;
  workingHours: WorkingHours;
  verified: boolean;
  lastVerified: string;
  reportCount: number;
  lat?: number;
  lng?: number;
  // Trust layer fields
  verificationStatus: VerificationStatus;
  ownerVerifiedAt?: string;
  communityConfirmedAt?: string;
  lastAutoChecked?: string;
  trustScore: number; // 0-100
  // Business-side fields
  occupancy?: OccupancyLevel;
  waitTime?: string;
  dailyOffer?: string;
  announcement?: string;
  nextAppointment?: string;
  analytics?: BusinessAnalytics;
  featured?: boolean;
}

export interface EmergencyContact {
  id: string;
  nameKey: string;
  number: string;
  description?: string;
}

export interface Report {
  businessId: string;
  type: 'closed' | 'moved' | 'wrongHours' | 'phoneIncorrect';
  timestamp: string;
}
