import { z } from "zod";

/** Shared by the sign-in form (client) and the server action. */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  // Not trimmed and no minimum length: login must not reveal the password policy.
  password: z.string().min(1).max(256),
  next: z.string().max(500).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

/** Shared by the sign-up form (client) and the server action. */
export const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything past 72 bytes.
export const PASSWORD_MAX_LENGTH = 72;

export const signUpSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    // Not trimmed: spaces are part of the password.
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
    next: z.string().max(500).optional(),
  })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"] });

export type SignUpInput = z.infer<typeof signUpSchema>;

/** Query parameters accepted by /auth/confirm (token-hash links work across browsers). */
export const confirmParamsSchema = z.object({
  token_hash: z.string().min(1).max(500),
  type: z.enum(["email", "magiclink"]),
  next: z.string().max(500).optional(),
});

/** Query parameters accepted by /auth/callback (PKCE code links). */
export const callbackParamsSchema = z.object({
  code: z.string().min(1).max(500),
  next: z.string().max(500).optional(),
});
