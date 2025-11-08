"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

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
    orderCount?: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  period?: {
    startDate: string;
    endDate: string;
  };
}

export default function SellerAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useCustomRange, setUseCustomRange] = useState(false);

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
  }, [selectedPeriod, startDate, endDate, useCustomRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on selected period / Seçilmiş dövrə əsasən tarix aralığını hesabla
      let queryParams = "";
      if (useCustomRange && startDate && endDate) {
        queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      } else {
        const end = new Date();
        const start = new Date();
        
        switch (selectedPeriod) {
          case "7d":
            start.setDate(start.getDate() - 7);
            break;
          case "30d":
            start.setDate(start.getDate() - 30);
            break;
          case "90d":
            start.setDate(start.getDate() - 90);
            break;
          case "1y":
            start.setFullYear(start.getFullYear() - 1);
            break;
        }
        
        queryParams = `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }
      
      // Fetch real analytics data from API / API-dən real analitika məlumatlarını al
      const response = await fetch(`/api/seller/analytics${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load analytics / Analitika yükləmək uğursuz oldu");
      }

      // Format monthly revenue for display / Aylıq gəliri göstərmə üçün formatla
      const formattedMonthlyRevenue = data.monthlyRevenue.map((item: { month: string; revenue: number }) => {
        const date = new Date(item.month + '-01');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: monthNames[date.getMonth()] || item.month,
          revenue: item.revenue,
        };
      });

      setAnalytics({
        ...data,
        monthlyRevenue: formattedMonthlyRevenue,
      });
    } catch (error: any) {
      console.error("Error loading analytics / Analitika yükləmə xətası:", error);
      // Fallback to empty data on error / Xəta zamanı boş məlumatlara keç
      setAnalytics({
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
    } finally {
      setIsLoading(false);
    }
  };

  // Export to PDF / PDF-ə ixrac et
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title / Başlıq
    doc.setFontSize(18);
    doc.text("Analytics Report / Analitika Hesabatı", 14, 20);
    
    // Date range / Tarix aralığı
    doc.setFontSize(12);
    const periodText = useCustomRange && startDate && endDate
      ? `${startDate} - ${endDate}`
      : `Last ${selectedPeriod}`;
    doc.text(`Period / Dövr: ${periodText}`, 14, 30);
    
    let yPos = 40;
    
    // Key Metrics / Əsas Metrikalar
    doc.setFontSize(14);
    doc.text("Key Metrics / Əsas Metrikalar", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Revenue / Ümumi Gəlir: $${analytics.totalRevenue.toLocaleString()}`, 14, yPos);
    yPos += 7;
    doc.text(`Total Orders / Ümumi Sifarişlər: ${analytics.totalOrders}`, 14, yPos);
    yPos += 7;
    doc.text(`Total Customers / Ümumi Müştərilər: ${analytics.totalCustomers}`, 14, yPos);
    yPos += 7;
    doc.text(`Total Products / Ümumi Məhsullar: ${analytics.totalProducts}`, 14, yPos);
    yPos += 10;
    
    // Growth / Artım
    doc.setFontSize(14);
    doc.text("Growth / Artım", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Revenue Growth / Gəlir Artımı: ${analytics.revenueGrowth > 0 ? '+' : ''}${analytics.revenueGrowth}%`, 14, yPos);
    yPos += 7;
    doc.text(`Orders Growth / Sifariş Artımı: ${analytics.ordersGrowth > 0 ? '+' : ''}${analytics.ordersGrowth}%`, 14, yPos);
    yPos += 10;
    
    // Top Products / Ən Yaxşı Məhsullar
    if (analytics.topProducts.length > 0) {
      doc.setFontSize(14);
      doc.text("Top Products / Ən Yaxşı Məhsullar", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      analytics.topProducts.slice(0, 10).forEach((product, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${product.name} - Sales: ${product.sales}, Revenue: $${product.revenue.toLocaleString()}`, 14, yPos);
        yPos += 7;
      });
    }
    
    // Save PDF / PDF-i saxla
    doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export to Excel / Excel-ə ixrac et
  const handleExportExcel = () => {
    // Create workbook / Workbook yarat
    const wb = XLSX.utils.book_new();
    
    // Key Metrics Sheet / Əsas Metrikalar Vərəqi
    const metricsData = [
      ["Metric / Metrika", "Value / Dəyər", "Growth / Artım"],
      ["Total Revenue / Ümumi Gəlir", `$${analytics.totalRevenue.toLocaleString()}`, `${analytics.revenueGrowth > 0 ? '+' : ''}${analytics.revenueGrowth}%`],
      ["Total Orders / Ümumi Sifarişlər", analytics.totalOrders, `${analytics.ordersGrowth > 0 ? '+' : ''}${analytics.ordersGrowth}%`],
      ["Total Customers / Ümumi Müştərilər", analytics.totalCustomers, `${analytics.customersGrowth > 0 ? '+' : ''}${analytics.customersGrowth}%`],
      ["Total Products / Ümumi Məhsullar", analytics.totalProducts, `${analytics.productsGrowth > 0 ? '+' : ''}${analytics.productsGrowth}%`],
    ];
    const wsMetrics = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(wb, wsMetrics, "Key Metrics");
    
    // Monthly Revenue Sheet / Aylıq Gəlir Vərəqi
    if (analytics.monthlyRevenue.length > 0) {
      const revenueData = [
        ["Month / Ay", "Revenue / Gəlir"],
        ...analytics.monthlyRevenue.map(item => [item.month, item.revenue]),
      ];
      const wsRevenue = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, wsRevenue, "Monthly Revenue");
    }
    
    // Top Products Sheet / Ən Yaxşı Məhsullar Vərəqi
    if (analytics.topProducts.length > 0) {
      const productsData = [
        ["Rank / Reytinq", "Product Name / Məhsul Adı", "Sales / Satış", "Revenue / Gəlir"],
        ...analytics.topProducts.map((product, index) => [
          index + 1,
          product.name,
          product.sales,
          product.revenue,
        ]),
      ];
      const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(wb, wsProducts, "Top Products");
    }
    
    // Orders by Status Sheet / Statusa görə Sifarişlər Vərəqi
    if (analytics.ordersByStatus.length > 0) {
      const statusData = [
        ["Status / Status", "Count / Sayı"],
        ...analytics.ordersByStatus.map(item => [item.status, item.count]),
      ];
      const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
      XLSX.utils.book_append_sheet(wb, wsStatus, "Orders by Status");
    }
    
    // Save Excel file / Excel faylını saxla
    XLSX.writeFile(wb, `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container-responsive">
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
    <div className="min-h-screen bg-white py-8">
      <div className="container-responsive">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('title')}
              </h1>
              <p className="text-gray-600">
                {t('trackPerformance')} {t('makeDecisions')}
              </p>
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              {!useCustomRange ? (
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    setUseCustomRange(false);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">{t('last7Days')}</option>
                  <option value="30d">{t('last30Days')}</option>
                  <option value="90d">{t('last90Days')}</option>
                  <option value="1y">{t('lastYear')}</option>
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <div>
                    <Label htmlFor="startDate" className="text-xs">Start Date / Başlanğıc Tarixi</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-xs">End Date / Bitmə Tarixi</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseCustomRange(!useCustomRange)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {useCustomRange ? tCommon('cancel') || "Cancel / Ləğv Et" : "Custom Range / Xüsusi Aralıq"}
              </Button>
              <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExportPDF()}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExportExcel()}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics / Əsas Metrikalar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="card-modern border-l-4 border-l-green-500">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('totalRevenue')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">${analytics.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center">
                    {analytics.revenueGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs sm:text-sm ${analytics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern border-l-4 border-l-blue-500">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('totalOrders')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analytics.totalOrders}</p>
                  <div className="flex items-center">
                    {analytics.ordersGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs sm:text-sm ${analytics.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.ordersGrowth > 0 ? '+' : ''}{analytics.ordersGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern border-l-4 border-l-purple-500">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('totalCustomers')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analytics.totalCustomers}</p>
                  <div className="flex items-center">
                    {analytics.customersGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs sm:text-sm ${analytics.customersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.customersGrowth > 0 ? '+' : ''}{analytics.customersGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern border-l-4 border-l-orange-500">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{t('totalProducts')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{analytics.totalProducts}</p>
                  <div className="flex items-center">
                    {analytics.productsGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs sm:text-sm ${analytics.productsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.productsGrowth > 0 ? '+' : ''}{analytics.productsGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts / Qrafiklər */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Monthly Revenue Line Chart / Aylıq Gəlir Xətti Qrafiki */}
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('monthlyRevenue')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              {analytics.monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Revenue / Gəlir"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available / Məlumat yoxdur
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders by Status Pie Chart / Statusa görə Sifarişlər Pasta Qrafiki */}
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('ordersByStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              {analytics.ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.ordersByStatus.map((entry, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available / Məlumat yoxdur
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products Bar Chart / Ən Yaxşı Məhsullar Sütun Qrafiki */}
        {analytics.topProducts.length > 0 && (
          <Card className="card-modern mb-4 sm:mb-6 lg:mb-8">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('topProducts')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <ResponsiveContainer width="100%" height={400}>
                <RechartsBarChart data={analytics.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString()}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#3b82f6" name="Sales / Satış" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue / Gəlir" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Products List / Ən Yaxşı Məhsullar Siyahısı */}
        {analytics.topProducts.length > 0 && (
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg font-semibold">{t('topProducts')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="space-y-3 sm:space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg lg:rounded-xl hover:bg-gray-50 transition-colors card-modern">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales} {t('sales')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{t('revenue')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}