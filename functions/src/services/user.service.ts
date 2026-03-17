import { db, auth } from "../firebase";
import * as admin from "firebase-admin";
import { hashPassword } from "../utils/hash";

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "customer" | "tour_operator" | "admin";
  [key: string]: any;
}

export async function registerUser(input: RegisterInput) {
  const { email, password, firstName, lastName, role = "customer", ...rest } = input;

  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${firstName} ${lastName}`,
  });

  const userData = {
    email,
    password: hashPassword(password),
    role,
    firstName,
    lastName,
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    totalBookings: 0,
    lastBookingDate: null,
    operatorID: role === "tour_operator" ? (rest.operatorID || null) : null,
    totalBookingsHandled: role === "tour_operator" ? 0 : null,
    ...rest,
  };

  await db.collection("users").doc(userRecord.uid).set(userData);

  return { uid: userRecord.uid };
}

export async function loginUser(email: string, password: string) {
  const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
  if (snapshot.empty) {
    throw new Error("Invalid email or password");
  }
  const doc = snapshot.docs[0];
  const data = doc.data() as any;
  if (data.password !== hashPassword(password)) {
    throw new Error("Invalid email or password");
  }
  const token = await auth.createCustomToken(doc.id);
  return {
    token,
    user: { uid: doc.id, email: data.email, role: data.role },
  };
}

export async function resetPassword(email: string, newPassword: string) {
  const userRecord = await auth.getUserByEmail(email);
  await auth.updateUser(userRecord.uid, { password: newPassword });
  await db.collection("users").doc(userRecord.uid).update({
    password: hashPassword(newPassword),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
