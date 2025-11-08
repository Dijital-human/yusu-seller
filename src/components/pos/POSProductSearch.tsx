/**
 * POS Product Search Component / Kassa Məhsul Axtarışı Komponenti
 * This component provides product search for POS
 * Bu komponent Kassa üçün məhsul axtarışı təmin edir
 */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Search, Package, Plus } from "lucide-react";
import { useTranslations } from 'next-intl';
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string;
  barcode?: string;
}

interface POSProductSearchProps {
  onProductSelect: (product: Product) => void;
  onBarcodeScanned?: (barcode: string) => void;
}

export function POSProductSearch({
  onProductSelect,
  onBarcodeScanned,
}: POSProductSearchProps) {
  const t = useTranslations('pos');
  const tCommon = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Search products / Məhsulları axtar
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  const searchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/seller/products?search=${encodeURIComponent(searchTerm)}&limit=10`);
      const data = await response.json();
      
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode);
    }
    // Search by barcode / Barkod ilə axtar
    fetch(`/api/seller/products/barcode?barcode=${encodeURIComponent(barcode)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.product) {
          onProductSelect(data.product);
          setShowBarcodeScanner(false);
        }
      })
      .catch(error => {
        console.error("Error fetching product by barcode:", error);
      });
  };

  return (
    <div className="space-y-4">
      {/* Search Input / Axtarış Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchProducts') || "Search products... / Məhsulları axtar..."}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
          variant="outline"
        >
          <Package className="h-4 w-4 mr-2" />
          {t('scanBarcode') || "Scan / Skən"}
        </Button>
      </div>

      {/* Barcode Scanner / Barkod Skeneri */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onBarcodeScanned={handleBarcodeScanned}
          onProductFound={(product) => {
            onProductSelect(product);
            setShowBarcodeScanner(false);
          }}
        />
      )}

      {/* Search Results / Axtarış Nəticələri */}
      {products.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => onProductSelect(product)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-600">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tCommon('stock') || "Stock / Stok"}: {product.stock}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-4 text-gray-500">
          {tCommon('loading') || "Loading... / Yüklənir..."}
        </div>
      )}
    </div>
  );
}

