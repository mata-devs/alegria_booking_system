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
