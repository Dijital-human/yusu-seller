/**
 * Customer Analytics Page / Müştəri Analitikası Səhifəsi
 * Advanced customer analytics for sellers
 * Satıcılar üçün ətraflı müştəri analitikası
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Users, 
  UserPlus, 
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Star,
  Clock,
  MapPin,
  Mail,
  Phone,
  Eye,
  Filter,
  Search,
  BarChart3,
  Target,
  Heart,
  Gift,
  Calendar
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | Date;
  customerSince: string | Date;
  status: 'active' | 'inactive' | 'vip';
  satisfaction?: number;
  preferredCategory?: string;
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  averageOrderValue: number;
  customerRetention: number;
  topSpendingCustomer: string;
  averageSatisfaction: number;
}

export default function CustomerAnalyticsPage() {
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadCustomerData();
  }, [searchTerm, filterStatus]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters / Sorğu parametrlərini qur
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      // Fetch customers from API / API-dən müştəriləri al
      const response = await fetch(`/api/seller/customers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers / Müştəriləri almaq uğursuz oldu');
      }

      const data = await response.json();
      
      if (data.success) {
        // Map API data to Customer interface / API məlumatlarını Customer interface-ə map et
        const mappedCustomers: Customer[] = (data.customers || []).map((c: any) => {
          // Determine VIP status based on total spent / Ümumi xərclənmiş məbləğə əsasən VIP statusunu təyin et
          const isVip = c.totalSpent > 1000;
          const isActive = c.status === 'active';
          
          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            totalOrders: c.totalOrders,
            totalSpent: c.totalSpent,
            averageOrderValue: c.averageOrderValue,
            lastOrderDate: c.lastOrderDate,
            customerSince: c.customerSince,
            status: isVip ? 'vip' : (isActive ? 'active' : 'inactive'),
          };
        });

        setCustomers(mappedCustomers);

        // Set metrics from API / API-dən metrikaları təyin et
        if (data.metrics) {
          const activeCustomers = mappedCustomers.filter(c => c.status === 'active' || c.status === 'vip').length;
          const vipCustomers = mappedCustomers.filter(c => c.status === 'vip').length;
          
          setMetrics({
            totalCustomers: data.metrics.totalCustomers || 0,
            newCustomers: 0, // Would need date filtering / Tarix filtri lazımdır
            activeCustomers,
            vipCustomers,
            averageOrderValue: data.metrics.averageOrderValue || 0,
            customerRetention: 0, // Would need calculation / Hesablama lazımdır
            topSpendingCustomer: mappedCustomers.length > 0 ? mappedCustomers[0].name : '',
            averageSatisfaction: 0, // Would need rating system / Reytinq sistemi lazımdır
          });
        } else {
          // Fallback metrics / Fallback metrikalar
          setMetrics({
            totalCustomers: mappedCustomers.length,
            newCustomers: 0,
            activeCustomers: mappedCustomers.filter(c => c.status === 'active' || c.status === 'vip').length,
            vipCustomers: mappedCustomers.filter(c => c.status === 'vip').length,
            averageOrderValue: mappedCustomers.length > 0 
              ? mappedCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / mappedCustomers.length 
              : 0,
            customerRetention: 0,
            topSpendingCustomer: mappedCustomers.length > 0 ? mappedCustomers[0].name : '',
            averageSatisfaction: 0,
          });
        }
      } else {
        throw new Error(data.error || 'Unknown error / Naməlum xəta');
      }
    } catch (error) {
      console.error("Customer analytics load error:", error);
      // Set empty state on error / Xəta olduqda boş vəziyyət təyin et
      setCustomers([]);
      setMetrics({
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0,
        vipCustomers: 0,
        averageOrderValue: 0,
        customerRetention: 0,
        topSpendingCustomer: '',
        averageSatisfaction: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return <Star className="h-4 w-4 text-purple-500" />;
      case 'active': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('exportReport')}
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            {t('createCampaign')}
          </Button>
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalCustomers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.newCustomers} {t('newThisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('activeCustomers')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.customerRetention}% {t('retention')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('vipCustomers')}
            </CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics?.vipCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {t('highValueCustomers')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('averageOrderValue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              {t('perCustomerOrder')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchCustomers')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{t('allCustomers')}</option>
                <option value="vip">{t('vipCustomers')}</option>
                <option value="active">{tCommon('active')}</option>
                <option value="inactive">{tCommon('inactive')}</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {t('filter')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('customerList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(customer.status)}>
                      {getStatusIcon(customer.status)}
                      <span className="ml-1">{customer.status.toUpperCase()}</span>
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t('totalOrders')}</p>
                    <p className="font-semibold">{customer.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('totalSpent')}</p>
                    <p className="font-semibold">${customer.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('avgOrder')}</p>
                    <p className="font-semibold">${customer.averageOrderValue}</p>
                  </div>
                  {customer.satisfaction && (
                    <div>
                      <p className="text-gray-600">{t('satisfaction')}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="font-semibold">{customer.satisfaction}</span>
                      </div>
                    </div>
                  )}
                  {customer.location && (
                    <div>
                      <p className="text-gray-600">{t('location')}</p>
                      <p className="font-semibold">{customer.location}</p>
                    </div>
                  )}
                  {customer.preferredCategory && (
                    <div>
                      <p className="text-gray-600">{t('preferred')}</p>
                      <p className="font-semibold">{customer.preferredCategory}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>{t('customerSince')} {new Date(customer.customerSince).toLocaleDateString()}</span>
                    <span>{t('lastOrder')} {new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Mail className="h-3 w-3 mr-1" />
                      {t('email')}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-3 w-3 mr-1" />
                      {t('call')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
