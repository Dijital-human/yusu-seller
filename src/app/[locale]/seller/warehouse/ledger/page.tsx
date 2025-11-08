/**
 * Warehouse Ledger Page / Anbar Hesab Kitabı Səhifəsi
 * This page displays warehouse accounting/ledger entries
 * Bu səhifə anbar hesab kitabı qeydlərini göstərir
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { 
  ArrowLeft,
  FileText,
  Download,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package
} from "lucide-react";

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  balanceQty: number;
  balanceValue: number;
  notes?: string;
  warehouse: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    barcode?: string;
  };
  operation: {
    id: string;
    type: string;
    reason?: string;
  };
}

interface Summary {
  incoming: number;
  outgoing: number;
  net: number;
  totalBalanceQty: number;
  totalBalanceValue: number;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function WarehouseLedgerPage() {
  const router = useRouter();
  const t = useTranslations('warehouse');
  const tCommon = useTranslations('common');
  
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // Filters / Filtrlər
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Load warehouses / Anbarları yüklə
  useEffect(() => {
    loadWarehouses();
  }, []);

  // Load ledger entries when filters change / Filtrlər dəyişəndə ledger qeydlərini yüklə
  useEffect(() => {
    loadLedgerEntries();
  }, [selectedWarehouse, selectedProduct, selectedType, startDate, endDate, page]);

  const loadWarehouses = async () => {
    try {
      const response = await fetch("/api/seller/warehouse");
      const data = await response.json();
      if (response.ok && data.warehouses) {
        setWarehouses(data.warehouses);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadLedgerEntries = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (selectedWarehouse) params.append("warehouseId", selectedWarehouse);
      if (selectedProduct) params.append("productId", selectedProduct);
      if (selectedType) params.append("type", selectedType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/seller/warehouse/ledger?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('loadError') || "Failed to load ledger / Hesab kitabını yükləmək uğursuz oldu");
      }

      setLedgerEntries(data.ledgerEntries || []);
      setSummary(data.summary || null);
    } catch (error: any) {
      console.error("Error loading ledger entries:", error);
      setError(error.message || t('loadError') || "Failed to load ledger / Hesab kitabını yükləmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedWarehouse("");
    setSelectedProduct("");
    setSelectedType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INCOMING": return t('incoming') || "Incoming / Giriş";
      case "OUTGOING": return t('outgoing') || "Outgoing / Çıxış";
      case "TRANSFER": return t('transfer') || "Transfer / Transfer";
      case "ADJUSTMENT": return t('adjustment') || "Adjustment / Düzəliş";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INCOMING": return "text-green-600 bg-green-50";
      case "OUTGOING": return "text-red-600 bg-red-50";
      case "TRANSFER": return "text-blue-600 bg-blue-50";
      case "ADJUSTMENT": return "text-yellow-600 bg-yellow-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  if (isLoading && ledgerEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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
            onClick={() => router.push("/seller/warehouse")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back') || "Back / Geri"}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('ledgerTitle') || "Warehouse Ledger / Anbar Hesab Kitabı"}
              </h1>
              <p className="text-gray-600">
                {t('ledgerDescription') || "View warehouse operations ledger / Anbar əməliyyatlarının hesab kitabını görüntüləyin"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleResetFilters}>
                <Filter className="h-4 w-4 mr-2" />
                {tCommon('reset') || "Reset / Sıfırla"}
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                {t('export') || "Export / Export"}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tCommon('error') || "Error / Xəta"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Card */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('totalIncoming') || "Total Incoming / Ümumi Giriş"}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Number(summary.incoming).toFixed(2)} ₼
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('totalOutgoing') || "Total Outgoing / Ümumi Çıxış"}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Number(summary.outgoing).toFixed(2)} ₼
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('net') || "Net / Xalis"}</p>
                    <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(summary.net).toFixed(2)} ₼
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('totalBalance') || "Total Balance / Ümumi Qalıq"}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Number(summary.totalBalanceValue).toFixed(2)} ₼
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {summary.totalBalanceQty} {t('quantity') || "units / ədəd"}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {tCommon('filter') || "Filters / Filtrlər"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="warehouse">{t('filterByWarehouse') || "Filter by Warehouse / Anbara görə filtrlə"}</Label>
                <Select 
                  value={selectedWarehouse || undefined} 
                  onValueChange={(value) => setSelectedWarehouse(value === "all" ? "" : value)}
                >
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder={t('selectWarehouse') || "Select warehouse / Anbar seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tCommon('all') || "All / Hamısı"}</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">{t('filterByType') || "Filter by Type / Tipə görə filtrlə"}</Label>
                <Select 
                  value={selectedType || undefined} 
                  onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t('type') || "Type / Tip"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tCommon('all') || "All / Hamısı"}</SelectItem>
                    <SelectItem value="INCOMING">{t('incoming') || "Incoming / Giriş"}</SelectItem>
                    <SelectItem value="OUTGOING">{t('outgoing') || "Outgoing / Çıxış"}</SelectItem>
                    <SelectItem value="TRANSFER">{t('transfer') || "Transfer / Transfer"}</SelectItem>
                    <SelectItem value="ADJUSTMENT">{t('adjustment') || "Adjustment / Düzəliş"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">{t('startDate') || "Start Date / Başlanğıc Tarixi"}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">{t('endDate') || "End Date / Bitmə Tarixi"}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleResetFilters} variant="outline" className="w-full">
                  {tCommon('reset') || "Reset / Sıfırla"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ledgerTitle') || "Warehouse Ledger / Anbar Hesab Kitabı"}</CardTitle>
          </CardHeader>
          <CardContent>
            {ledgerEntries.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">{t('noLedgerEntries') || "No ledger entries / Hesab kitabı qeydi yoxdur"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date') || "Date / Tarix"}</TableHead>
                      <TableHead>{t('warehouse') || "Warehouse / Anbar"}</TableHead>
                      <TableHead>{t('name') || "Product / Məhsul"}</TableHead>
                      <TableHead>{t('type') || "Type / Tip"}</TableHead>
                      <TableHead>{t('quantity') || "Quantity / Miqdar"}</TableHead>
                      <TableHead>{t('unitPrice') || "Unit Price / Vahid Qiyməti"}</TableHead>
                      <TableHead>{t('totalValue') || "Total Value / Ümumi Dəyər"}</TableHead>
                      <TableHead>{t('balanceQty') || "Balance Qty / Qalıq Miqdar"}</TableHead>
                      <TableHead>{t('balanceValue') || "Balance Value / Qalıq Dəyər"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.warehouse.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.product.name}</p>
                            {entry.product.barcode && (
                              <p className="text-xs text-gray-500">{entry.product.barcode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {getTypeLabel(entry.type)}
                          </span>
                        </TableCell>
                        <TableCell>{entry.quantity}</TableCell>
                        <TableCell>{Number(entry.unitPrice).toFixed(2)} ₼</TableCell>
                        <TableCell className="font-medium">{Number(entry.totalValue).toFixed(2)} ₼</TableCell>
                        <TableCell>{entry.balanceQty}</TableCell>
                        <TableCell className="font-medium">{Number(entry.balanceValue).toFixed(2)} ₼</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

