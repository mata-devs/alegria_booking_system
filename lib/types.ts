export type UserRole = 'super_admin' | 'operator' | 'customer';

export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  status: UserStatus;
  createdAt: Date | null;
}

export interface OperatorProfile extends UserProfile {
  operatorId: string;
  phoneNumber: string;
  mobileNumber: string;
  profileImage: string | null;
  applicationApproveDate: Date | null;
  files: OperatorFile[];
}

export interface OperatorFile {
  name: string;
  url: string;
}

export type SignUpRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OperatorSignUpRequest {
  id: string;
  applicantId: string;
  name: string;
  email: string;
  phoneNumber: string;
  mobileNumber: string;
  address: string;
  photoUrl: string | null;
  documents: OperatorFile[];
  status: SignUpRequestStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
}

export type BookingStatus = 'reserved' | 'paid' | 'processing' | 'cancelled';

export type PaymentMethod = 'cash' | 'gcash' | 'card';

export interface BookingGuest {
  name: string;
  age: string;
  gender: string;
}

export interface Booking {
  id: string;
  bookingId: string;
  operatorId: string;
  representativeName: string;
  representativeAge: string;
  representativeGender: string;
  representativeEmail: string;
  representativePhone: string;
  guests: BookingGuest[];
  schedule: string;
  scheduleTime: string;
  numberOfGuests: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  specialRequests: string;
  promoCode: string;
  maxCapacity: number;
  currentCapacity: number;
  requestDate: Date | null;
  createdAt: Date | null;
}
