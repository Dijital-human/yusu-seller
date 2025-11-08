/**
 * POS Cart Component / Kassa Səbəti Komponenti
 * This component displays the shopping cart for POS
 * Bu komponent Kassa üçün alış səbətini göstərir
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart,
  X
} from "lucide-react";
import { useTranslations } from 'next-intl';
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: POSCartProps) {
  const t = useTranslations('pos');
  const tCommon = useTranslations('common');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('cart') || "Cart / Səbət"} ({items.length})
          </CardTitle>
          {items.length > 0 && (
            <Button
              onClick={onClearCart}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('emptyCart') || "Cart is empty / Səbət boşdur"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.price)} {tCommon('each') || "each / hər biri"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    variant="outline"
                    size="sm"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      onUpdateQuantity(item.id, Math.max(1, qty));
                    }}
                    className="w-16 text-center"
                    min="1"
                  />
                  <Button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => onRemoveItem(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-semibold text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {items.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{t('total') || "Total / Ümumi"}:</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

