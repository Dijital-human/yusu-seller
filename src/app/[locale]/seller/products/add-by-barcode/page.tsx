/**
 * Add Product by Barcode Page / Barkod ilə Məhsul Əlavə Etmə Səhifəsi
 * This page allows sellers to add products by scanning or entering barcode
 * Bu səhifə satıcılara barkod skan etməklə və ya daxil etməklə məhsul əlavə etməyə imkan verir
 */

"use client";

import { useState } from "react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner";
import { ArrowLeft, Package, Plus } from "lucide-react";

export default function AddProductByBarcodePage() {
  const router = useRouter();
  const t = useTranslations('barcode');
  const tCommon = useTranslations('common');
  const tProducts = useTranslations('products');
  
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");

  // Handle barcode scanned / Barkod skan edildikdə
  const handleBarcodeScanned = (barcode: string) => {
    setScannedBarcode(barcode);
  };

  // Handle product found / Məhsul tapıldıqda
  const handleProductFound = (product: any) => {
    setFoundProduct(product);
  };

  // Handle product not found / Məhsul tapılmadıqda
  const handleProductNotFound = () => {
    setFoundProduct(null);
  };

  // Navigate to create new product with barcode / Yeni məhsul yaratmağa keç (barkod ilə)
  const handleCreateNewProduct = () => {
    router.push(`/seller/products/new?barcode=${encodeURIComponent(scannedBarcode)}`);
  };

  // Navigate to product details / Məhsul detallarına keç
  const handleViewProduct = () => {
    if (foundProduct) {
      router.push(`/seller/products/${foundProduct.id}`);
    }
  };

  // Navigate to edit product / Məhsulu redaktə etməyə keç
  const handleEditProduct = () => {
    if (foundProduct) {
      router.push(`/seller/products/${foundProduct.id}/edit`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/seller/products")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back') || "Back / Geri"}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('addProductByBarcode') || "Add Product by Barcode / Barkod ilə Məhsul Əlavə Et"}
          </h1>
          <p className="text-gray-600">
            {t('scanOrEnterBarcode') || "Scan or enter barcode to find or create a product / Barkod skan edin və ya daxil edin məhsul tapmaq və ya yaratmaq üçün"}
          </p>
        </div>

        {/* Barcode Scanner */}
        <div className="mb-6">
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            onProductFound={handleProductFound}
            onProductNotFound={handleProductNotFound}
            autoFocus={true}
          />
        </div>

        {/* Product Found Actions / Məhsul Tapıldı Əməliyyatları */}
        {foundProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('productFound') || "Product Found / Məhsul Tapıldı"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">{foundProduct.name}</h3>
                {foundProduct.category && (
                  <p className="text-sm text-green-700">
                    {tCommon('category') || "Category / Kateqoriya"}: {foundProduct.category.name}
                  </p>
                )}
                {foundProduct.price && (
                  <p className="text-sm text-green-700">
                    {tCommon('price') || "Price / Qiymət"}: {foundProduct.price}
                  </p>
                )}
                {foundProduct.stock !== undefined && (
                  <p className="text-sm text-green-700">
                    {tCommon('stock') || "Stock / Stok"}: {foundProduct.stock}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleViewProduct} variant="default">
                  {tProducts('viewDetails') || "View Details / Detallara Bax"}
                </Button>
                <Button onClick={handleEditProduct} variant="outline">
                  {tProducts('editProduct') || "Edit Product / Məhsulu Redaktə Et"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Not Found - Create New / Məhsul Tapılmadı - Yeni Yarat */}
        {scannedBarcode && !foundProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('createNewProduct') || "Create New Product / Yeni Məhsul Yarat"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {t('productNotFoundMessage') || "No product found with barcode"}: <strong>{scannedBarcode}</strong>
              </p>
              <p className="text-sm text-gray-500">
                {t('createNewProductMessage') || "Would you like to create a new product with this barcode? / Bu barkodla yeni məhsul yaratmaq istəyirsiniz?"}
              </p>
              <Button onClick={handleCreateNewProduct} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('createProductWithBarcode') || "Create Product with Barcode / Barkod ilə Məhsul Yarat"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

