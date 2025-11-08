/**
 * POS Dashboard Page / Kassa Dashboard Səhifəsi
 * This page provides POS (Point of Sale) functionality
 * Bu səhifə Kassa (Satış Nöqtəsi) funksionallığını təmin edir
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { POSCart } from "@/components/pos/POSCart";
import { POSProductSearch } from "@/components/pos/POSProductSearch";
import { POSPayment } from "@/components/pos/POSPayment";
import { 
  ShoppingCart, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Receipt
} from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function POSPage() {
  const router = useRouter();
  const t = useTranslations('pos');
  const tCommon = useTranslations('common');
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [lastOrderId, setLastOrderId] = useState<string>("");

  // Add product to cart / Məhsulu səbətə əlavə et
  const handleProductSelect = (product: any) => {
    if (product.stock <= 0) {
      setError(t('outOfStock') || "Product is out of stock / Məhsul stokda yoxdur");
      return;
    }

    const existingItem = cartItems.find(
      item => item.productId === product.id && !item.variantId
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setError(t('insufficientStock') || "Insufficient stock / Kifayət qədər stok yoxdur");
        return;
      }
      handleUpdateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        image: product.images ? (Array.isArray(product.images) ? product.images[0] : JSON.parse(product.images)?.[0]) : undefined,
      };
      setCartItems([...cartItems, newItem]);
    }
    setError("");
  };

  // Update quantity / Miqdarı yenilə
  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Remove item / Elementi sil
  const handleRemoveItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  // Clear cart / Səbəti təmizlə
  const handleClearCart = () => {
    setCartItems([]);
    setError("");
    setSuccess("");
  };

  // Handle payment / Ödənişi idarə et
  const handlePaymentComplete = async (paymentData: {
    paymentMethod: "CASH" | "CARD" | "MIXED";
    cashAmount?: number;
    cardAmount?: number;
    totalAmount: number;
  }) => {
    if (cartItems.length === 0) {
      setError(t('emptyCart') || "Cart is empty / Səbət boşdur");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/seller/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
          ...paymentData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('paymentFailed') || "Payment failed / Ödəniş uğursuz oldu");
      }

      setSuccess(t('paymentSuccess') || "Payment successful! / Ödəniş uğurlu oldu!");
      setLastOrderId(data.order?.id || "");
      setCartItems([]);

      // Clear success message after 3 seconds / 3 saniyədən sonra uğur mesajını təmizlə
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      setError(error.message || t('paymentError') || "Error processing payment / Ödəniş emalı xətası");
    } finally {
      setIsProcessing(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/seller/dashboard")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back') || "Back / Geri"}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title') || "POS / Kassa"}
          </h1>
          <p className="text-gray-600">
            {t('description') || "Point of Sale system / Satış Nöqtəsi sistemi"}
          </p>
        </div>

        {/* Error and Success Messages / Xəta və Uğur Mesajları */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error') || "Error / Xəta"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{t('success') || "Success / Uğur"}</AlertTitle>
            <AlertDescription>
              {success}
              {lastOrderId && (
                <Button
                  onClick={() => router.push(`/seller/orders/${lastOrderId}`)}
                  variant="link"
                  className="ml-2"
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  {t('viewReceipt') || "View Receipt / Çekə Bax"}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main POS Interface / Əsas Kassa İnterfeysi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search / Məhsul Axtarışı */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('searchProducts') || "Search Products / Məhsulları Axtar"}</CardTitle>
              </CardHeader>
              <CardContent>
                <POSProductSearch
                  onProductSelect={handleProductSelect}
                  onBarcodeScanned={(barcode) => {
                    // Barcode scanning is handled in POSProductSearch
                    // Barkod skan etmə POSProductSearch-də idarə olunur
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Cart and Payment / Səbət və Ödəniş */}
          <div className="space-y-6">
            <POSCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
            />
            {cartItems.length > 0 && (
              <POSPayment
                total={total}
                onPaymentComplete={handlePaymentComplete}
                isLoading={isProcessing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

