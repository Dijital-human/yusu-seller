/**
 * NextAuth.js TypeScript Declarations / NextAuth.js TypeScript Tərifləri
 * This file extends NextAuth.js types with custom properties
 * Bu fayl NextAuth.js tiplərini xüsusi xüsusiyyətlərlə genişləndirir
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    id: string;
  }
}
