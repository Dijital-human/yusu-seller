/**
 * NextAuth.js Configuration / NextAuth.js Konfiqurasiyası
 * This file contains the NextAuth.js configuration with multiple providers
 * Bu fayl çoxlu provayderlər ilə NextAuth.js konfiqurasiyasını ehtiva edir
 */

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  // Database adapter / Veritabanı adapter-i
  adapter: PrismaAdapter(prisma),
  
  // Session strategy / Sessiya strategiyası
  session: {
    strategy: "jwt",
  },
  
  // JWT configuration / JWT konfiqurasiyası
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days / 30 gün
  },
  
  // Pages configuration / Səhifələr konfiqurasiyası
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  
  // Providers configuration / Provayderlər konfiqurasiyası
  providers: [
    // OAuth providers temporarily disabled for testing / Test üçün OAuth provayderlər müvəqqəti deaktiv
    // Google Provider / Google Provayderi
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    
    // Facebook Provider / Facebook Provayderi
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_CLIENT_ID!,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    // }),
    
    // Apple Provider / Apple Provayderi
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // }),
    
    // Credentials Provider (Email/Password) / Kimlik Bilgiləri Provayderi
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          
          const { email, password } = credentials;
          
          // Find user in database / Veritabanında istifadəçini tap
          const user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user || !user.isActive) {
            return null;
          }
          
          // Check password if user has one / Əgər istifadəçinin parolu varsa yoxla
          if ((user as any).passwordHash) {
            const isValidPassword = await compare(password, (user as any).passwordHash);
            if (!isValidPassword) {
              return null;
            }
          }
          
          // Check if user is a SELLER / İstifadəçinin SELLER olub olmadığını yoxla
          if (user.role !== UserRole.SELLER) {
            return null;
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            isApproved: (user as any).isApproved || (user as any).isApprovedByAdmin || false,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  
  // Callbacks / Callback-lər
  callbacks: {
    // JWT callback / JWT callback-i
    async jwt({ token, user, account }) {
      // Initial sign in / İlkin giriş
      if (account && user) {
        return {
          ...token,
          role: user.role,
          id: user.id,
          isApproved: (user as any).isApproved || (user as any).isApprovedByAdmin || false,
        };
      }
      
      // Return previous token if the access token has not expired yet / Əgər access token hələ bitməyibsə əvvəlki token-i qaytar
      return token;
    },
    
    // Session callback / Sessiya callback-i
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      
      return session;
    },
    
    // Sign in callback / Giriş callback-i
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "credentials") {
          // For credentials provider, check if user exists and is active
          // Kimlik bilgiləri provayderi üçün istifadəçinin mövcudluğunu və aktivliyini yoxla
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          
          if (!existingUser || !existingUser.isActive) {
            return false;
          }
          
          return true;
        }
        
        // For OAuth providers / OAuth provayderlər üçün
        if (account?.provider && profile) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          
          // Determine role based on email / Email-ə görə rol təyin et
          let userRole: UserRole = "CUSTOMER"; // Default role / Varsayılan rol
          
          if (user.email === "admin@yusu.com") {
            userRole = "ADMIN";
          } else if (user.email === "seller1@yusu.com" || user.email === "seller2@yusu.com") {
            userRole = "SELLER";
          } else if (user.email === "courier1@yusu.com" || user.email === "courier2@yusu.com") {
            userRole = "COURIER";
          } else if (user.email?.includes("test-seller")) {
            // Test üçün: email-də "test-seller" varsa SELLER rol ver
            userRole = "SELLER";
          } else if (user.email?.includes("test-admin")) {
            // Test üçün: email-də "test-admin" varsa ADMIN rol ver
            userRole = "ADMIN";
          } else if (user.email?.includes("test-courier")) {
            // Test üçün: email-də "test-courier" varsa COURIER rol ver
            userRole = "COURIER";
          }
          
          if (!existingUser) {
            // Create new user for OAuth / OAuth üçün yeni istifadəçi yarat
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                role: userRole,
                isActive: true,
              },
            });
          } else {
            // Update existing user role if needed / Mövcud istifadəçinin rolunu lazım olduqda yenilə
            if (existingUser.role !== userRole) {
              await prisma.user.update({
                where: { email: user.email! },
                data: { role: userRole },
              });
            }
          }
        }
        
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },
  
  // Events / Hadisələr
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email}`);
    },
  },
  
  // Debug mode in development / Development-da debug rejimi
  debug: process.env.NODE_ENV === "development",
};
