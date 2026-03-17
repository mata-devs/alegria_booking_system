import { z } from 'zod';

export const emailPasswordSignInSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .trim()
    .min(1, 'Please fill out this field.'),
  password: z.string().min(1, 'Please fill out this field.'),
});

export const resetPasswordSchema = z.object({
  email: z
    .email('Please enter a valid email address.')
    .trim()
    .min(1, 'Please fill out this field.'),
});
