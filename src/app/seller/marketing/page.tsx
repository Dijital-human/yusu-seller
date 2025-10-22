"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import {
  Target,
  Mail,
  MessageSquare,
  TrendingUp,
  Users,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  BarChart3,
  Filter,
  Search
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  audience: number;
  sent: number;
  opened: number;
  clicked: number;
  conversion: number;
  revenue: number;
  createdAt: string;
}

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  usage: number;
  limit: number;
  expiresAt: string;
  isActive: boolean;
}

export default function SellerMarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);

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

  // Load marketing data / Marketinq məlumatlarını yüklə
  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      setIsLoading(true);
      
      // For testing purposes, use mock data
      // Test məqsədləri üçün mock məlumat istifadə et
      const mockCampaigns: Campaign[] = [
        {
          id: "1",
          name: "Summer Sale Campaign",
          type: "Email",
          status: "Active",
          audience: 5000,
          sent: 4800,
          opened: 1200,
          clicked: 240,
          conversion: 48,
          revenue: 2400,
          createdAt: "2024-01-15",
        },
        {
          id: "2",
          name: "New Product Launch",
          type: "SMS",
          status: "Completed",
          audience: 2000,
          sent: 2000,
          opened: 800,
          clicked: 160,
          conversion: 32,
          revenue: 1600,
          createdAt: "2024-01-10",
        },
        {
          id: "3",
          name: "Holiday Promotion",
          type: "Email",
          status: "Draft",
          audience: 0,
          sent: 0,
          opened: 0,
          clicked: 0,
          conversion: 0,
          revenue: 0,
          createdAt: "2024-01-20",
        },
      ];

      const mockDiscountCodes: DiscountCode[] = [
        {
          id: "1",
          code: "SUMMER20",
          type: "Percentage",
          value: 20,
          usage: 45,
          limit: 100,
          expiresAt: "2024-02-15",
          isActive: true,
        },
        {
          id: "2",
          code: "WELCOME10",
          type: "Fixed",
          value: 10,
          usage: 23,
          limit: 50,
          expiresAt: "2024-03-01",
          isActive: true,
        },
        {
          id: "3",
          code: "FLASH30",
          type: "Percentage",
          value: 30,
          usage: 100,
          limit: 100,
          expiresAt: "2024-01-31",
          isActive: false,
        },
      ];

      setCampaigns(mockCampaigns);
      setDiscountCodes(mockDiscountCodes);
    } catch (error) {
      console.error("Error loading marketing data:", error);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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
                Marketing / Marketinq
              </h1>
              <p className="text-gray-600">
                Create and manage marketing campaigns and discount codes.
                / Marketinq kampaniyaları və endirim kodları yaradın və idarə edin.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setShowCreateCampaign(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDiscount(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Discount
              </Button>
            </div>
          </div>
        </div>

        {/* Marketing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns / Aktiv Kampaniyalar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.filter(c => c.status === "Active").length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Audience / Ümumi Auditoriya</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.reduce((sum, c) => sum + c.audience, 0).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue / Ümumi Gəlir</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${campaigns.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Discounts / Aktiv Endirimlər</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {discountCodes.filter(d => d.isActive).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns / Son Kampaniyalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === "Active" ? "bg-green-100 text-green-800" :
                        campaign.status === "Completed" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p>Audience: {campaign.audience.toLocaleString()}</p>
                        <p>Sent: {campaign.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p>Opened: {campaign.opened.toLocaleString()}</p>
                        <p>Revenue: ${campaign.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Discount Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Discount Codes / Endirim Kodları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discountCodes.map((code) => (
                  <div key={code.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{code.code}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        code.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Type: {code.type} - {code.value}{code.type === "Percentage" ? "%" : "$"}</p>
                      <p>Usage: {code.usage}/{code.limit}</p>
                      <p>Expires: {new Date(code.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Campaign Modal */}
        {showCreateCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Campaign / Yeni Kampaniya Yarat</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name / Kampaniya Adı</Label>
                  <Input id="campaign-name" placeholder="Enter campaign name" />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Campaign Type / Kampaniya Tipi</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="campaign-audience">Target Audience / Hədəf Auditoriya</Label>
                  <Input id="campaign-audience" type="number" placeholder="Enter audience size" />
                </div>
                <div>
                  <Label htmlFor="campaign-message">Message / Mesaj</Label>
                  <Textarea id="campaign-message" placeholder="Enter your message" />
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-6">
                <Button onClick={() => setShowCreateCampaign(false)}>
                  Create Campaign
                </Button>
                <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Discount Modal */}
        {showCreateDiscount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Discount Code / Yeni Endirim Kodu Yarat</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="discount-code">Discount Code / Endirim Kodu</Label>
                  <Input id="discount-code" placeholder="Enter discount code" />
                </div>
                <div>
                  <Label htmlFor="discount-type">Discount Type / Endirim Tipi</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage / Faiz</SelectItem>
                      <SelectItem value="fixed">Fixed Amount / Sabit Məbləğ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount-value">Discount Value / Endirim Dəyəri</Label>
                  <Input id="discount-value" type="number" placeholder="Enter discount value" />
                </div>
                <div>
                  <Label htmlFor="discount-limit">Usage Limit / İstifadə Limiti</Label>
                  <Input id="discount-limit" type="number" placeholder="Enter usage limit" />
                </div>
                <div>
                  <Label htmlFor="discount-expiry">Expiry Date / Bitmə Tarixi</Label>
                  <Input id="discount-expiry" type="date" />
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-6">
                <Button onClick={() => setShowCreateDiscount(false)}>
                  Create Discount
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDiscount(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}