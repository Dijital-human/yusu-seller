/**
 * Product Grid Component / Məhsul Grid Komponenti
 * This component displays products in a grid layout
 * Bu komponent məhsulları grid layout-da göstərir
 */

"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/Alert";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string;
  averageRating?: number;
  reviewCount?: number;
  stock: number;
  seller?: {
    name: string;
  };
  category?: {
    name: string;
  };
}

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: string;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ProductGrid({
  products,
  isLoading = false,
  error,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  showLoadMore = false,
  onLoadMore,
  hasMore = false,
}: ProductGridProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (onLoadMore && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Show loading state / Yükləmə vəziyyətini göstər
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading products... / Məhsullar yüklənir...</p>
        </div>
      </div>
    );
  }

  // Show error state / Xəta vəziyyətini göstər
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Show empty state / Boş vəziyyəti göstər
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No products found / Məhsul tapılmadı
        </h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your search or filter criteria / Axtarış və ya filtr meyarlarınızı dəyişdirin
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh / Yenilə
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid / Məhsullar Grid-i */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
            onQuickView={onQuickView}
          />
        ))}
      </div>

      {/* Load More Button / Daha Çox Yüklə Düyməsi */}
      {showLoadMore && hasMore && (
        <div className="text-center pt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more... / Daha çox yüklənir...
              </>
            ) : (
              "Load More Products / Daha Çox Məhsul Yüklə"
            )}
          </Button>
        </div>
      )}

      {/* End of results message / Nəticələrin sonu mesajı */}
      {showLoadMore && !hasMore && products.length > 0 && (
        <div className="text-center pt-8">
          <p className="text-gray-500">
            You've reached the end of the results / Nəticələrin sonuna çatdınız
          </p>
        </div>
      )}
    </div>
  );
}
