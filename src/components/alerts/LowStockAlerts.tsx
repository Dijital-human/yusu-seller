"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  AlertTriangle,
  Bell,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  sellerId: string;
  sellerEmail: string;
}

interface LowStockAlertsProps {
  showSettings?: boolean;
}

export function LowStockAlerts({ showSettings = true }: LowStockAlertsProps) {
  const t = useTranslations('alerts');
  const tCommon = useTranslations('common');
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [threshold, setThreshold] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<string>("10");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seller/alerts/low-stock");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      const data = await response.json();
      setAlerts(data.alerts || []);
      setThreshold(data.threshold || 10);
      setTempThreshold((data.threshold || 10).toString());
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessAlerts = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/seller/alerts/low-stock", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to process alerts");

      const data = await response.json();
      setSuccess(
        `${t('processedAlerts')} ${data.results.total} ${tCommon('alerts') || 'alerts'}. ${data.results.sent} ${t('emailsSent')}.`
      );
      fetchAlerts();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveThreshold = async () => {
    const newThreshold = parseInt(tempThreshold, 10);
    if (isNaN(newThreshold) || newThreshold < 0) {
      setError(t('thresholdMustBePositive'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/seller/alerts/low-stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: newThreshold }),
      });

      if (!response.ok) throw new Error("Failed to update threshold");

      setThreshold(newThreshold);
      setSuccess(t('thresholdUpdated'));
      fetchAlerts();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {t('lowStockAlerts')}
              </CardTitle>
              <Badge variant={alerts.length > 0 ? "destructive" : "default"}>
                {alerts.length}
              </Badge>
            </div>
            <CardDescription>
              {t('productsBelowThreshold')} ({threshold})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>{t('noLowStockAlerts')}</p>
                <p className="text-sm">{t('allProductsWellStocked')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.productId}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.productName}</p>
                        <p className="text-sm text-gray-500">
                          {t('stock')}: {alert.currentStock} / {t('threshold')}:{" "}
                          {alert.threshold}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {alert.currentStock} {t('left')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Button
                onClick={handleProcessAlerts}
                disabled={isProcessing || alerts.length === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('processing')}
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    {t('sendEmailNotifications')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('alertSettings')}
              </CardTitle>
              <CardDescription>
                {t('configureLowStockThreshold')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="threshold">{t('lowStockThreshold')}</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(e.target.value)}
                  placeholder="10"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('productsBelowNumberTriggerAlerts')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveThreshold}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    t('saveThreshold')
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTempThreshold(threshold.toString())}
                >
                  {t('reset')}
                </Button>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('currentThreshold')}</strong> {threshold}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {t('whenStockFallsBelow')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

