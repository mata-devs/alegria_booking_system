import { z } from 'zod';

// ── PH phone: user types "999 999 9999", stored as "+639999999999" ─────────────
const phLocalPhoneRegex = /^9\d{9}$/;

export const representativeFormSchema = z.object({
  repName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name must not exceed 100 characters.')
    .regex(/^[\p{L}\s''.\-]+$/u, 'Full name contains invalid characters.'),

  repAge: z
    .string()
    .trim()
    .min(1, 'Age is required.')
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 120;
    }, 'Age must be a whole number between 1 and 120.'),

  repGender: z
    .string()
    .min(1, 'Please select a gender.'),

  repEmail: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .max(254, 'Email address is too long.'),

  repPhone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine((v) => {
      const local = v.startsWith('+63') ? v.slice(3) : v;
      const digits = local.replace(/\D/g, '');
      return phLocalPhoneRegex.test(digits);
    }, 'Enter a valid Philippine mobile number (e.g. 917 123 4567).'),

  repNationality: z
    .string()
    .min(1, 'Nationality is required.'),
});

export const guestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name must not exceed 100 characters.')
    .regex(/^[\p{L}\s''.\-]+$/u, 'Full name contains invalid characters.'),

  age: z
    .string()
    .trim()
    .min(1, 'Age is required.')
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 120;
    }, 'Age must be a whole number between 1 and 120.'),

  gender: z
    .string()
    .min(1, 'Please select a gender.'),

  nationality: z
    .string()
    .min(1, 'Nationality is required.'),
});

export type RepresentativeFormValues = z.infer<typeof representativeFormSchema>;
export type GuestValues = z.infer<typeof guestSchema>;

export const emailPasswordSignInSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address.')
    .trim()
    .min(1, 'Please fill out this field.'),
  password: z.string().min(1, 'Please fill out this field.'),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address.')
    .trim()
    .min(1, 'Please fill out this field.'),
});