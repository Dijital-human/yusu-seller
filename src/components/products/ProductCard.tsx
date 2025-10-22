/**
 * Product Card Component / Məhsul Kartı Komponenti
 * This component displays a single product in card format
 * Bu komponent tək məhsulu kart formatında göstərir
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/CartContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Eye,
  Package,
  Truck
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: {
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
  };
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onAddToWishlist, 
  onQuickView 
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart, isInCart } = useCart();

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await addToCart(product.id, 1);
      if (onAddToCart) {
        onAddToCart(product.id);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (onAddToWishlist) {
      setIsInWishlist(!isInWishlist);
      await onAddToWishlist(product.id);
    }
  };

  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView(product.id);
    }
  };

  const isOutOfStock = product.stock === 0;
  const discountPercentage = 0; // This would come from product data / Bu məhsul məlumatından gələcək

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative overflow-hidden">
        {/* Product Image / Məhsul Şəkli */}
        <Link href={`/products/${product.id}`}>
          <div className="aspect-square relative">
            <Image
              src={product.images || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            
            {/* Overlay on hover / Hover zamanı örtük */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
          </div>
        </Link>

        {/* Badges / Nişanlar */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {isOutOfStock && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock / Stokda Yox
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              -{discountPercentage}%
            </span>
          )}
          {product.stock > 0 && product.stock < 10 && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Limited Stock / Məhdud Stok
            </span>
          )}
        </div>

        {/* Action Buttons / Əməliyyat Düymələri */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-white"
            onClick={handleAddToWishlist}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
            />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-white"
            onClick={handleQuickView}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Category / Kateqoriya */}
        {product.category && (
          <div className="text-xs text-gray-500 mb-1">
            {product.category.name}
          </div>
        )}

        {/* Product Name / Məhsul Adı */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating / Reytinq */}
        {product.averageRating && product.reviewCount && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.averageRating!) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill={i < Math.floor(product.averageRating!) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Seller Info / Satıcı Məlumatı */}
        {product.seller && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Package className="h-4 w-4 mr-1" />
            <span>{product.seller.name}</span>
          </div>
        )}

        {/* Price / Qiymət */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {discountPercentage > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.price * (1 + discountPercentage / 100))}
              </span>
            )}
          </div>
          
          {/* Stock Indicator / Stok Göstəricisi */}
          <div className="text-xs text-gray-500">
            {product.stock > 0 ? (
              <span className="text-green-600">
                {product.stock} in stock / Stokda var
              </span>
            ) : (
              <span className="text-red-600">
                Out of stock / Stokda yox
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button / Səbətə Əlavə Et Düyməsi */}
        <Button
          className="w-full"
          disabled={isOutOfStock || isLoading}
          onClick={handleAddToCart}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding... / Əlavə edilir...
            </div>
          ) : isOutOfStock ? (
            "Out of Stock / Stokda Yox"
          ) : isInCart(product.id) ? (
            "In Cart / Səbətdə"
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart / Səbətə Əlavə Et
            </>
          )}
        </Button>

        {/* Delivery Info / Çatdırılma Məlumatı */}
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Truck className="h-3 w-3 mr-1" />
          <span>Free delivery / Pulsuz çatdırılma</span>
        </div>
      </CardContent>
    </Card>
  );
}
