/**
 * Global Type Definitions / Global Tip Tərifləri
 * This file contains all the type definitions used throughout the application
 * Bu fayl tətbiq boyunca istifadə olunan bütün tip təriflərini ehtiva edir
 */

// User Types / İstifadəçi Tipləri
export type UserRole = 'CUSTOMER' | 'SELLER' | 'COURIER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  passwordHash?: string; // Parol hash-i (opsiyonal)
  resetToken?: string; // Reset token (opsiyonal)
  resetTokenExpiry?: Date; // Reset token müddəti (opsiyonal)
  createdAt: Date;
  updatedAt: Date;
}

// Product Types / Məhsul Tipləri
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  sellerId: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types / Kateqoriya Tipləri
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types / Sifariş Tipləri
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  sellerId: string;
  courierId?: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: Address;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

// Address Types / Ünvan Tipləri
export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types / Səbət Tipləri
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

// Courier Types / Kuryer Tipləri
export interface Courier {
  id: string;
  userId: string;
  vehicleType: 'BIKE' | 'MOTORCYCLE' | 'CAR' | 'VAN';
  licenseNumber: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  totalDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types / API Cavab Tipləri
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types / Səhifələmə Tipləri
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
