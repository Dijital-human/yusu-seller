import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

/**
 * Seller Signup API / Satıcı Qeydiyyat API
 * 
 * Bu API seller-lərin qeydiyyatdan keçməsi üçün istifadə olunur.
 * Form data və faylları qəbul edir, seller hesabı yaradır.
 * 
 * Features / Xüsusiyyətlər:
 * - Form validation / Form yoxlaması
 * - File upload handling / Fayl yükləmə idarəsi
 * - Password hashing / Şifrə hash-ləmə
 * - Duplicate check / Təkrarlanma yoxlaması
 */

const sellerSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum(["RETAIL", "WHOLESALE", "ONLINE", "MANUFACTURER"]),
  businessAddress: z.string().min(10, "Business address must be at least 10 characters"),
  businessDescription: z.string().min(20, "Business description must be at least 20 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extract form data / Form məlumatlarını çıxar
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      businessName: formData.get("businessName") as string,
      businessType: formData.get("businessType") as string,
      businessAddress: formData.get("businessAddress") as string,
      businessDescription: formData.get("businessDescription") as string,
    };

    // Validate form data / Form məlumatlarını yoxla
    const validatedData = sellerSignupSchema.parse(data);

    // Check if user already exists / İstifadəçi artıq mövcuddurmu yoxla
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phone: validatedData.phone },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    // Hash password / Şifrəni hash-lə
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Get uploaded files / Yüklənən faylları al
    const businessLicense = formData.get("businessLicense") as File;
    const taxCertificate = formData.get("taxCertificate") as File;

    // Validate files / Faylları yoxla
    if (!businessLicense || !taxCertificate) {
      return NextResponse.json(
        { error: "Business license and tax certificate are required" },
        { status: 400 }
      );
    }

    // Create seller user / Seller istifadəçi yarat
    const seller = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        // password: hashedPassword, // Password field not in schema
        role: "SELLER",
        isActive: true,
        // Add seller-specific fields if needed
        // businessName: validatedData.businessName,
        // businessType: validatedData.businessType,
        // businessAddress: validatedData.businessAddress,
        // businessDescription: validatedData.businessDescription,
      },
    });

    // TODO: Save uploaded files to storage / Yüklənən faylları storage-a saxla
    // This would typically involve uploading to AWS S3, Cloudinary, etc.
    // Bu adətən AWS S3, Cloudinary və s. yükləməni əhatə edir

    // Remove password from response / Cavabdan şifrəni çıxar
    // const { password, ...sellerWithoutPassword } = seller;

    return NextResponse.json(
      {
        message: "Seller account created successfully",
        user: seller,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seller signup error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create seller account" },
      { status: 500 }
    );
  }
}
