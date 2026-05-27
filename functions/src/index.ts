import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

export { syncOperatorAuthStatus } from "./operator/syncAuthStatus";
export { approveOperatorSignup } from "./operator/approveSignup";
export { declineOperatorSignup } from "./operator/declineSignup";
export { sendSignupLinkEmail } from "./operator/sendSignupLink";
export { api } from "./booking/api.http";
export { completeInProgressBookings } from "./reviews/completeInProgressBookings";
export { onReviewStatusChanged } from "./reviews/onReviewStatusChanged";
export { onBookingCreatedNotifyOperator } from "./notifications/onBookingCreate";
export { onOperatorSignupRequestCreatedNotifyAdmins } from "./notifications/onOperatorSignupCreate";