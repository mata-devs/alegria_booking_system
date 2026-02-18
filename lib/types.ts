export type UserRole = 'super_admin' | 'operator' | 'customer';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
}
