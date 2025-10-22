/**
 * Order Card Component / Sifariş Kartı Komponenti
 * This component displays a single order in card format
 * Bu komponent tək sifarişi kart formatında göstərir
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Package, 
  Truck, 
  User, 
  Calendar,
  MapPin,
  Eye,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    customer?: {
      name: string;
      email: string;
    };
    seller?: {
      name: string;
      email: string;
    };
    courier?: {
      name: string;
      email: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        id: string;
        name: string;
        images: string;
      };
    }>;
  };
  userRole?: string;
  onStatusUpdate?: (orderId: string, status: string) => void;
  onAssignCourier?: (orderId: string) => void;
}

export function OrderCard({ 
  order, 
  userRole = "CUSTOMER",
  onStatusUpdate,
  onAssignCourier 
}: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Get status color and icon / Status rəngi və ikonunu əldə et
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          label: "Pending / Gözləyir"
        };
      case "CONFIRMED":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: CheckCircle,
          label: "Confirmed / Təsdiqləndi"
        };
      case "SHIPPED":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: Truck,
          label: "Shipped / Göndərildi"
        };
      case "DELIVERED":
        return {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          label: "Delivered / Çatdırıldı"
        };
      case "CANCELLED":
        return {
          color: "bg-red-100 text-red-800",
          icon: XCircle,
          label: "Cancelled / Ləğv edildi"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          label: status
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  // Get available status updates based on user role / İstifadəçi roluna əsasən mövcud status yeniləmələrini əldə et
  const getAvailableStatuses = () => {
    switch (userRole) {
      case "ADMIN":
        return ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
      case "SELLER":
        return ["CONFIRMED", "SHIPPED", "CANCELLED"];
      case "COURIER":
        return ["SHIPPED", "DELIVERED"];
      case "CUSTOMER":
        return order.status === "PENDING" ? ["CANCELLED"] : [];
      default:
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses();

  const handleStatusUpdate = async (newStatus: string) => {
    if (onStatusUpdate) {
      setIsUpdating(true);
      try {
        await onStatusUpdate(order.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Order #{order.id.slice(-8).toUpperCase()}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            
            <Link href={`/orders/${order.id}`}>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items / Sifariş Elementləri */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Items / Elementlər</h4>
          <div className="space-y-2">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={item.product.images || "/placeholder-product.jpg"}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded-md"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-sm text-gray-500">
                +{order.items.length - 3} more items / daha çox element
              </p>
            )}
          </div>
        </div>

        {/* Order Info / Sifariş Məlumatı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {order.customer && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Customer / Müştəri</p>
                <p className="text-gray-600">{order.customer.name}</p>
              </div>
            </div>
          )}
          
          {order.seller && (
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Seller / Satıcı</p>
                <p className="text-gray-600">{order.seller.name}</p>
              </div>
            </div>
          )}
          
          {order.courier && (
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Courier / Kuryer</p>
                <p className="text-gray-600">{order.courier.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Total Amount / Cəmi Məbləğ */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-lg font-semibold text-gray-900">
            Total / Cəmi
          </span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Action Buttons / Əməliyyat Düymələri */}
        {(availableStatuses.length > 0 || onAssignCourier) && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {availableStatuses.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(status)}
                disabled={isUpdating || order.status === status}
                className="text-xs"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                ) : null}
                {status === "CONFIRMED" && "Confirm / Təsdiqlə"}
                {status === "SHIPPED" && "Ship / Göndər"}
                {status === "DELIVERED" && "Deliver / Çatdır"}
                {status === "CANCELLED" && "Cancel / Ləğv Et"}
              </Button>
            ))}
            
            {onAssignCourier && userRole === "ADMIN" && !order.courier && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignCourier(order.id)}
                className="text-xs"
              >
                <Truck className="h-3 w-3 mr-1" />
                Assign Courier / Kuryer Təyin Et
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
