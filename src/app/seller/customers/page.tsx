/**
 * Customer Analytics Page / Müştəri Analitikası Səhifəsi
 * Advanced customer analytics for sellers
 * Satıcılar üçün ətraflı müştəri analitikası
 */

"use client";

import { useState, useEffect } from "react";
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
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date;
  customerSince: Date;
  status: 'active' | 'inactive' | 'vip';
  satisfaction: number;
  preferredCategory: string;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      // Mock customer data / Mock müştəri məlumatları
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY',
          totalOrders: 15,
          totalSpent: 2500,
          averageOrderValue: 166.67,
          lastOrderDate: new Date('2024-01-10'),
          customerSince: new Date('2023-06-15'),
          status: 'vip',
          satisfaction: 4.8,
          preferredCategory: 'Electronics'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+1 (555) 987-6543',
          location: 'Los Angeles, CA',
          totalOrders: 8,
          totalSpent: 1200,
          averageOrderValue: 150,
          lastOrderDate: new Date('2024-01-08'),
          customerSince: new Date('2023-09-20'),
          status: 'active',
          satisfaction: 4.5,
          preferredCategory: 'Fashion'
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike.w@email.com',
          phone: '+1 (555) 456-7890',
          location: 'Chicago, IL',
          totalOrders: 3,
          totalSpent: 300,
          averageOrderValue: 100,
          lastOrderDate: new Date('2023-12-15'),
          customerSince: new Date('2023-11-01'),
          status: 'inactive',
          satisfaction: 4.2,
          preferredCategory: 'Home & Garden'
        }
      ];

      const mockMetrics: CustomerMetrics = {
        totalCustomers: 1250,
        newCustomers: 45,
        activeCustomers: 890,
        vipCustomers: 25,
        averageOrderValue: 145.50,
        customerRetention: 78.5,
        topSpendingCustomer: 'John Smith',
        averageSatisfaction: 4.6
      };

      setCustomers(mockCustomers);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Customer analytics load error:", error);
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
            Customer Analytics / Müştəri Analitikası
          </h1>
          <p className="text-gray-600 mt-2">
            Analyze customer behavior and preferences / Müştəri davranışını və üstünlüklərini analiz et
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report / Hesabat İxrac Et
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Create Campaign / Kampaniya Yarat
          </Button>
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers / Ümumi Müştərilər
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.newCustomers} new this month / bu ay yeni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers / Aktiv Müştərilər
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.customerRetention}% retention / qorunma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              VIP Customers / VIP Müştərilər
            </CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics?.vipCustomers}</div>
            <p className="text-xs text-muted-foreground">
              High-value customers / Yüksək dəyərli müştərilər
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value / Orta Sifariş Dəyəri
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              Per customer order / Müştəri sifarişi üzrə
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
                  placeholder="Search customers... / Müştəri axtar..."
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
                <option value="all">All Customers / Bütün Müştərilər</option>
                <option value="vip">VIP Customers / VIP Müştərilər</option>
                <option value="active">Active / Aktiv</option>
                <option value="inactive">Inactive / Qeyri-aktiv</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter / Filtr
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
            Customer List / Müştəri Siyahısı
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
                    <p className="text-gray-600">Total Orders / Ümumi Sifarişlər</p>
                    <p className="font-semibold">{customer.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Spent / Ümumi Xərclənən</p>
                    <p className="font-semibold">${customer.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Order / Orta Sifariş</p>
                    <p className="font-semibold">${customer.averageOrderValue}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Satisfaction / Məmnuniyyət</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="font-semibold">{customer.satisfaction}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Location / Məkan</p>
                    <p className="font-semibold">{customer.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Preferred / Üstünlük</p>
                    <p className="font-semibold">{customer.preferredCategory}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Customer since: {customer.customerSince.toLocaleDateString()}</span>
                    <span>Last order: {customer.lastOrderDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
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
