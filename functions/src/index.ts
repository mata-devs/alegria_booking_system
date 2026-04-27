import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

export { syncOperatorAuthStatus } from "./operator/syncAuthStatus";
export { approveOperatorSignup } from "./operator/approveSignup";
export { declineOperatorSignup } from "./operator/declineSignup";
export { sendSignupLinkEmail } from "./operator/sendSignupLink";
export { api } from "./booking/api.http";