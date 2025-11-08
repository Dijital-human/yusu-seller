/**
 * User Seller Details Page / İstifadəçi Satıcı Detalları Səhifəsi
 * This page displays user seller details and activity logs
 * Bu səhifə istifadəçi satıcı detallarını və hərəkət qeydlərini göstərir
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Activity,
  ShoppingCart,
  Package,
  Warehouse,
  Scan,
  BarChart,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { AvatarDisplay } from "@/components/avatar/AvatarDisplay";
import { AvatarUpload } from "@/components/avatar/AvatarUpload";
import { getPermissionConfig, permissionConfigs } from "@/lib/permission-helpers";

interface UserSellerDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  permissions: {
    viewPurchasePrice?: boolean;
    publishProducts?: boolean;
    unpublishProducts?: boolean;
    manageWarehouse?: boolean;
    useBarcode?: boolean;
    usePOS?: boolean;
    manageOrders?: boolean;
    viewAnalytics?: boolean;
    manageMarketing?: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
}

interface ActivityLog {
  id: string;
  type: 'order' | 'product' | 'warehouse' | 'pos';
  action: string;
  details: string;
  date: string;
}

export default function UserSellerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const t = useTranslations('userSellers');
  const tCommon = useTranslations('common');
  
  const [userSeller, setUserSeller] = useState<UserSellerDetails | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  useEffect(() => {
    loadUserSellerDetails();
    loadActivityLogs();
  }, [userId]);

  const loadUserSellerDetails = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch(`/api/seller/user-sellers/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load user seller details / İstifadəçi satıcı detallarını yükləmək uğursuz oldu");
      }

      setUserSeller(data.userSeller);
      setStatistics(data.statistics);
    } catch (error: any) {
      console.error("Error loading user seller details:", error);
      setError(error.message || "Failed to load user seller details / İstifadəçi satıcı detallarını yükləmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const response = await fetch(`/api/seller/user-sellers/${userId}/activity`);
      const data = await response.json();

      if (response.ok && data.activities) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return ShoppingCart;
      case 'product':
        return Package;
      case 'warehouse':
        return Warehouse;
      case 'pos':
        return Scan;
      default:
        return Activity;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && !userSeller) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container-responsive">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !userSeller) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container-responsive">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/seller/user-sellers')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!userSeller) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container-responsive">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/seller/user-sellers")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('userDetails')}
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Details Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('userDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <AvatarDisplay
                  avatar={userSeller.avatar}
                  name={userSeller.name}
                  size="lg"
                />
              </div>

              {/* Avatar Upload (for user seller themselves) */}
              {/* Avatar Yükləmə (istifadəçi satıcının özü üçün) */}
              <div>
                <AvatarUpload
                  currentAvatar={userSeller.avatar}
                  userId={userId}
                  onUploadSuccess={(imageUrl) => {
                    setUserSeller({ ...userSeller, avatar: imageUrl });
                  }}
                  onRemoveSuccess={() => {
                    setUserSeller({ ...userSeller, avatar: null });
                  }}
                />
              </div>

              {/* User Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('name')}</p>
                  <p className="text-gray-900">{userSeller.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('email')}</p>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="h-4 w-4" />
                    {userSeller.email}
                  </div>
                </div>
                {userSeller.phone && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">{t('phone')}</p>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="h-4 w-4" />
                      {userSeller.phone}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('status')}</p>
                  <Badge className={userSeller.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {userSeller.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('createdAt')}</p>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4" />
                    {formatDate(userSeller.createdAt)}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('permissions')}</p>
                <div className="space-y-2">
                  {permissionConfigs.map((config) => {
                    const value = userSeller.permissions[config.key as keyof typeof userSeller.permissions];
                    if (value === undefined) return null;
                    
                    const Icon = config.icon;
                    const isActive = value === true;
                    
                    return (
                      <div key={config.key} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-700">
                            {t(config.labelKey) || config.key}
                          </span>
                        </div>
                        {isActive && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics and Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('activity')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'details' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('details')}
                  >
                    {t('userDetails')}
                  </Button>
                  <Button
                    variant={activeTab === 'activity' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('activity')}
                  >
                    {t('activityLog')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'details' && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-700">{t('totalOrders')}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-gray-700">{t('totalProducts')}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalProducts}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-700">{t('totalRevenue')}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${statistics.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">{t('noActivity')}</p>
                    </div>
                  ) : (
                    activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(activity.date)}</span>
                              <span>•</span>
                              <span>{formatTime(activity.date)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

