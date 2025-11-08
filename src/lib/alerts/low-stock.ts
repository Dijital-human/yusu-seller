import { db } from "@/lib/db";

// SendGrid import (optional)
let sgMail: any = null;
try {
  sgMail = require("@sendgrid/mail");
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch (error) {
  console.log("SendGrid not available");
}

interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  sellerId: string;
  sellerEmail: string;
}

/**
 * Check for low stock products and send alerts
 */
export async function checkLowStockAlerts(sellerId: string, threshold: number = 10) {
  try {
    // Get products with stock below threshold
    const lowStockProducts = await db.product.findMany({
      where: {
        sellerId: sellerId,
        stock: {
          lt: threshold,
        },
        isActive: true,
      },
      include: {
        seller: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    const alerts: LowStockAlert[] = [];

    for (const product of lowStockProducts) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        threshold: threshold,
        sellerId: sellerId,
        sellerEmail: product.seller.email || "",
      });
    }

    return alerts;
  } catch (error) {
    console.error("Error checking low stock alerts:", error);
    return [];
  }
}

/**
 * Send email notification for low stock
 */
export async function sendLowStockEmail(alert: LowStockAlert) {
  try {
    if (!sgMail || !process.env.SENDGRID_API_KEY || !alert.sellerEmail) {
      console.log("Email not configured or seller email missing");
      return false;
    }

    const msg = {
      to: alert.sellerEmail,
      from: process.env.EMAIL_FROM || "noreply@yusu.com",
      subject: `⚠️ Low Stock Alert: ${alert.productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Low Stock Alert</h2>
          <p>Your product <strong>${alert.productName}</strong> is running low on stock.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Current Stock:</strong> ${alert.currentStock}</p>
            <p><strong>Threshold:</strong> ${alert.threshold}</p>
          </div>
          <p>Please restock this product soon to avoid running out.</p>
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3002"}/seller/products/${alert.productId}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            View Product
          </a>
        </div>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("Error sending low stock email:", error);
    return false;
  }
}

/**
 * Get seller's low stock threshold from settings
 */
export async function getLowStockThreshold(sellerId: string): Promise<number> {
  try {
    // Try to get from SiteSetting (if exists)
    const setting = await db.siteSetting.findUnique({
      where: {
        category_key: {
          category: "seller_settings",
          key: `low_stock_threshold_${sellerId}`,
        },
      },
    });

    if (setting) {
      return parseInt(setting.value) || 10;
    }

    // Default threshold
    return 10;
  } catch (error) {
    console.error("Error getting low stock threshold:", error);
    return 10; // Default threshold
  }
}

/**
 * Set seller's low stock threshold
 */
export async function setLowStockThreshold(sellerId: string, threshold: number) {
  try {
    await db.siteSetting.upsert({
      where: {
        category_key: {
          category: "seller_settings",
          key: `low_stock_threshold_${sellerId}`,
        },
      },
      update: {
        value: threshold.toString(),
        updatedAt: new Date(),
      },
      create: {
        category: "seller_settings",
        key: `low_stock_threshold_${sellerId}`,
        value: threshold.toString(),
        description: `Low stock threshold for seller ${sellerId}`,
      },
    });

    return true;
  } catch (error) {
    console.error("Error setting low stock threshold:", error);
    return false;
  }
}

/**
 * Process all low stock alerts for a seller
 */
export async function processLowStockAlerts(sellerId: string) {
  try {
    const threshold = await getLowStockThreshold(sellerId);
    const alerts = await checkLowStockAlerts(sellerId, threshold);

    const results = {
      total: alerts.length,
      sent: 0,
      failed: 0,
    };

    for (const alert of alerts) {
      const sent = await sendLowStockEmail(alert);
      if (sent) {
        results.sent++;
      } else {
        results.failed++;
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing low stock alerts:", error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
    };
  }
}

