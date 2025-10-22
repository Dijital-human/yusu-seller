/**
 * NextAuth.js API Route / NextAuth.js API Route-u
 * This file handles all authentication requests
 * Bu fayl bütün autentifikasiya sorğularını idarə edir
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
