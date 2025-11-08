/**
 * Warehouse Management Page / Anbar İdarəetmə Səhifəsi
 * This page provides warehouse management functionality
 * Bu səhifə anbar idarəetmə funksionallığını təmin edir
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { 
  Warehouse, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner";

interface WarehouseData {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
  stockItems: any[];
  _count: {
    operations: number;
    stockItems: number;
  };
}

export default function WarehousePage() {
  const router = useRouter();
  const t = useTranslations('warehouse');
  const tCommon = useTranslations('common');
  const tBarcode = useTranslations('barcode');
  
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [newWarehouse, setNewWarehouse] = useState({ name: "", address: "" });

  // Load warehouses / Anbarları yüklə
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch("/api/seller/warehouse");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('loadError') || "Failed to load warehouses / Anbarları yükləmək uğursuz oldu");
      }

      setWarehouses(data.warehouses || []);
    } catch (error: any) {
      console.error("Error loading warehouses:", error);
      setError(error.message || t('loadError') || "Failed to load warehouses / Anbarları yükləmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  // Create warehouse / Anbar yarat
  const handleCreateWarehouse = async () => {
    if (!newWarehouse.name.trim()) {
      setError(t('nameRequired') || "Warehouse name is required / Anbar adı tələb olunur");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/seller/warehouse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWarehouse.name,
          address: newWarehouse.address || undefined,
          isDefault: warehouses.length === 0, // First warehouse is default / İlk anbar default-dur
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('createError') || "Failed to create warehouse / Anbar yaratmaq uğursuz oldu");
      }

      setSuccess(t('warehouseCreated') || "Warehouse created successfully / Anbar uğurla yaradıldı");
      setNewWarehouse({ name: "", address: "" });
      setShowAddWarehouse(false);
      loadWarehouses();
    } catch (error: any) {
      console.error("Error creating warehouse:", error);
      setError(error.message || t('createError') || "Failed to create warehouse / Anbar yaratmaq uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete warehouse / Anbarı sil
  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm(t('confirmDelete') || "Are you sure you want to delete this warehouse? / Bu anbarı silmək istədiyinizə əminsiniz?")) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/seller/warehouse?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('deleteError') || "Failed to delete warehouse / Anbar silmək uğursuz oldu");
      }

      setSuccess(t('warehouseDeleted') || "Warehouse deleted successfully / Anbar uğurla silindi");
      loadWarehouses();
    } catch (error: any) {
      console.error("Error deleting warehouse:", error);
      setError(error.message || t('deleteError') || "Failed to delete warehouse / Anbar silmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle barcode scanned / Barkod skan edildikdə
  const handleBarcodeScanned = async (barcode: string) => {
    if (!selectedWarehouse) {
      setError(t('selectWarehouse') || "Please select a warehouse first / Zəhmət olmasa əvvəlcə anbar seçin");
      return;
    }

    try {
      // Search product by barcode / Barkod ilə məhsul axtar
      const response = await fetch(`/api/seller/products/barcode?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();

      if (data.success && data.product) {
        // Add product to warehouse / Məhsulu anbara əlavə et
        const opResponse = await fetch("/api/seller/warehouse/operations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            warehouseId: selectedWarehouse,
            productId: data.product.id,
            type: "INCOMING",
            quantity: 1,
            reason: t('barcodeScan') || "Added via barcode scan / Barkod skan etməklə əlavə edildi",
          }),
        });

        if (opResponse.ok) {
          setSuccess(t('productAdded') || "Product added to warehouse / Məhsul anbara əlavə edildi");
          loadWarehouses();
        } else {
          throw new Error(t('addError') || "Failed to add product / Məhsul əlavə etmək uğursuz oldu");
        }
      } else {
        setError(tBarcode('productNotFound') || "Product not found / Məhsul tapılmadı");
      }
    } catch (error: any) {
      console.error("Error adding product by barcode:", error);
      setError(error.message || t('addError') || "Failed to add product / Məhsul əlavə etmək uğursuz oldu");
    }
  };

  if (isLoading && warehouses.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{tCommon('loading') || "Loading... / Yüklənir..."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/seller/dashboard")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back') || "Back / Geri"}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('title') || "Warehouse Management / Anbar İdarəetməsi"}
              </h1>
              <p className="text-gray-600">
                {t('description') || "Manage your warehouses and inventory / Anbarlarınızı və inventarınızı idarə edin"}
              </p>
            </div>
            <Button onClick={() => setShowAddWarehouse(!showAddWarehouse)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addWarehouse') || "Add Warehouse / Anbar Əlavə Et"}
            </Button>
          </div>
        </div>

        {/* Error and Success Messages / Xəta və Uğur Mesajları */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error') || "Error / Xəta"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{t('success') || "Success / Uğur"}</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Add Warehouse Form / Anbar Əlavə Etmə Formu */}
        {showAddWarehouse && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('newWarehouse') || "New Warehouse / Yeni Anbar"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="warehouse-name">{t('name') || "Name / Ad"} *</Label>
                <Input
                  id="warehouse-name"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  placeholder={t('enterWarehouseName') || "Enter warehouse name / Anbar adını daxil edin"}
                />
              </div>
              <div>
                <Label htmlFor="warehouse-address">{t('address') || "Address / Ünvan"}</Label>
                <Input
                  id="warehouse-address"
                  value={newWarehouse.address}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  placeholder={t('enterWarehouseAddress') || "Enter warehouse address / Anbar ünvanını daxil edin"}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateWarehouse} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t('create') || "Create / Yarat"}
                </Button>
                <Button onClick={() => setShowAddWarehouse(false)} variant="outline">
                  {tCommon('cancel') || "Cancel / Ləğv Et"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barcode Scanner / Barkod Skeneri */}
        {showBarcodeScanner && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{tBarcode('title') || "Barcode Scanner / Barkod Skeneri"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>{t('selectWarehouse') || "Select Warehouse / Anbar Seç"}</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectWarehouse') || "Select warehouse / Anbar seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} {wh.isDefault && `(${t('default') || "Default / Varsayılan"})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <BarcodeScanner
                onBarcodeScanned={handleBarcodeScanned}
                onProductFound={(product) => {
                  handleBarcodeScanned(product.barcode || "");
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Warehouses List / Anbarlar Siyahısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    {warehouse.name}
                    {warehouse.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {t('default') || "Default / Varsayılan"}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDeleteWarehouse(warehouse.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {warehouse.address && (
                  <p className="text-sm text-gray-600 mb-4">{warehouse.address}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('totalProducts') || "Total Products / Ümumi Məhsullar"}:</span>
                    <span className="font-semibold">{warehouse._count.stockItems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('totalOperations') || "Total Operations / Ümumi Əməliyyatlar"}:</span>
                    <span className="font-semibold">{warehouse._count.operations}</span>
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/seller/warehouse/${warehouse.id}`)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  {t('viewDetails') || "View Details / Detallara Bax"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {warehouses.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Warehouse className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('noWarehouses') || "No Warehouses / Anbar Yoxdur"}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('createFirstWarehouse') || "Create your first warehouse to get started / Başlamaq üçün ilk anbarınızı yaradın"}
              </p>
              <Button onClick={() => setShowAddWarehouse(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addWarehouse') || "Add Warehouse / Anbar Əlavə Et"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Barcode Scanner Button / Barkod Skeneri Düyməsi */}
        {warehouses.length > 0 && (
          <div className="mt-6">
            <Button
              onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
              variant="outline"
              className="w-full"
            >
              <Package className="h-4 w-4 mr-2" />
              {showBarcodeScanner 
                ? (t('hideBarcodeScanner') || "Hide Barcode Scanner / Barkod Skenerini Gizlət")
                : (t('showBarcodeScanner') || "Show Barcode Scanner / Barkod Skenerini Göstər")
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

