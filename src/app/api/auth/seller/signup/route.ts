import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Maximum file size: 10MB / Maksimum fayl ölçüsü: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types / İcazə verilən fayl tipləri
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

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
        { 
          error: "Business license and tax certificate are required / Biznes lisenziyası və vergi şəhadətnaməsi tələb olunur",
          errorAz: "Biznes lisenziyası və vergi şəhadətnaməsi tələb olunur"
        },
        { status: 400 }
      );
    }

    // Validate file sizes / Fayl ölçülərini yoxla
    if (businessLicense.size > MAX_FILE_SIZE || taxCertificate.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB / Fayl ölçüsü ${MAX_FILE_SIZE / 1024 / 1024}MB-dan az olmalıdır`,
          errorAz: `Fayl ölçüsü ${MAX_FILE_SIZE / 1024 / 1024}MB-dan az olmalıdır`
        },
        { status: 400 }
      );
    }

    // Validate file types / Fayl tiplərini yoxla
    if (!ALLOWED_TYPES.includes(businessLicense.type) || !ALLOWED_TYPES.includes(taxCertificate.type)) {
      return NextResponse.json(
        { 
          error: "Invalid file type. Allowed types: PDF, JPEG, PNG, WEBP / Yanlış fayl tipi. İcazə verilən tiplər: PDF, JPEG, PNG, WEBP",
          errorAz: "Yanlış fayl tipi. İcazə verilən tiplər: PDF, JPEG, PNG, WEBP"
        },
        { status: 400 }
      );
    }

    // Determine seller type from form data (default: SUPER_SELLER) / Form məlumatından satıcı tipini təyin et (varsayılan: SUPER_SELLER)
    const sellerType = (formData.get("sellerType") as string) || "SUPER_SELLER";

    // Save uploaded files to storage / Yüklənən faylları storage-a saxla
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'seller-documents');
    
    // Create uploads directory if it doesn't exist / Uploads qovluğunu yoxdursa yarat
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique file names / Unikal fayl adları yarat
    const timestamp = Date.now();
    const businessLicenseExt = businessLicense.name.split('.').pop() || 'pdf';
    const taxCertificateExt = taxCertificate.name.split('.').pop() || 'pdf';
    const businessLicenseFileName = `business-license-${timestamp}.${businessLicenseExt}`;
    const taxCertificateFileName = `tax-certificate-${timestamp}.${taxCertificateExt}`;
    
    const businessLicensePath = join(uploadsDir, businessLicenseFileName);
    const taxCertificatePath = join(uploadsDir, taxCertificateFileName);

    // Convert File to Buffer and save / File-i Buffer-ə çevir və saxla
    const businessLicenseBuffer = Buffer.from(await businessLicense.arrayBuffer());
    const taxCertificateBuffer = Buffer.from(await taxCertificate.arrayBuffer());

    await writeFile(businessLicensePath, businessLicenseBuffer);
    await writeFile(taxCertificatePath, taxCertificateBuffer);

    // Generate file URLs / Fayl URL-ləri yarat
    const businessLicenseUrl = `/uploads/seller-documents/${businessLicenseFileName}`;
    const taxCertificateUrl = `/uploads/seller-documents/${taxCertificateFileName}`;

    // Create seller user / Seller istifadəçi yarat
    const seller = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        passwordHash: hashedPassword, // Password hash / Şifrə hash-i
        role: sellerType === "SUPER_SELLER" ? "SUPER_SELLER" : sellerType === "USER_SELLER" ? "USER_SELLER" : "SELLER",
        sellerType: sellerType, // SUPER_SELLER or USER_SELLER / SUPER_SELLER və ya USER_SELLER
        isActive: true,
        isApprovedByAdmin: false, // Admin təsdiqi gözləyir (Super Seller üçün) / Admin approval pending (for Super Sellers)
        // Business information / Biznes məlumatları
        businessName: validatedData.businessName,
        businessType: validatedData.businessType,
        businessAddress: validatedData.businessAddress,
        businessDescription: validatedData.businessDescription,
        // Business documents / Biznes sənədləri
        businessLicense: businessLicenseUrl,
        taxCertificate: taxCertificateUrl,
      },
    });

    // Remove password hash from response / Cavabdan şifrə hash-ini çıxar
    const { passwordHash, ...sellerWithoutPassword } = seller;

    return NextResponse.json(
      {
        message: "Seller account created successfully. Waiting for admin approval. / Satıcı hesabı uğurla yaradıldı. Admin təsdiqi gözləyir.",
        user: sellerWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seller signup error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed / Yoxlama uğursuz oldu",
          errorAz: "Yoxlama uğursuz oldu",
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            messageAz: issue.message, // Can be enhanced with specific translations / Xüsusi tərcümələrlə təkmilləşdirilə bilər
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create seller account / Satıcı hesabı yaratmaq uğursuz oldu",
        errorAz: "Satıcı hesabı yaratmaq uğursuz oldu",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
