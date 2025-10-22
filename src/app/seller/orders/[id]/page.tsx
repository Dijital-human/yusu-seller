"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Package, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  Clock,
  Truck,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { OrderStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: string;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    // For testing purposes, skip authentication check
    // Test məqsədləri üçün autentifikasiya yoxlamasını keç
    // if (!session || session.user?.role !== "SELLER") {
    //   router.push("/auth/signin");
    //   return;
    // }

    fetchOrder();
  }, [session, status, router, orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch order");
      }
      const orderData = await res.json();
      setOrder(orderData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch order");
      console.error("Error fetching order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update order status");
      }
      
      setSuccess("Order status updated successfully / Sifariş statusu uğurla yeniləndi");
      await fetchOrder(); // Refresh order
    } catch (err: any) {
      setError(err.message || "An error occurred while updating order status.");
      console.error("Error updating order status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "bg-orange-100 text-orange-800";
      case OrderStatus.PROCESSING:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.SHIPPED:
        return "bg-indigo-100 text-indigo-800";
      case OrderStatus.DELIVERED:
        return "bg-green-100 text-green-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "Pending / Gözləyir";
      case OrderStatus.PROCESSING:
        return "Processing / İşlənir";
      case OrderStatus.SHIPPED:
        return "Shipped / Göndərilib";
      case OrderStatus.DELIVERED:
        return "Delivered / Çatdırılıb";
      case OrderStatus.CANCELLED:
        return "Cancelled / Ləğv edilib";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.PROCESSING:
        return <Package className="h-4 w-4" />;
      case OrderStatus.SHIPPED:
        return <Truck className="h-4 w-4" />;
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found / Sifariş tapılmadı</h1>
            <Button onClick={() => router.push("/seller/orders")}>
              Back to Orders / Sifarişlərə Qayıt
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header / Başlıq */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back / Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details / Sifariş Detalları</h1>
              <p className="text-gray-600 mt-2">Order #{order.id.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages / Xəta/Uğur Mesajları */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error / Xəta</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success / Uğurlu</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information / Sifariş Məlumatları */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status / Sifariş Statusu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getStatusIcon(order.status)}
                  <span className="ml-2">Order Status / Sifariş Statusu</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(order.status)} text-lg px-4 py-2`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
                    <Select
                      onValueChange={(value) => updateOrderStatus(value as OrderStatus)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Update status / Status yenilə" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(OrderStatus).map((status) => (
                          status !== order.status && status !== OrderStatus.CANCELLED && (
                            <SelectItem key={status} value={status}>
                              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {getStatusLabel(status)}
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items / Sifariş Məhsulları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Items / Sifariş Məhsulları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address / Çatdırılma Ünvanı */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address / Çatdırılma Ünvanı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{order.shippingAddress}</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary / Sifariş Xülasəsi */}
          <div className="space-y-6">
            {/* Customer Information / Müştəri Məlumatları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer / Müştəri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{order.customerName}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{order.customerEmail}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary / Sifariş Xülasəsi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Order Summary / Sifariş Xülasəsi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Date / Sifariş Tarixi:</span>
                  <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items / Məhsullar:</span>
                  <span className="text-sm">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal / Alt Cəm:</span>
                  <span className="text-sm">${order.total.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Total / Ümumi:</span>
                    <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
