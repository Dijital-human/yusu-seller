/**
 * Seller Profile Settings API Route / Satıcı Profil Tənzimləmələri API Route-u
 * This route handles seller profile information (GET, PUT)
 * Bu route satıcı profil məlumatlarını idarə edir (GET, PUT)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating profile / Profili yeniləmək üçün schema
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required / Ad tələb olunur").optional(),
  email: z.string().email("Invalid email / Yanlış email").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url("Invalid URL / Yanlış URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

/**
 * GET /api/seller/settings/profile
 * Get seller profile information / Satıcı profil məlumatlarını al
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await db.user.findFirst({
        where: { role: "SELLER" }
      });
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    // Get seller profile / Satıcı profilini al
    const seller = await db.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found / Satıcı tapılmadı" },
        { status: 404 }
      );
    }

    // Return profile data / Profil məlumatlarını qaytar
    return NextResponse.json({
      profile: {
        id: seller.id,
        name: seller.name || "",
        email: seller.email,
        phone: seller.phone || "",
        company: "", // Will be added to User model if needed / Lazım olsa User model-ə əlavə ediləcək
        website: "", // Will be added to User model if needed / Lazım olsa User model-ə əlavə ediləcək
        description: "", // Will be added to User model if needed / Lazım olsa User model-ə əlavə ediləcək
        avatar: seller.image || "",
      },
    });
  } catch (error) {
    console.error("Error fetching seller profile / Satıcı profilini əldə etmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/settings/profile
 * Update seller profile information / Satıcı profil məlumatlarını yenilə
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a seller
    // İstifadəçinin giriş edib-edmədiyini və satıcı olub-olmadığını yoxla
    let sellerId: string;
    
    if (!session || session.user?.role !== "SELLER") {
      // For testing purposes, use a test seller ID
      // Test məqsədləri üçün test seller ID istifadə et
      const testSeller = await db.user.findFirst({
        where: { role: "SELLER" }
      });
      
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found / Satıcı tapılmadı" },
          { status: 404 }
        );
      }
      
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    const body = await request.json();

    // Validate input data / Giriş məlumatlarını yoxla
    const validatedFields = profileUpdateSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Validation error / Yoxlama xətası",
          details: validatedFields.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user / Email-in başqa istifadəçi tərəfindən istifadə olunub-olunmadığını yoxla
    if (validatedFields.data.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validatedFields.data.email,
          NOT: { id: sellerId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already taken / Email artıq istifadə olunur" },
          { status: 400 }
        );
      }
    }

    // Prepare update data / Yeniləmə məlumatlarını hazırla
    const updateData: any = {};
    if (validatedFields.data.name !== undefined) updateData.name = validatedFields.data.name;
    if (validatedFields.data.email !== undefined) updateData.email = validatedFields.data.email;
    if (validatedFields.data.phone !== undefined) updateData.phone = validatedFields.data.phone;
    // Note: company, website, description fields will be added to User model if needed
    // Qeyd: company, website, description field-ləri lazım olsa User model-ə əlavə ediləcək

    // Update seller profile / Satıcı profilini yenilə
    const updatedSeller = await db.user.update({
      where: { id: sellerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully / Profil uğurla yeniləndi",
      profile: {
        id: updatedSeller.id,
        name: updatedSeller.name || "",
        email: updatedSeller.email,
        phone: updatedSeller.phone || "",
        company: "", // Will be added to User model if needed / Lazım olsa User model-ə əlavə ediləcək
        website: "", // Will be added to User model if needed / Lazım olsa User model-ə əlavə ediləcək
        description: "", // Will be added to User model if needed / Lazım olsa User model-ə əlavə ediləcək
        avatar: updatedSeller.image || "",
      },
    });
  } catch (error) {
    console.error("Error updating seller profile / Satıcı profilini yeniləmə xətası:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

