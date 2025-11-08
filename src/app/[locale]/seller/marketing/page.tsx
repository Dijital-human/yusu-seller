/**
 * Marketing Tools Page / Marketinq Alətləri Səhifəsi
 * Marketing tools and campaigns for sellers
 * Satıcılar üçün marketinq alətləri və kampaniyalar
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Target, 
  TrendingUp, 
  Users, 
  Megaphone,
  Calendar,
  DollarSign,
  Eye,
  MousePointerClick,
  Share2,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Zap,
  Gift,
  Tag,
  Mail,
  Smartphone
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'discount' | 'promotion';
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  reach: number;
  clicks: number;
  conversions: number;
  startDate: Date;
  endDate: Date;
}

interface MarketingMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalRevenue: number;
  roi: number;
  averageCtr: number;
}

export default function MarketingPage() {
  const t = useTranslations('marketing');
  const tCommon = useTranslations('common');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch discount codes, flash sales, promotions, and analytics from API
      // API-dən endirim kodları, flash sale-lər, promosiyalar və analitika məlumatlarını al
      const [discountCodesRes, flashSalesRes, promotionsRes, analyticsRes] = await Promise.all([
        fetch('/api/seller/marketing/discount-codes'),
        fetch('/api/seller/marketing/flash-sales'),
        fetch('/api/seller/marketing/promotions'),
        fetch('/api/seller/marketing/analytics'),
      ]);

      // Parse responses / Cavabları parse et
      const discountCodesData = discountCodesRes.ok ? await discountCodesRes.json() : { success: false };
      const flashSalesData = flashSalesRes.ok ? await flashSalesRes.json() : { success: false };
      const promotionsData = promotionsRes.ok ? await promotionsRes.json() : { success: false };
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : { success: false };

      // Combine all campaigns / Bütün kampaniyaları birləşdir
      const allCampaigns: Campaign[] = [];

      // Add discount codes as campaigns / Endirim kodlarını kampaniya kimi əlavə et
      if (discountCodesData.success && discountCodesData.discountCodes) {
        discountCodesData.discountCodes.forEach((code: any) => {
          const now = new Date();
          const startDate = new Date(code.startDate);
          const endDate = new Date(code.endDate);
          
          let status: 'active' | 'paused' | 'completed' | 'draft';
          if (!code.isActive) {
            status = 'paused';
          } else if (now < startDate) {
            status = 'draft';
          } else if (now > endDate) {
            status = 'completed';
          } else {
            status = 'active';
          }

          allCampaigns.push({
            id: code.id,
            name: `Discount Code: ${code.code}`,
            type: 'discount',
            status,
            budget: code.minPurchase || 0,
            spent: (code.usedCount || 0) * (code.minPurchase || 0),
            reach: code.usageLimit || 0,
            clicks: code.usedCount || 0,
            conversions: code.usedCount || 0,
            startDate,
            endDate,
          });
        });
      }

      // Add flash sales as campaigns / Flash sale-ləri kampaniya kimi əlavə et
      if (flashSalesData.success && flashSalesData.flashSales) {
        flashSalesData.flashSales.forEach((sale: any) => {
          const now = new Date();
          const startDate = new Date(sale.startDate);
          const endDate = new Date(sale.endDate);
          
          let status: 'active' | 'paused' | 'completed' | 'draft';
          if (!sale.isActive) {
            status = 'paused';
          } else if (now < startDate) {
            status = 'draft';
          } else if (now > endDate) {
            status = 'completed';
          } else {
            status = 'active';
          }

          const productPrice = Number(sale.product?.price || 0);
          const discountAmount = productPrice * (sale.discountPercentage / 100);
          
          allCampaigns.push({
            id: sale.id,
            name: `Flash Sale: ${sale.product?.name || 'Product'}`,
            type: 'promotion',
            status,
            budget: productPrice,
            spent: discountAmount,
            reach: 0, // Would need tracking / İzləmə lazımdır
            clicks: 0, // Would need tracking / İzləmə lazımdır
            conversions: 0, // Would need tracking / İzləmə lazımdır
            startDate,
            endDate,
          });
        });
      }

      // Add promotions as campaigns / Promosiyaları kampaniya kimi əlavə et
      if (promotionsData.success && promotionsData.promotions) {
        promotionsData.promotions.forEach((promo: any) => {
          const now = new Date();
          const startDate = new Date(promo.startDate);
          const endDate = new Date(promo.endDate);
          
          let status: 'active' | 'paused' | 'completed' | 'draft';
          if (!promo.isActive) {
            status = 'paused';
          } else if (now < startDate) {
            status = 'draft';
          } else if (now > endDate) {
            status = 'completed';
          } else {
            status = 'active';
          }

          allCampaigns.push({
            id: promo.id,
            name: promo.name,
            type: 'promotion',
            status,
            budget: promo.minPurchase || 0,
            spent: promo.discountValue || 0,
            reach: 0, // Would need tracking / İzləmə lazımdır
            clicks: 0, // Would need tracking / İzləmə lazımdır
            conversions: 0, // Would need tracking / İzləmə lazımdır
            startDate,
            endDate,
          });
        });
      }

      setCampaigns(allCampaigns);

      // Set metrics from analytics API / Analitika API-dən metrikaları təyin et
      if (analyticsData.success && analyticsData.metrics) {
        setMetrics({
          totalCampaigns: analyticsData.metrics.totalCampaigns || 0,
          activeCampaigns: analyticsData.metrics.activeCampaigns || 0,
          totalSpent: analyticsData.metrics.estimatedSpend || 0,
          totalRevenue: analyticsData.metrics.totalRevenue || 0,
          roi: analyticsData.metrics.roi || 0,
          averageCtr: analyticsData.metrics.conversionRate || 0,
        });
      } else {
        // Fallback metrics / Fallback metrikalar
        setMetrics({
          totalCampaigns: allCampaigns.length,
          activeCampaigns: allCampaigns.filter(c => c.status === 'active').length,
          totalSpent: allCampaigns.reduce((sum, c) => sum + c.spent, 0),
          totalRevenue: 0,
          roi: 0,
          averageCtr: 0,
        });
      }
    } catch (error) {
      console.error("Marketing load error:", error);
      // Set empty state on error / Xəta olduqda boş vəziyyət təyin et
      setCampaigns([]);
      setMetrics({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpent: 0,
        totalRevenue: 0,
        roi: 0,
        averageCtr: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      case 'discount': return <Tag className="h-4 w-4" />;
      case 'promotion': return <Gift className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-green-100 text-green-800';
      case 'discount': return 'bg-red-100 text-red-800';
      case 'promotion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
            {t('manageCampaigns')} {t('trackPerformance')}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('createCampaign')}
        </Button>
      </div>

      {/* Marketing Metrics / Marketinq Metrikaları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="card-modern border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              {t('totalCampaigns')}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics?.totalCampaigns}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.activeCampaigns} {t('active')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              {t('totalSpent')}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">${metrics?.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {t('marketingBudget')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              {t('roi')}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{metrics?.roi}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {t('returnOnInvestment')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              {t('averageCtr')}
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <MousePointerClick className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics?.averageCtr}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {t('clickThroughRate')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List / Kampaniyalar Siyahısı */}
      <Card className="card-modern">
        <CardHeader className="p-4 sm:p-5 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Megaphone className="h-5 w-5" />
            {t('activeCampaigns')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getCampaignTypeColor(campaign.type)}`}>
                      {getCampaignTypeIcon(campaign.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t('budget')}</p>
                    <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('spent')}</p>
                    <p className="font-semibold">${campaign.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('reach')}</p>
                    <p className="font-semibold">{campaign.reach.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('clicks')}</p>
                    <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('conversions')}</p>
                    <p className="font-semibold">{campaign.conversions}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('progress')}</span>
                    <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-modern cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('emailMarketing')}</h3>
                <p className="text-sm text-gray-600">{t('sendTargetedEmails')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('socialMedia')}</h3>
                <p className="text-sm text-gray-600">{t('manageSocialCampaigns')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('discounts')}</h3>
                <p className="text-sm text-gray-600">{t('createDiscountCodes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}