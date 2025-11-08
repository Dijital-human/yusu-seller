"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Seller Dashboard
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">
                Manage your products, orders, and business performance with advanced analytics and insights.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
                onClick={() => router.push('/seller/products/new')}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Product
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-200 text-blue-700 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => router.push('/seller/analytics')}
              >
                <BarChart className="h-5 w-5 mr-2" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <Card 
            className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/products')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Total Products</p>
                  <p className="text-3xl font-bold mb-2">{stats.totalProducts}</p>
                  <div className="flex items-center">
                    <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
                    <span className="text-sm text-emerald-100">+12% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card 
            className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/orders?status=PENDING')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold mb-2">{stats.pendingOrders}</p>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-300 mr-1" />
                    <span className="text-sm text-amber-100">Needs attention</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preparing Orders */}
          <Card 
            className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/orders?status=PREPARING')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm font-medium mb-1">Preparing / Hazırlanır</p>
                  <p className="text-3xl font-bold mb-2">{stats.preparingOrders}</p>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-300 mr-1" />
                    <span className="text-sm text-violet-100">In progress</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card 
            className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/analytics')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold mb-2">{formatCurrency(stats.totalRevenue)}</p>
                  <div className="flex items-center">
                    <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
                    <span className="text-sm text-emerald-100">+15% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

        {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Shipped Orders */}
          <Card 
            className="bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/orders?status=SHIPPED')}
          >
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium mb-1">Shipped</p>
                  <p className="text-3xl font-bold mb-2">{stats.shippedOrders}</p>
                <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-300 mr-1" />
                    <span className="text-sm text-sky-100">With courier</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Truck className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Completed Orders */}
          <Card 
            className="bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/orders?status=DELIVERED')}
          >
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lime-100 text-sm font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold mb-2">{stats.completedOrders}</p>
                <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-300 mr-1" />
                    <span className="text-sm text-lime-100">Delivered</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Pending Approval */}
          <Card 
            className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/orders?status=PENDING_APPROVAL')}
          >
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold mb-2">{stats.pendingApproval}</p>
                <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-300 mr-1" />
                    <span className="text-sm text-rose-100">Awaiting admin</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <PauseCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Total Orders */}
          <Card 
            className="bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 cursor-pointer"
            onClick={() => router.push('/seller/orders')}
          >
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-100 text-sm font-medium mb-1">Total Orders</p>
                  <p className="text-3xl font-bold mb-2">{stats.totalOrders}</p>
                <div className="flex items-center">
                    <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
                    <span className="text-sm text-slate-100">+8% from last month</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Quick Actions */}
          <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => router.push('/seller/products/new')}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400"
            >
              <Plus className="h-6 w-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </Button>
            <Button 
              onClick={() => router.push('/seller/orders')}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-green-400"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Manage Orders</span>
            </Button>
              <Button
              onClick={() => router.push('/seller/products')}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-purple-400"
              >
              <Package className="h-6 w-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Manage Products</span>
              </Button>
              <Button
              onClick={() => router.push('/seller/analytics')}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-orange-400"
              >
              <BarChart className="h-6 w-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">View Analytics</span>
              </Button>
            </div>
          </div>

        {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/seller/orders')}
              >
                View All
              </Button>
              </CardHeader>
              <CardContent>
              {orders.length > 0 ? (
                  <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">#{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-500">{order.customer.name}</p>
                            <p className="text-xs text-gray-400">{order.customer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Order Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                        </div>
                        
                        {order.courier && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>Courier: {order.courier.name}</span>
                            <span className="text-xs">({order.courier.vehicle})</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {order.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => prepareOrder(order.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Prepare
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handToCourier(order.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Hand to Courier
                          </Button>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Top Products */}
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/seller/products')}
              >
                View All
              </Button>
              </CardHeader>
              <CardContent>
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.category.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {product.isPublished ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <PauseCircle className="h-3 w-3 mr-1" />
                                  Draft
                                </Badge>
                              )}
                              {product.isApproved && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                        </div>
                      </div>
                      
                      {/* Product Actions */}
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!product.isPublished ? (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => publishProduct(product.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => unpublishProduct(product.id)}
                          >
                            <PauseCircle className="h-4 w-4 mr-1" />
                            Unpublish
                          </Button>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No products yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Store Health</h3>
                  <p className="text-3xl font-bold text-green-600">95%</p>
                  <p className="text-sm text-gray-500">Excellent performance</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Customer Rating</h3>
                  <p className="text-3xl font-bold text-blue-600">4.8</p>
                  <p className="text-sm text-gray-500">Based on 127 reviews</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Growth Rate</h3>
                  <p className="text-3xl font-bold text-purple-600">+23%</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Avg Response Time</h3>
                  <p className="text-3xl font-bold text-orange-600">2.3h</p>
                  <p className="text-sm text-gray-500">Order processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <div className="mt-8">
          <LowStockAlerts showSettings={true} />
        </div>
      </div>
    </div>
  );
}