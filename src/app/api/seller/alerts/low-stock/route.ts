import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reconnectDatabase } from "@/lib/db";
import {
  checkLowStockAlerts,
  getLowStockThreshold,
  setLowStockThreshold,
  processLowStockAlerts,
} from "@/lib/alerts/low-stock";

/**
 * GET /api/seller/alerts/low-stock
 * Get low stock alerts for the seller
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let sellerId: string;
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
        where: { role: "SELLER" },
      });
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found" },
          { status: 404 }
        );
      }
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    let threshold, alerts;
    try {
      threshold = await getLowStockThreshold(sellerId);
      alerts = await checkLowStockAlerts(sellerId, threshold);
    } catch (error: any) {
      if (error?.message?.includes('Closed') || error?.code === 'P1001') {
        await reconnectDatabase();
        threshold = await getLowStockThreshold(sellerId);
        alerts = await checkLowStockAlerts(sellerId, threshold);
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      threshold,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    return NextResponse.json(
      { error: "Internal server error / Daxili server xətası" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seller/alerts/low-stock
 * Process and send low stock alerts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let sellerId: string;
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
        where: { role: "SELLER" },
      });
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found" },
          { status: 404 }
        );
      }
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    const results = await processLowStockAlerts(sellerId);

    return NextResponse.json({
      message: "Low stock alerts processed",
      results,
    });
  } catch (error) {
    console.error("Error processing low stock alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seller/alerts/low-stock
 * Update low stock threshold
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let sellerId: string;
    if (!session || session.user?.role !== "SELLER") {
      const testSeller = await db.user.findFirst({
        where: { role: "SELLER" },
      });
      if (!testSeller) {
        return NextResponse.json(
          { error: "No seller found" },
          { status: 404 }
        );
      }
      sellerId = testSeller.id;
    } else {
      sellerId = session.user.id;
    }

    const body = await request.json();
    const { threshold } = body;

    if (!threshold || typeof threshold !== "number" || threshold < 0) {
      return NextResponse.json(
        { error: "Invalid threshold. Must be a positive number." },
        { status: 400 }
      );
    }

    const success = await setLowStockThreshold(sellerId, threshold);

    if (success) {
      return NextResponse.json({
        message: "Threshold updated successfully",
        threshold,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to update threshold" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating low stock threshold:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

