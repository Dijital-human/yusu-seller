/**
 * POS Payment Component / Kassa Ödəniş Komponenti
 * This component handles payment processing for POS
 * Bu komponent Kassa üçün ödəniş emalını idarə edir
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { CreditCard, DollarSign, Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { formatCurrency } from "@/lib/utils";

interface POSPaymentProps {
  total: number;
  onPaymentComplete: (paymentData: {
    paymentMethod: "CASH" | "CARD" | "MIXED";
    cashAmount?: number;
    cardAmount?: number;
    totalAmount: number;
  }) => void;
  isLoading?: boolean;
}

export function POSPayment({
  total,
  onPaymentComplete,
  isLoading = false,
}: POSPaymentProps) {
  const t = useTranslations('pos');
  const tCommon = useTranslations('common');
  
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MIXED">("CASH");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [cardAmount, setCardAmount] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const handlePayment = () => {
    let finalCashAmount = 0;
    let finalCardAmount = 0;

    if (paymentMethod === "CASH") {
      finalCashAmount = total;
    } else if (paymentMethod === "CARD") {
      finalCardAmount = total;
    } else if (paymentMethod === "MIXED") {
      finalCashAmount = parseFloat(cashAmount) || 0;
      finalCardAmount = parseFloat(cardAmount) || 0;
      
      if (finalCashAmount + finalCardAmount !== total) {
        alert(t('paymentAmountMismatch') || "Payment amounts don't match total / Ödəniş məbləğləri ümumi məbləğə uyğun gəlmir");
        return;
      }
    }

    onPaymentComplete({
      paymentMethod,
      cashAmount: finalCashAmount > 0 ? finalCashAmount : undefined,
      cardAmount: finalCardAmount > 0 ? finalCardAmount : undefined,
      totalAmount: total,
    });
  };

  const change = paymentMethod === "CASH" && cashAmount 
    ? parseFloat(cashAmount) - total 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('payment') || "Payment / Ödəniş"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info / Müştəri Məlumatı */}
        <div className="space-y-2">
          <Label>{t('customerName') || "Customer Name / Müştəri Adı"} (Optional)</Label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t('enterCustomerName') || "Enter customer name / Müştəri adını daxil edin"}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('customerPhone') || "Customer Phone / Müştəri Telefonu"} (Optional)</Label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder={t('enterCustomerPhone') || "Enter customer phone / Müştəri telefonunu daxil edin"}
          />
        </div>

        {/* Payment Method / Ödəniş Üsulu */}
        <div className="space-y-2">
          <Label>{t('paymentMethod') || "Payment Method / Ödəniş Üsulu"}</Label>
          <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('cash') || "Cash / Nağd"}
                </div>
              </SelectItem>
              <SelectItem value="CARD">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('card') || "Card / Kart"}
                </div>
              </SelectItem>
              <SelectItem value="MIXED">
                {t('mixed') || "Mixed / Qarışıq"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Amounts / Ödəniş Məbləğləri */}
        {paymentMethod === "CASH" && (
          <div className="space-y-2">
            <Label>{t('cashReceived') || "Cash Received / Alınan Nağd"}</Label>
            <Input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder={formatCurrency(total)}
              min={total}
              step="0.01"
            />
            {change > 0 && (
              <p className="text-sm text-green-600 font-semibold">
                {t('change') || "Change / Dəyişiklik"}: {formatCurrency(change)}
              </p>
            )}
          </div>
        )}

        {paymentMethod === "MIXED" && (
          <div className="space-y-2">
            <div>
              <Label>{t('cashAmount') || "Cash Amount / Nağd Məbləğ"}</Label>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>{t('cardAmount') || "Card Amount / Kart Məbləğ"}</Label>
              <Input
                type="number"
                value={cardAmount}
                onChange={(e) => setCardAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-600">
              {t('total') || "Total / Ümumi"}: {formatCurrency(total)}
            </p>
          </div>
        )}

        {/* Total / Ümumi */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{t('total') || "Total / Ümumi"}:</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
          <Button
            onClick={handlePayment}
            disabled={isLoading || total === 0 || (paymentMethod === "CASH" && (!cashAmount || parseFloat(cashAmount) < total))}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('processing') || "Processing... / Emal olunur..."}
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                {t('completePayment') || "Complete Payment / Ödənişi Tamamla"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

