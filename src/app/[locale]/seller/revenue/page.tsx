/**
 * Revenue Optimization Page / Gəlir Optimallaşdırması Səhifəsi
 * Advanced revenue optimization tools for sellers
 * Satıcılar üçün ətraflı gəlir optimallaşdırma alətləri
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
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
  breakdown?: {
    productSales: {
      amount: number;
      percentage: number;
    };
    services: {
      amount: number;
      percentage: number;
    };
    subscriptions: {
      amount: number;
      percentage: number;
    };
  };
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
  const t = useTranslations('revenue');
  const tCommon = useTranslations('common');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch revenue data and optimization suggestions from API
      // API-dən gəlir məlumatlarını və optimallaşdırması təkliflərini al
      const [revenueRes, optimizationRes] = await Promise.all([
        fetch('/api/seller/revenue'),
        fetch('/api/seller/revenue/optimization'),
      ]);

      // Parse revenue response / Gəlir cavabını parse et
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        if (revenueData.success && revenueData.revenue) {
          setRevenueData({
            totalRevenue: revenueData.revenue.totalRevenue || 0,
            monthlyRevenue: revenueData.revenue.monthlyRevenue || 0,
            dailyRevenue: revenueData.revenue.dailyRevenue || 0,
            revenueGrowth: revenueData.revenue.revenueGrowth || 0,
            averageOrderValue: revenueData.revenue.averageOrderValue || 0,
            conversionRate: revenueData.revenue.conversionRate || 0,
            customerLifetimeValue: revenueData.revenue.customerLifetimeValue || 0,
            profitMargin: revenueData.revenue.profitMargin || 0,
          });
        }
      }

      // Parse optimization suggestions response / Optimallaşdırması təklifləri cavabını parse et
      if (optimizationRes.ok) {
        const optimizationData = await optimizationRes.json();
        if (optimizationData.success && optimizationData.suggestions) {
          // Map API suggestions to UI format / API təkliflərini UI formatına map et
          const mappedSuggestions: OptimizationSuggestion[] = optimizationData.suggestions.map((s: any) => {
            // Map priority to impact / Prioriteti impact-ə map et
            let impact: 'high' | 'medium' | 'low' = 'medium';
            if (s.priority === 'high') impact = 'high';
            else if (s.priority === 'low') impact = 'low';

            // Determine category from title / Kategoriyanı başlıqdan təyin et
            let category: 'pricing' | 'marketing' | 'inventory' | 'customer' = 'marketing';
            if (s.id.includes('stock') || s.id.includes('inventory')) category = 'inventory';
            else if (s.id.includes('pricing') || s.id.includes('price')) category = 'pricing';
            else if (s.id.includes('customer') || s.id.includes('retention')) category = 'customer';

            // Extract potential increase from impact string / Impact string-dən potensial artımı çıxar
            const impactMatch = s.impact.match(/\$?([\d.]+)/);
            const potentialIncrease = impactMatch ? parseFloat(impactMatch[1]) : 0;

            return {
              id: s.id,
              title: s.title,
              titleAz: s.titleAz || s.title,
              description: s.description,
              descriptionAz: s.descriptionAz || s.description,
              impact,
              effort: 'medium' as const, // Default effort / Varsayılan səy
              potentialIncrease: Math.min(potentialIncrease, 50), // Cap at 50% / 50%-də məhdudlaşdır
              category,
            };
          });
          setSuggestions(mappedSuggestions);
        }
      }

      // Fallback to empty state if API fails / API uğursuz olarsa boş vəziyyətə keç
      if (!revenueRes.ok) {
        setRevenueData({
          totalRevenue: 0,
          monthlyRevenue: 0,
          dailyRevenue: 0,
          revenueGrowth: 0,
          averageOrderValue: 0,
          conversionRate: 0,
          customerLifetimeValue: 0,
          profitMargin: 0,
        });
      }

      if (!optimizationRes.ok) {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Revenue optimization load error:", error);
      // Set empty state on error / Xəta olduqda boş vəziyyət təyin et
      setRevenueData({
        totalRevenue: 0,
        monthlyRevenue: 0,
        dailyRevenue: 0,
        revenueGrowth: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        customerLifetimeValue: 0,
        profitMargin: 0,
      });
      setSuggestions([]);
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
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('exportReport')}
          </Button>
          <Button onClick={loadRevenueData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refreshData')}
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalRevenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData?.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+{revenueData?.revenueGrowth}%</span>
              <span className="ml-1">{t('fromLastMonth')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('monthlyRevenue')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData?.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('averageOrderValue')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData?.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              {t('perOrder')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('profitMargin')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{revenueData?.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">
              {t('netProfitMargin')}
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
              {t('keyPerformanceIndicators')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('conversionRate')}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{revenueData?.conversionRate}%</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('customerLifetimeValue')}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">${revenueData?.customerLifetimeValue}</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('dailyRevenue')}</span>
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
              {t('revenueBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('productSales')}</span>
                <span className="font-semibold">{revenueData?.breakdown?.productSales?.percentage.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${revenueData?.breakdown?.productSales?.percentage || 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('services')}</span>
                <span className="font-semibold">{revenueData?.breakdown?.services?.percentage.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${revenueData?.breakdown?.services?.percentage || 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('subscriptions')}</span>
                <span className="font-semibold">{revenueData?.breakdown?.subscriptions?.percentage.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${revenueData?.breakdown?.subscriptions?.percentage || 0}%` }}
                ></div>
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
            {t('optimizationSuggestions')}
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
