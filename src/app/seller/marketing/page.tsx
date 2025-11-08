/**
 * Marketing Tools Page / Marketinq Alətləri Səhifəsi
 * Marketing tools and campaigns for sellers
 * Satıcılar üçün marketinq alətləri və kampaniyalar
 */

"use client";

import { useState, useEffect } from "react";
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
  nameAz: string;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      // Mock marketing data / Mock marketinq məlumatları
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Summer Sale Campaign',
          nameAz: 'Yay Endirim Kampaniyası',
          type: 'discount',
          status: 'active',
          budget: 5000,
          spent: 3200,
          reach: 15000,
          clicks: 1200,
          conversions: 180,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-08-31')
        },
        {
          id: '2',
          name: 'New Product Launch',
          nameAz: 'Yeni Məhsul Təqdimatı',
          type: 'social',
          status: 'active',
          budget: 3000,
          spent: 1800,
          reach: 8000,
          clicks: 600,
          conversions: 90,
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-09-30')
        }
      ];

      const mockMetrics: MarketingMetrics = {
        totalCampaigns: 8,
        activeCampaigns: 3,
        totalSpent: 12500,
        totalRevenue: 45000,
        roi: 260,
        averageCtr: 3.2
      };

      setCampaigns(mockCampaigns);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Marketing load error:", error);
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
            Marketing Tools / Marketinq Alətləri
          </h1>
          <p className="text-gray-600 mt-2">
            Manage campaigns and track marketing performance / Kampaniyaları idarə et və marketinq performansını izlə
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign / Kampaniya Yarat
        </Button>
      </div>

      {/* Marketing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns / Ümumi Kampaniyalar
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeCampaigns} active / aktiv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spent / Ümumi Xərclənən
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Marketing budget / Marketinq büdcəsi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ROI / Qaytarma Faizi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.roi}%</div>
            <p className="text-xs text-muted-foreground">
              Return on investment / İnvestisiya qaytarma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average CTR / Orta CTR
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageCtr}%</div>
            <p className="text-xs text-muted-foreground">
              Click-through rate / Tıklama faizi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Active Campaigns / Aktiv Kampaniyalar
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <p className="text-sm text-gray-600">{campaign.nameAz}</p>
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
                    <p className="text-gray-600">Budget / Büdcə</p>
                    <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Spent / Xərclənən</p>
                    <p className="font-semibold">${campaign.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Reach / Çatdırılma</p>
                    <p className="font-semibold">{campaign.reach.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Clicks / Tıklamalar</p>
                    <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversions / Çevrilmələr</p>
                    <p className="font-semibold">{campaign.conversions}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress / Tərəqqi</span>
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Email Marketing / Email Marketinqi</h3>
                <p className="text-sm text-gray-600">Send targeted emails / Hədəfli email göndər</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Share2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Social Media / Sosial Media</h3>
                <p className="text-sm text-gray-600">Manage social campaigns / Sosial kampaniyaları idarə et</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Discounts / Endirimlər</h3>
                <p className="text-sm text-gray-600">Create discount codes / Endirim kodları yarat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}