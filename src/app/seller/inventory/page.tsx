/**
 * Inventory Management Page / Anbar İdarəetməsi Səhifəsi
 * Advanced inventory management for sellers
 * Satıcılar üçün ətraflı anbar idarəetməsi
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  Clock,
  DollarSign,
  Tag,
  Eye,
  Settings
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
  supplier: string;
}

interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  averageTurnover: number;
  topSellingItems: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadInventoryData();
  }, [searchTerm, filterStatus]);

  const loadInventoryData = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters / Sorğu parametrlərini qur
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      // Fetch inventory data from API / API-dən anbar məlumatlarını al
      const response = await fetch(`/api/seller/inventory?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data / Anbar məlumatlarını almaq uğursuz oldu');
      }

      const data = await response.json();
      
      if (data.success) {
        setItems(data.items || []);
        setMetrics(data.metrics || {
          totalItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalValue: 0,
          averageTurnover: 0,
          topSellingItems: 0
        });
      } else {
        throw new Error(data.error || 'Unknown error / Naməlum xəta');
      }
    } catch (error) {
      console.error("Inventory load error:", error);
      // Fallback to empty state on error / Xəta olduqda boş vəziyyətə keç
      setItems([]);
      setMetrics({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        averageTurnover: 0,
        topSellingItems: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'low_stock': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out_of_stock': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleEditStock = async (productId: string, currentStock: number) => {
    const newStock = prompt(`Enter new stock quantity / Yeni stok miqdarını daxil edin:\n\nCurrent: ${currentStock}`, currentStock.toString());
    
    if (newStock === null) return; // User cancelled / İstifadəçi ləğv etdi
    
    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      alert('Invalid stock value / Etibarsız stok dəyəri');
      return;
    }

    try {
      const response = await fetch(`/api/seller/inventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          stock: stockValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock / Stoku yeniləmək uğursuz oldu');
      }

      // Reload inventory data / Anbar məlumatlarını yenidən yüklə
      loadInventoryData();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert(error instanceof Error ? error.message : 'Failed to update stock / Stoku yeniləmək uğursuz oldu');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || item.status === filterStatus;
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
            Inventory Management / Anbar İdarəetməsi
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your product inventory and stock levels / Məhsul anbarını və stok səviyyələrini idarə et
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import / İdxal
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export / İxrac
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product / Məhsul Əlavə Et
          </Button>
        </div>
      </div>

      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items / Ümumi Məhsullar
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory / Anbardakı məhsullar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock / Aşağı Stok
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics?.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items need restocking / Yenidən stoklama lazım
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Out of Stock / Stokda Yox
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items out of stock / Stokda olmayan məhsullar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Value / Ümumi Dəyər
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Inventory value / Anbar dəyəri
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
                  placeholder="Search products... / Məhsul axtar..."
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
                <option value="all">All Status / Bütün Status</option>
                <option value="in_stock">In Stock / Stokda</option>
                <option value="low_stock">Low Stock / Aşağı Stok</option>
                <option value="out_of_stock">Out of Stock / Stokda Yox</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter / Filtr
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items / Anbar Məhsulları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{item.status.replace('_', ' ')}</span>
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditStock(item.id, item.currentStock)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current Stock / Cari Stok</p>
                    <p className="font-semibold">{item.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Min Stock / Min Stok</p>
                    <p className="font-semibold">{item.minStock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Max Stock / Max Stok</p>
                    <p className="font-semibold">{item.maxStock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cost / Xərc</p>
                    <p className="font-semibold">${item.cost}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Price / Qiymət</p>
                    <p className="font-semibold">${item.price}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Supplier / Təchizatçı</p>
                    <p className="font-semibold">{item.supplier}</p>
                  </div>
                </div>

                {/* Stock Level Indicator */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stock Level / Stok Səviyyəsi</span>
                    <span>{Math.round((item.currentStock / item.maxStock) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.status === 'out_of_stock' ? 'bg-red-500' :
                        item.status === 'low_stock' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%` }}
                    ></div>
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
