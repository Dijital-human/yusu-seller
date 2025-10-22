"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  productsGrowth: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export default function SellerAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    customersGrowth: 0,
    productsGrowth: 0,
    monthlyRevenue: [],
    topProducts: [],
    ordersByStatus: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

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

  // Load analytics data / Analitika məlumatlarını yüklə
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // For testing purposes, use mock data
      // Test məqsədləri üçün mock məlumat istifadə et
      const mockData: AnalyticsData = {
        totalRevenue: 125000,
        totalOrders: 450,
        totalCustomers: 320,
        totalProducts: 25,
        revenueGrowth: 15.2,
        ordersGrowth: 8.5,
        customersGrowth: 12.3,
        productsGrowth: 5.7,
        monthlyRevenue: [
          { month: "Jan", revenue: 8500 },
          { month: "Feb", revenue: 9200 },
          { month: "Mar", revenue: 10800 },
          { month: "Apr", revenue: 12500 },
          { month: "May", revenue: 14200 },
          { month: "Jun", revenue: 15800 },
        ],
        topProducts: [
          { id: "1", name: "iPhone 15 Pro", sales: 45, revenue: 45000 },
          { id: "2", name: "Samsung Galaxy S24", sales: 32, revenue: 32000 },
          { id: "3", name: "MacBook Pro M3", sales: 18, revenue: 36000 },
          { id: "4", name: "iPad Air", sales: 25, revenue: 15000 },
        ],
        ordersByStatus: [
          { status: "PENDING", count: 12 },
          { status: "CONFIRMED", count: 8 },
          { status: "SHIPPED", count: 15 },
          { status: "DELIVERED", count: 420 },
          { status: "CANCELLED", count: 5 },
        ],
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics / Analitika
              </h1>
              <p className="text-gray-600">
                Track your business performance and make data-driven decisions.
                / Biznes performansınızı izləyin və məlumat əsaslı qərarlar qəbul edin.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days / Son 7 gün</option>
                <option value="30d">Last 30 days / Son 30 gün</option>
                <option value="90d">Last 90 days / Son 90 gün</option>
                <option value="1y">Last year / Son il</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue / Ümumi Gəlir</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    {analytics.revenueGrowth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${analytics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders / Ümumi Sifarişlər</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
                  <div className="flex items-center mt-1">
                    {analytics.ordersGrowth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${analytics.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.ordersGrowth > 0 ? '+' : ''}{analytics.ordersGrowth}%
                    </span>
                  </div>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers / Ümumi Müştərilər</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers}</p>
                  <div className="flex items-center mt-1">
                    {analytics.customersGrowth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${analytics.customersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.customersGrowth > 0 ? '+' : ''}{analytics.customersGrowth}%
                    </span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products / Ümumi Məhsullar</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
                  <div className="flex items-center mt-1">
                    {analytics.productsGrowth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${analytics.productsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.productsGrowth > 0 ? '+' : ''}{analytics.productsGrowth}%
                    </span>
                  </div>
                </div>
                <Package className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue / Aylıq Gəlir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analytics.monthlyRevenue.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-blue-500 rounded-t w-8 mb-2"
                      style={{ height: `${(item.revenue / Math.max(...analytics.monthlyRevenue.map(r => r.revenue))) * 200}px` }}
                    />
                    <span className="text-xs text-gray-600">{item.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status / Statusa görə Sifarişlər</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.ordersByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 capitalize">{item.status.toLowerCase()}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(item.count / Math.max(...analytics.ordersByStatus.map(s => s.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products / Ən Yaxşı Məhsullar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales / {product.sales} satış</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue / Gəlir</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}