import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'operator' | 'customer';

export type UserStatus = 'active' | 'suspended';

/** Firestore `users/{uid}` operator/admin fields (subset). */
export interface FirestoreUser {
  role: 'super_admin' | 'operator';
  hasDOTQualitySeal: boolean;
  dotProofUrl: string | null;
  dotSealGrantedAt: Timestamp | null;
  dotSealGrantedByUid: string | null;
  customInclusionChips: string[];
  customExclusionChips: string[];
}

export interface UserProfile {
    uid: string;
    email: string | null;
    role: UserRole;
    firstName: string;
    lastName: string;
    status: UserStatus;
    createdAt: Date | null;
    hasDOTQualitySeal?: boolean;
    customInclusionChips?: string[];
    customExclusionChips?: string[];
}

export interface OperatorProfile extends UserProfile {
    operatorId: string;
    companyName: string;
    phoneNumber: string;
    mobileNumber: string;
    address: string;
    lat: number | null;
    lng: number | null;
    profileImage: string | null;
    applicationApproveDate: Date | null;
    files: OperatorFile[];
    hasDOTQualitySeal?: boolean;
    dotProofUrl?: string | null;
}

export interface OperatorFile {
    name: string;
    /** Legacy signup submissions; admin resolves via `path` when present. */
    url?: string;
    /** Firebase Storage object path (signup-requests/…). */
    path?: string;
}

export type SignUpRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OperatorSignUpRequest {
    id: string;
    applicantId: string;
    name: string;
    companyName: string;
    email: string;
    phoneNumber: string;
    mobileNumber: string;
    address: string;
    lat: number | null;
    lng: number | null;
    photoUrl: string | null;
    /** Storage path for profile photo when `photoUrl` is not stored. */
    photoPath?: string | null;
    documents: OperatorFile[];
    status: SignUpRequestStatus;
    submittedAt: Date | null;
    reviewedAt: Date | null;
}
