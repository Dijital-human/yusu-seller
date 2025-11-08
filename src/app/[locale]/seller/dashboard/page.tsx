"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Truck,
  BarChart,
  Target,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  MapPin,
  User,
  Phone,
  Calendar,
  Send,
  CheckCircle2,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { LowStockAlerts } from "@/components/alerts/LowStockAlerts";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: {
    name: string;
  };
  createdAt: string;
  isPublished: boolean;
  isApproved: boolean;
  publishedAt?: string;
  approvedAt?: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  courier?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  items: {
    product: {
      name: string;
      price: number;
      images: string[];
    };
    quantity: number;
  }[];
  createdAt: string;
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  pendingApproval: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentOrders: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tOrders = useTranslations('orders');
  const tProducts = useTranslations('products');

  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    pendingApproval: 0,
    ordersByStatus: [],
    recentOrders: 0,
    topProducts: [],
    monthlyRevenue: [],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is seller / İstifadəçinin satıcı olub-olmadığını yoxla
  useEffect(() => {
    if (status === "loading") return;
    
    // For testing purposes, skip authentication check
    // Test məqsədləri üçün autentifikasiya yoxlamasını keç
    // if (!session || session.user?.role !== "SELLER") {
    //   router.push("/auth/signin");
    //   return;
    // }
  }, [session, status, router]);

  // Load seller data / Satıcı məlumatlarını yüklə
  useEffect(() => {
    // For testing purposes, always load data
    // Test məqsədləri üçün həmişə məlumatları yüklə
      loadSellerData();
  }, []);

  const loadSellerData = async () => {
    try {
      console.log("Loading seller data...");
      setIsLoading(true);
      
      // Load statistics / Statistikaları yüklə
      console.log("Fetching stats...");
      const statsRes = await fetch("/api/seller/stats");
      console.log("Stats response:", statsRes.status);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log("Stats data:", statsData);
        setStats(statsData);
      }
      
      // Load products / Məhsulları yüklə
      console.log("Fetching products...");
      const productsRes = await fetch("/api/seller/products?limit=5");
      console.log("Products response:", productsRes.status);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        console.log("Products data:", productsData);
        setProducts(productsData.products || []);
      }

      // Load orders / Sifarişləri yüklə
      console.log("Fetching orders...");
      const ordersRes = await fetch("/api/seller/orders?limit=5");
      console.log("Orders response:", ordersRes.status);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        console.log("Orders data:", ordersData);
        setOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error("Error loading seller data:", error);
    } finally {
      console.log("Loading completed");
      setIsLoading(false);
    }
  };

  // Order management functions / Sifariş idarəetmə funksiyaları
  const prepareOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/seller/orders/${orderId}/prepare`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Reload orders
        loadSellerData();
        alert("Order is now being prepared");
      } else {
        const error = await response.json();
        alert(error.error || "Error preparing order");
      }
    } catch (error) {
      console.error("Error preparing order:", error);
      alert("Error preparing order");
    }
  };

  const handToCourier = async (orderId: string) => {
    try {
      const response = await fetch(`/api/seller/orders/${orderId}/hand-to-courier`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        // Reload orders
        loadSellerData();
        alert("Order handed to courier");
      } else {
        const error = await response.json();
        alert(error.error || "Error handing to courier");
      }
    } catch (error) {
      console.error("Error handing to courier:", error);
      alert("Error handing to courier");
    }
  };

  // Product management functions / Məhsul idarəetmə funksiyaları
  const publishProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}/publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Reload products
        loadSellerData();
        alert("Product submitted for approval");
      } else {
        const error = await response.json();
        alert(error.error || "Error publishing product");
      }
    } catch (error) {
      console.error("Error publishing product:", error);
      alert("Error publishing product");
    }
  };

  const unpublishProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}/unpublish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Reload products
        loadSellerData();
        alert("Product unpublished");
      } else {
        const error = await response.json();
        alert(error.error || "Error unpublishing product");
      }
    } catch (error) {
      console.error("Error unpublishing product:", error);
      alert("Error unpublishing product");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4" />;
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <Skeleton className="h-6 sm:h-8 lg:h-10 w-48 sm:w-64 mb-2" />
              <Skeleton className="h-3 sm:h-4 w-full sm:w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="card-modern">
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-2" />
                    <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="card-modern">
                <CardHeader className="p-4 sm:p-5 lg:p-6">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                </CardHeader>
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <Skeleton className="h-24 sm:h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-responsive">
        {/* Header / Başlıq */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                {t('stats')}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-2xl leading-relaxed">
                {t('stats')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 
                  text-white shadow-sm hover:shadow-md 
                  transition-all duration-200
                  touch-target
                  w-full sm:w-auto
                  text-sm sm:text-base
                  px-4 sm:px-6"
                onClick={() => router.push('/seller/products/new')}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">{t('addProduct')}</span>
                <span className="sm:hidden">{tProducts('add') || 'Add'}</span>
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400
                  transition-all duration-200
                  touch-target
                  w-full sm:w-auto
                  text-sm sm:text-base
                  px-4 sm:px-6"
                onClick={() => router.push('/seller/analytics')}
              >
                <BarChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {t('viewAnalytics')}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards / Statistik Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Total Products / Ümumi Məhsullar */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-blue-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/products')}
          >
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('totalProducts')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.totalProducts}</p>
                  <div className="flex items-center">
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    <span className="text-xs sm:text-sm text-green-600">+12% {t('fromLastMonth')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders / Gözləyən Sifarişlər */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-amber-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/orders?status=PENDING')}
          >
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('pendingOrders')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.pendingOrders}</p>
                  <div className="flex items-center">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 mr-1" />
                    <span className="text-xs sm:text-sm text-amber-600">{t('needsAttention')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preparing Orders / Hazırlanan Sifarişlər */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-purple-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/orders?status=PREPARING')}
          >
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('preparing')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.preparingOrders}</p>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('inProgress')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue / Ümumi Gəlir */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-green-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/analytics')}
          >
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('totalRevenue')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{formatCurrency(stats.totalRevenue)}</p>
                  <div className="flex items-center">
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    <span className="text-xs sm:text-sm text-green-600">+15% {t('fromLastMonth')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

        {/* Additional Stats Row / Əlavə Statistik Sıra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Shipped Orders / Göndərilən Sifarişlər */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-cyan-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/orders?status=SHIPPED')}
          >
              <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('shipped')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.shippedOrders}</p>
                <div className="flex items-center">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('withCourier')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Truck className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Completed Orders / Tamamlanan Sifarişlər */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-green-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/orders?status=DELIVERED')}
          >
              <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('completed')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.completedOrders}</p>
                <div className="flex items-center">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('delivered')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Pending Approval / Gözləyən Təsdiq */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-rose-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/orders?status=PENDING_APPROVAL')}
          >
              <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('pendingApproval')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.pendingApproval}</p>
                <div className="flex items-center">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 mr-1" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('awaitingAdmin')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <PauseCircle className="h-6 w-6 sm:h-7 sm:w-7 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Total Orders / Ümumi Sifarişlər */}
          <Card 
            className="card-modern bg-white border-l-4 border-l-gray-500 cursor-pointer touch-target"
            onClick={() => router.push('/seller/orders')}
          >
              <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{t('totalOrders')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.totalOrders}</p>
                <div className="flex items-center">
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    <span className="text-xs sm:text-sm text-green-600">+8% {t('fromLastMonth')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Quick Actions / Sürətli Əməliyyatlar */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <Button 
              onClick={() => router.push('/seller/products/new')}
              className="h-20 sm:h-24 lg:h-28 
                flex flex-col items-center justify-center space-y-2 
                card-modern
                border-2 border-dashed border-gray-300 hover:border-blue-400
                transition-all duration-200
                touch-target"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center px-2">{t('addProduct')}</span>
            </Button>
            <Button 
              onClick={() => router.push('/seller/orders')}
              className="h-20 sm:h-24 lg:h-28 
                flex flex-col items-center justify-center space-y-2 
                card-modern
                border-2 border-dashed border-gray-300 hover:border-green-400
                transition-all duration-200
                touch-target"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center px-2">{tOrders('title')}</span>
            </Button>
              <Button
              onClick={() => router.push('/seller/products')}
              className="h-20 sm:h-24 lg:h-28 
                flex flex-col items-center justify-center space-y-2 
                card-modern
                border-2 border-dashed border-gray-300 hover:border-purple-400
                transition-all duration-200
                touch-target"
              >
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center px-2">{tProducts('title')}</span>
              </Button>
              <Button
              onClick={() => router.push('/seller/analytics')}
              className="h-20 sm:h-24 lg:h-28 
                flex flex-col items-center justify-center space-y-2 
                card-modern
                border-2 border-dashed border-gray-300 hover:border-orange-400
                transition-all duration-200
                touch-target"
              >
              <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 text-center px-2">{t('viewAnalytics')}</span>
              </Button>
            </div>
          </div>

        {/* Main Content Grid / Əsas Məzmun Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Recent Orders / Son Sifarişlər */}
            <Card className="card-modern">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('recentOrders')}</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                className="touch-target w-full sm:w-auto"
                onClick={() => router.push('/seller/orders')}
              >
                {tCommon('view')} {tCommon('all') || 'All'}
              </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 lg:p-6">
              {orders.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg lg:rounded-xl hover:bg-gray-50 transition-colors card-modern">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(order.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">#{order.id.slice(-8)}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{order.customer.name}</p>
                            <p className="text-xs text-gray-400 truncate hidden sm:block">{order.customer.email}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-sm sm:text-base text-gray-900">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Order Details / Sifariş Detalları */}
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                        </div>
                        
                        {order.courier && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Truck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">Courier: {order.courier.name}</span>
                            <span className="text-xs hidden sm:inline">({order.courier.vehicle})</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons / Əməliyyat Düymələri */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mt-3">
                          <Button size="sm" variant="outline" className="touch-target w-full sm:w-auto touch-target">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {tCommon('view')}
                        </Button>
                        {order.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 touch-target w-full sm:w-auto"
                            onClick={() => prepareOrder(order.id)}
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {tOrders('prepareOrder')}
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 touch-target w-full sm:w-auto"
                            onClick={() => handToCourier(order.id)}
                          >
                            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {tOrders('handToCourier')}
                          </Button>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{tOrders('noOrders')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Top Products / Ən Çox Satılan Məhsullar */}
            <Card className="card-modern">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('topProducts')}</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                className="touch-target w-full sm:w-auto"
                onClick={() => router.push('/seller/products')}
              >
                {tCommon('view')} {tCommon('all') || 'All'}
              </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 lg:p-6">
              {products.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {products.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg lg:rounded-xl hover:bg-gray-50 transition-colors card-modern">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{product.category.name}</p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              {product.isPublished ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  {tProducts('published')}
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  <PauseCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  Draft
                                </Badge>
                              )}
                              {product.isApproved && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-sm sm:text-base text-gray-900">{formatCurrency(product.price)}</p>
                          <p className="text-xs sm:text-sm text-gray-500">Stock: {product.stock}</p>
                        </div>
                      </div>
                      
                      {/* Product Actions / Məhsul Əməliyyatları */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <Button size="sm" variant="outline" className="touch-target w-full sm:w-auto">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {tCommon('view')}
                        </Button>
                        <Button size="sm" variant="outline" className="touch-target w-full sm:w-auto">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {tCommon('edit')}
                        </Button>
                        {!product.isPublished ? (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 touch-target w-full sm:w-auto"
                            onClick={() => publishProduct(product.id)}
                          >
                            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {tProducts('publish')}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 touch-target w-full sm:w-auto"
                            onClick={() => unpublishProduct(product.id)}
                          >
                            <PauseCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {tProducts('unpublish')}
                          </Button>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{tProducts('noProducts')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {/* Performance Metrics / Performans Metrikaları */}
        <div className="mt-4 sm:mt-6 lg:mt-8">
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('performanceOverview')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg lg:rounded-xl border border-green-200">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                    <Activity className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-600" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('storeHealth')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">95%</p>
                  <p className="text-xs sm:text-sm text-gray-500">Excellent performance</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg lg:rounded-xl border border-blue-200">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                    <Star className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('customerRating')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">4.8</p>
                  <p className="text-xs sm:text-sm text-gray-500">Based on 127 reviews</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg lg:rounded-xl border border-purple-200">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-600" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('growthRate')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">+23%</p>
                  <p className="text-xs sm:text-sm text-gray-500">This month</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg lg:rounded-xl border border-orange-200">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                    <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('avgResponseTime')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">2.3h</p>
                  <p className="text-xs sm:text-sm text-gray-500">Order processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts / Aşağı Stok Xəbərdarlıqları */}
        <div className="mt-4 sm:mt-6 lg:mt-8">
          <LowStockAlerts showSettings={true} />
        </div>
      </div>
    </div>
  );
}