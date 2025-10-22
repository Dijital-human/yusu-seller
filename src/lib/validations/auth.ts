/**
 * Authentication Validation Schemas / Autentifikasiya Yoxlama Şablonları
 * This file contains Zod validation schemas for authentication forms
 * Bu fayl autentifikasiya formaları üçün Zod yoxlama şablonlarını ehtiva edir
 */

import { z } from "zod";

// Login Form Validation / Giriş Formu Yoxlaması
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required / Email tələb olunur")
    .email("Invalid email format / Yanlış email formatı"),
  // Password temporarily optional for testing / Test üçün şifrə müvəqqəti olaraq isteğe bağlı
  password: z
    .string()
    .optional(),
});

// Register Form Validation / Qeydiyyat Formu Yoxlaması
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters / Ad ən azı 2 simvol olmalıdır")
    .max(50, "Name must be less than 50 characters / Ad 50 simvoldan az olmalıdır"),
  email: z
    .string()
    .min(1, "Email is required / Email tələb olunur")
    .email("Invalid email format / Yanlış email formatı"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters / Şifrə ən azı 8 simvol olmalıdır")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number / Şifrə ən azı bir böyük hərf, bir kiçik hərf və bir rəqəm ehtiva etməlidir"
    ),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password / Şifrənizi təsdiq edin"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/\s/g, '')),
      "Invalid phone number format / Yanlış telefon nömrəsi formatı"
    ),
  role: z
    .enum(['CUSTOMER', 'SELLER', 'COURIER'], {
      message: "Invalid role selection / Yanlış rol seçimi"
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match / Şifrələr uyğun gəlmir",
  path: ["confirmPassword"],
});

// Forgot Password Form Validation / Şifrəni Unutma Formu Yoxlaması
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required / Email tələb olunur")
    .email("Invalid email format / Yanlış email formatı"),
});

// Reset Password Form Validation / Şifrəni Sıfırlama Formu Yoxlaması
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters / Şifrə ən azı 8 simvol olmalıdır")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number / Şifrə ən azı bir böyük hərf, bir kiçik hərf və bir rəqəm ehtiva etməlidir"
    ),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password / Şifrənizi təsdiq edin"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match / Şifrələr uyğun gəlmir",
  path: ["confirmPassword"],
});

// Change Password Form Validation / Şifrəni Dəyişmə Formu Yoxlaması
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required / Hazırkı şifrə tələb olunur"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters / Yeni şifrə ən azı 8 simvol olmalıdır")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "New password must contain at least one uppercase letter, one lowercase letter, and one number / Yeni şifrə ən azı bir böyük hərf, bir kiçik hərf və bir rəqəm ehtiva etməlidir"
    ),
  confirmNewPassword: z
    .string()
    .min(1, "Please confirm your new password / Yeni şifrənizi təsdiq edin"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match / Yeni şifrələr uyğun gəlmir",
  path: ["confirmNewPassword"],
});

// Type exports / Tip ixracları
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
