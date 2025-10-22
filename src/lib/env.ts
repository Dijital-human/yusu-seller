/**
 * Seller Environment Variables Validation / Seller Mühit Dəyişənləri Doğrulama
 * This utility validates and provides type-safe access to seller environment variables
 * Bu utility seller environment variables-ları doğrulayır və type-safe giriş təmin edir
 */

import { z } from "zod";

// Seller environment schema definition / Seller mühit şeması tərifi
const sellerEnvSchema = z.object({
  // Database / Veritabanı
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required / DATABASE_URL tələb olunur"),
  
  // NextAuth / NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL / NEXTAUTH_URL etibarlı URL olmalıdır"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters / NEXTAUTH_SECRET ən azı 32 simvol olmalıdır"),
  
  // OAuth Providers / OAuth Provider-lər
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  
  // Payment Gateway / Ödəniş Gateway-i
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // External APIs / Xarici API-lər
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Email Configuration / Email Konfiqurasiyası
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Redis Configuration / Redis Konfiqurasiyası
  REDIS_URL: z.string().optional(),
  
  // Application Settings / Tətbiq Tənzimləri
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3002"),
  
  // Security Settings / Təhlükəsizlik Tənzimləri
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_MAX: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  
  // Seller Specific Settings / Seller Xüsusi Tənzimləri
  SELLER_SESSION_TIMEOUT: z.string().optional(),
  SELLER_MAX_LOGIN_ATTEMPTS: z.string().optional(),
  
  // Logging Configuration / Logging Konfiqurasiyası
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SELLER_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  SELLER_AUDIT_LOG: z.string().optional(),
  
  // File Upload Configuration / Fayl Yükləmə Konfiqurasiyası
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.string().optional(),
  ALLOWED_FILE_TYPES: z.string().optional(),
  
  // Seller Panel Settings / Seller Panel Tənzimləri
  SELLER_PANEL_TITLE: z.string().optional(),
  SELLER_PANEL_DESCRIPTION: z.string().optional(),
  
  // Product Management Settings / Məhsul İdarəetmə Tənzimləri
  SELLER_MAX_PRODUCTS: z.string().optional(),
  SELLER_PRODUCT_IMAGE_LIMIT: z.string().optional(),
  SELLER_PRODUCT_AUTO_SAVE: z.string().optional(),
  
  // Order Management Settings / Sifariş İdarəetmə Tənzimləri
  SELLER_ORDER_NOTIFICATION: z.string().optional(),
  SELLER_ORDER_UPDATE_EMAIL: z.string().optional(),
  SELLER_ORDER_DEADLINE_HOURS: z.string().optional(),
  
  // Commission Settings / Komissiya Tənzimləri
  SELLER_COMMISSION_RATE: z.string().optional(),
  SELLER_MINIMUM_PAYOUT: z.string().optional(),
  SELLER_PAYOUT_SCHEDULE: z.string().optional(),
  
  // Inventory Settings / İnventar Tənzimləri
  SELLER_LOW_STOCK_THRESHOLD: z.string().optional(),
  SELLER_OUT_OF_STOCK_NOTIFICATION: z.string().optional(),
  SELLER_AUTO_DISABLE_OUT_OF_STOCK: z.string().optional(),
  
  // Notification Settings / Bildiriş Tənzimləri
  SELLER_EMAIL_NEW_ORDER: z.string().optional(),
  SELLER_EMAIL_ORDER_UPDATE: z.string().optional(),
  SELLER_EMAIL_PAYMENT_RECEIVED: z.string().optional(),
  SELLER_EMAIL_LOW_STOCK: z.string().optional(),
  SELLER_SMS_NEW_ORDER: z.string().optional(),
  SELLER_SMS_ORDER_UPDATE: z.string().optional(),
  SELLER_SMS_PAYMENT_RECEIVED: z.string().optional(),
});

// Environment validation function / Mühit doğrulama funksiyası
export function validateSellerEnv() {
  try {
    const env = sellerEnvSchema.parse(process.env);
    console.log("✅ Seller environment variables validated successfully / Seller mühit dəyişənləri uğurla doğrulandı");
    return env;
  } catch (error) {
    console.error("❌ Seller environment validation failed / Seller mühit doğrulaması uğursuz oldu:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Type-safe environment variables / Type-safe mühit dəyişənləri
export type SellerEnv = z.infer<typeof sellerEnvSchema>;

// Get environment variables with validation / Doğrulama ilə mühit dəyişənlərini əldə et
export const sellerEnv = validateSellerEnv();

// Helper functions / Köməkçi funksiyalar
export const isDevelopment = sellerEnv.NODE_ENV === "development";
export const isProduction = sellerEnv.NODE_ENV === "production";
export const isTest = sellerEnv.NODE_ENV === "test";

// Seller specific helpers / Seller xüsusi köməkçiləri
export const getSellerSessionTimeout = () => {
  return sellerEnv.SELLER_SESSION_TIMEOUT ? parseInt(sellerEnv.SELLER_SESSION_TIMEOUT) : 7200000; // 2 hours default
};

export const getSellerMaxLoginAttempts = () => {
  return sellerEnv.SELLER_MAX_LOGIN_ATTEMPTS ? parseInt(sellerEnv.SELLER_MAX_LOGIN_ATTEMPTS) : 5;
};

export const getSellerLogLevel = () => {
  return sellerEnv.SELLER_LOG_LEVEL || sellerEnv.LOG_LEVEL;
};

export const isSellerAuditLogEnabled = () => {
  return sellerEnv.SELLER_AUDIT_LOG === "true";
};

export const getSellerPanelConfig = () => {
  return {
    title: sellerEnv.SELLER_PANEL_TITLE || "Yusu Seller Panel",
    description: sellerEnv.SELLER_PANEL_DESCRIPTION || "Yusu E-commerce Seller Management System",
  };
};

export const getProductManagementConfig = () => {
  return {
    maxProducts: sellerEnv.SELLER_MAX_PRODUCTS ? parseInt(sellerEnv.SELLER_MAX_PRODUCTS) : 1000,
    imageLimit: sellerEnv.SELLER_PRODUCT_IMAGE_LIMIT ? parseInt(sellerEnv.SELLER_PRODUCT_IMAGE_LIMIT) : 10,
    autoSave: sellerEnv.SELLER_PRODUCT_AUTO_SAVE === "true",
  };
};

export const getOrderManagementConfig = () => {
  return {
    notification: sellerEnv.SELLER_ORDER_NOTIFICATION === "true",
    updateEmail: sellerEnv.SELLER_ORDER_UPDATE_EMAIL === "true",
    deadlineHours: sellerEnv.SELLER_ORDER_DEADLINE_HOURS ? parseInt(sellerEnv.SELLER_ORDER_DEADLINE_HOURS) : 24,
  };
};

export const getCommissionConfig = () => {
  return {
    rate: sellerEnv.SELLER_COMMISSION_RATE ? parseFloat(sellerEnv.SELLER_COMMISSION_RATE) : 0.05,
    minimumPayout: sellerEnv.SELLER_MINIMUM_PAYOUT ? parseFloat(sellerEnv.SELLER_MINIMUM_PAYOUT) : 50.00,
    schedule: sellerEnv.SELLER_PAYOUT_SCHEDULE || "weekly",
  };
};

export const getInventoryConfig = () => {
  return {
    lowStockThreshold: sellerEnv.SELLER_LOW_STOCK_THRESHOLD ? parseInt(sellerEnv.SELLER_LOW_STOCK_THRESHOLD) : 10,
    outOfStockNotification: sellerEnv.SELLER_OUT_OF_STOCK_NOTIFICATION === "true",
    autoDisableOutOfStock: sellerEnv.SELLER_AUTO_DISABLE_OUT_OF_STOCK === "true",
  };
};

export const getNotificationConfig = () => {
  return {
    email: {
      newOrder: sellerEnv.SELLER_EMAIL_NEW_ORDER === "true",
      orderUpdate: sellerEnv.SELLER_EMAIL_ORDER_UPDATE === "true",
      paymentReceived: sellerEnv.SELLER_EMAIL_PAYMENT_RECEIVED === "true",
      lowStock: sellerEnv.SELLER_EMAIL_LOW_STOCK === "true",
    },
    sms: {
      newOrder: sellerEnv.SELLER_SMS_NEW_ORDER === "true",
      orderUpdate: sellerEnv.SELLER_SMS_ORDER_UPDATE === "true",
      paymentReceived: sellerEnv.SELLER_SMS_PAYMENT_RECEIVED === "true",
    },
  };
};

// All functions are already exported above / Bütün funksiyalar yuxarıda export edilib
