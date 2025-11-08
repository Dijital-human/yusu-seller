import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get("parentOnly") === "true";

    const where: any = {
      isActive: true,
    };

    if (parentOnly) {
      where.parentId = null;
    }

    const categories = await db.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        parentId: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({
      success: true,
      data: [],
      warning: "Could not fetch categories from database",
    });
  }
}

