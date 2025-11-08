/**
 * Revenue Optimization Page / Gəlir Optimallaşdırması Səhifəsi
 * Advanced revenue optimization tools for sellers
 * Satıcılar üçün ətraflı gəlir optimallaşdırma alətləri
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Lightbulb,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Star,
  Users,
  ShoppingCart,
  Package
} from "lucide-react";

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  conversionRate: number;
  customerLifetimeValue: number;
  profitMargin: number;
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  titleAz: string;
  description: string;
  descriptionAz: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  potentialIncrease: number;
  category: 'pricing' | 'marketing' | 'inventory' | 'customer';
}

export default function RevenueOptimizationPage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      // Mock revenue data / Mock gəlir məlumatları
      const mockRevenueData: RevenueData = {
        totalRevenue: 125000,
        monthlyRevenue: 15000,
        dailyRevenue: 500,
        revenueGrowth: 12.5,
        averageOrderValue: 145.50,
        conversionRate: 3.2,
        customerLifetimeValue: 450,
        profitMargin: 25.8
      };

      const mockSuggestions: OptimizationSuggestion[] = [
        {
          id: '1',
          title: 'Dynamic Pricing Strategy',
          titleAz: 'Dinamik Qiymətləndirmə Strategiyası',
          description: 'Implement time-based pricing for high-demand products',
          descriptionAz: 'Yüksək tələb olunan məhsullar üçün vaxt əsaslı qiymətləndirmə tətbiq et',
          impact: 'high',
          effort: 'medium',
          potentialIncrease: 15,
          category: 'pricing'
        },
        {
          id: '2',
          title: 'Upselling Campaign',
          titleAz: 'Satış Artırma Kampaniyası',
          description: 'Create targeted upselling campaigns for existing customers',
          descriptionAz: 'Mövcud müştərilər üçün hədəfli satış artırma kampaniyaları yarat',
          impact: 'medium',
          effort: 'easy',
          potentialIncrease: 8,
          category: 'marketing'
        },
        {
          id: '3',
          title: 'Inventory Optimization',
          titleAz: 'Anbar Optimallaşdırması',
          description: 'Optimize stock levels to reduce holding costs',
          descriptionAz: 'Saxlama xərclərini azaltmaq üçün stok səviyyələrini optimallaşdır',
          impact: 'medium',
          effort: 'hard',
          potentialIncrease: 12,
          category: 'inventory'
        },
        {
          id: '4',
          title: 'Customer Retention Program',
          titleAz: 'Müştəri Qorunması Proqramı',
          description: 'Implement loyalty program to increase repeat purchases',
          descriptionAz: 'Təkrar alışları artırmaq üçün sədaqət proqramı tətbiq et',
          impact: 'high',
          effort: 'medium',
          potentialIncrease: 20,
          category: 'customer'
        }
      ];

      setRevenueData(mockRevenueData);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error("Revenue optimization load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return <Calculator className="h-4 w-4" />;
      case 'marketing': return <Target className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Revenue Optimization / Gəlir Optimallaşdırması
          </h1>
          <p className="text-gray-600 mt-2">
            Optimize your revenue with data-driven insights / Məlumat əsaslı məlumatlarla gəlirinizi optimallaşdır
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report / Hesabat İxrac Et
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data / Məlumatları Yenilə
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue / Ümumi Gəlir
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData?.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+{revenueData?.revenueGrowth}%</span>
              <span className="ml-1">from last month / keçən aydan</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue / Aylıq Gəlir
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData?.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month / Bu ay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value / Orta Sifariş Dəyəri
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData?.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              Per order / Sifariş üzrə
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profit Margin / Mənfəət Marjası
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{revenueData?.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">
              Net profit margin / Xalis mənfəət marjası
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Key Performance Indicators / Əsas Performans Göstəriciləri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate / Çevrilmə Faizi</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{revenueData?.conversionRate}%</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Lifetime Value / Müştəri Həyat Dəyəri</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">${revenueData?.customerLifetimeValue}</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Revenue / Günlük Gəlir</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">${revenueData?.dailyRevenue}</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Breakdown / Gəlir Bölgüsü
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Product Sales / Məhsul Satışları</span>
                <span className="font-semibold">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Services / Xidmətlər</span>
                <span className="font-semibold">15%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subscriptions / Abunəliklər</span>
                <span className="font-semibold">10%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Revenue Optimization Suggestions / Gəlir Optimallaşdırma Tövsiyələri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{suggestion.title}</h3>
                      <p className="text-sm text-gray-600">{suggestion.titleAz}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getImpactColor(suggestion.impact)}>
                      {suggestion.impact} impact
                    </Badge>
                    <Badge className={getEffortColor(suggestion.effort)}>
                      {suggestion.effort} effort
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  {suggestion.description}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {suggestion.descriptionAz}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-green-600">
                        +{suggestion.potentialIncrease}% potential increase
                      </span>
                    </div>
                  </div>
                  <Button size="sm">
                    Implement / Tətbiq Et
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
