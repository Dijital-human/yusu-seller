/**
 * Barcode Scanner Component / Barkod Skener Komponenti
 * This component provides barcode scanning functionality (camera and manual input)
 * Bu komponent barkod skan etmə funksionallığını təmin edir (kamera və manual input)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { 
  Camera, 
  Scan, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Package,
  Video,
  VideoOff
} from "lucide-react";
import { useTranslations } from 'next-intl';
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onBarcodeScanned?: (barcode: string) => void;
  onProductFound?: (product: any) => void;
  onProductNotFound?: () => void;
  autoFocus?: boolean;
}

/**
 * Validate barcode format / Barkod formatını yoxla
 * Supports: EAN-13 (13 digits), UPC (12 digits), Code128 (variable length)
 * Dəstəklənir: EAN-13 (13 rəqəm), UPC (12 rəqəm), Code128 (dəyişən uzunluq)
 */
function validateBarcode(barcode: string): { valid: boolean; error?: string } {
  // Remove spaces and dashes / Boşluqları və tireləri sil
  const cleaned = barcode.replace(/[\s-]/g, '');

  // Check if it's numeric / Rəqəmsal olub-olmadığını yoxla
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: "Barcode must contain only digits / Barkod yalnız rəqəmlərdən ibarət olmalıdır" };
  }

  // EAN-13: 13 digits / EAN-13: 13 rəqəm
  if (cleaned.length === 13) {
    return { valid: true };
  }

  // UPC: 12 digits / UPC: 12 rəqəm
  if (cleaned.length === 12) {
    return { valid: true };
  }

  // Code128: 8-48 characters (we'll accept 8-48 digits for now)
  // Code128: 8-48 simvol (indi 8-48 rəqəm qəbul edəcəyik)
  if (cleaned.length >= 8 && cleaned.length <= 48) {
    return { valid: true };
  }

  return { 
    valid: false, 
    error: "Invalid barcode length. Supported: EAN-13 (13), UPC (12), Code128 (8-48) / Yanlış barkod uzunluğu. Dəstəklənir: EAN-13 (13), UPC (12), Code128 (8-48)" 
  };
}

export function BarcodeScanner({
  onBarcodeScanned,
  onProductFound,
  onProductNotFound,
  autoFocus = true,
}: BarcodeScannerProps) {
  const t = useTranslations('barcode');
  const tCommon = useTranslations('common');
  
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);

  // Auto focus on mount / Mount zamanı avtomatik fokus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle barcode input change / Barkod input dəyişikliyini idarə et
  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    setError("");
    setSuccess("");
    setFoundProduct(null);
  };

  // Handle barcode search / Barkod axtarışını idarə et
  const handleSearch = async () => {
    if (!barcode.trim()) {
      setError(t('enterBarcode') || "Please enter a barcode / Zəhmət olmasa barkod daxil edin");
      return;
    }

    // Validate barcode / Barkodu yoxla
    const validation = validateBarcode(barcode);
    if (!validation.valid) {
      setError(validation.error || t('invalidBarcode') || "Invalid barcode / Yanlış barkod");
      return;
    }

    setIsSearching(true);
    setError("");
    setSuccess("");
    setFoundProduct(null);

    try {
      // Search product by barcode / Barkod ilə məhsul axtar
      const response = await fetch(`/api/seller/products/barcode?barcode=${encodeURIComponent(barcode.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('productNotFound') || "Product not found / Məhsul tapılmadı");
      }

      if (data.success && data.product) {
        setFoundProduct(data.product);
        setSuccess(t('productFound') || "Product found / Məhsul tapıldı");
        
        if (onBarcodeScanned) {
          onBarcodeScanned(barcode.trim());
        }
        
        if (onProductFound) {
          onProductFound(data.product);
        }
      } else {
        setError(t('productNotFound') || "Product not found / Məhsul tapılmadı");
        
        if (onProductNotFound) {
          onProductNotFound();
        }
      }
    } catch (error: any) {
      console.error("Error searching barcode:", error);
      setError(error.message || t('searchError') || "Error searching barcode / Barkod axtarışı xətası");
      
      if (onProductNotFound) {
        onProductNotFound();
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key press / Enter düyməsinə basmağı idarə et
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle camera scan / Kamera skan etmə
  const handleCameraScan = async () => {
    if (isScanning) {
      // Stop scanning / Skən etməni dayandır
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current.clear();
          scannerRef.current = null;
        }
        setIsScanning(false);
        setCameraError("");
      } catch (error: any) {
        console.error("Error stopping camera:", error);
        setCameraError(t('cameraStopError') || "Error stopping camera / Kameranı dayandırma xətası");
      }
      return;
    }

    // Start scanning / Skən etməni başlat
    try {
      setCameraError("");
      setIsScanning(true);

      // Check if camera is available / Kameranın mövcud olub-olmadığını yoxla
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('cameraNotSupported') || "Camera not supported / Kamera dəstəklənmir");
      }

      // Create scanner instance / Skener instansı yarat
      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      // Start scanning / Skən etməni başlat
      await scanner.start(
        { facingMode: "environment" }, // Use back camera / Arxa kameradan istifadə et
        {
          fps: 10, // Frames per second / Saniyədə kadr sayı
          qrbox: { width: 250, height: 250 }, // Scanning area / Skən etmə sahəsi
          aspectRatio: 1.0,
        },
        (decodedText, decodedResult) => {
          // Barcode found / Barkod tapıldı
          const validation = validateBarcode(decodedText);
          if (validation.valid) {
            setBarcode(decodedText);
            handleSearchWithBarcode(decodedText);
            // Stop scanning after successful scan / Uğurlu skən etmədən sonra skən etməni dayandır
            scanner.stop().then(() => {
              scanner.clear();
              scannerRef.current = null;
              setIsScanning(false);
            }).catch((err) => {
              console.error("Error stopping scanner:", err);
            });
          } else {
            setCameraError(validation.error || t('invalidBarcode') || "Invalid barcode / Yanlış barkod");
          }
        },
        (errorMessage) => {
          // Scanning error (ignore, it's normal during scanning) / Skən etmə xətası (nəzərə almayın, skən etmə zamanı normaldır)
          // Only show error if it's not a "not found" error / Yalnız "tapılmadı" xətası deyilsə göstər
          if (!errorMessage.includes("No QR code")) {
            // Ignore common scanning errors / Ümumi skən etmə xətalarını nəzərə alma
          }
        }
      );
    } catch (error: any) {
      console.error("Error starting camera:", error);
      setIsScanning(false);
      setCameraError(
        error.message || 
        t('cameraError') || 
        "Error accessing camera. Please check permissions. / Kameraya giriş xətası. Zəhmət olmasa icazələri yoxlayın."
      );
      
      // Clean up on error / Xəta zamanı təmizlə
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (clearError) {
          // Ignore clear errors / Təmizləmə xətalarını nəzərə alma
        }
        scannerRef.current = null;
      }
    }
  };

  // Search with barcode (used by camera scan) / Barkod ilə axtarış (kamera skən tərəfindən istifadə olunur)
  const handleSearchWithBarcode = async (barcodeValue: string) => {
    setIsSearching(true);
    setError("");
    setSuccess("");
    setFoundProduct(null);

    try {
      // Search product by barcode / Barkod ilə məhsul axtar
      const response = await fetch(`/api/seller/products/barcode?barcode=${encodeURIComponent(barcodeValue.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('productNotFound') || "Product not found / Məhsul tapılmadı");
      }

      if (data.success && data.product) {
        setFoundProduct(data.product);
        setSuccess(t('productFound') || "Product found / Məhsul tapıldı");
        
        if (onBarcodeScanned) {
          onBarcodeScanned(barcodeValue.trim());
        }
        
        if (onProductFound) {
          onProductFound(data.product);
        }
      } else {
        setError(t('productNotFound') || "Product not found / Məhsul tapılmadı");
        
        if (onProductNotFound) {
          onProductNotFound();
        }
      }
    } catch (error: any) {
      console.error("Error searching barcode:", error);
      setError(error.message || t('searchError') || "Error searching barcode / Barkod axtarışı xətası");
      
      if (onProductNotFound) {
        onProductNotFound();
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Cleanup camera on unmount / Unmount zamanı kameranı təmizlə
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch((err) => {
          console.error("Error cleaning up scanner:", err);
        });
      }
    };
  }, []);

  // Clear all / Hamısını təmizlə
  const handleClear = () => {
    setBarcode("");
    setError("");
    setSuccess("");
    setFoundProduct(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          {t('title') || "Barcode Scanner / Barkod Skeneri"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Input / Barkod Input */}
        <div className="space-y-2">
          <Label htmlFor="barcode">{t('barcode') || "Barcode / Barkod"}</Label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="barcode"
              type="text"
              value={barcode}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('enterBarcode') || "Enter or scan barcode / Barkod daxil edin və ya skan edin"}
              className="flex-1"
              disabled={isSearching}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !barcode.trim()}
              variant="default"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            {barcode && (
              <Button
                onClick={handleClear}
                variant="ghost"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {t('supportedFormats') || "Supported: EAN-13, UPC, Code128 / Dəstəklənir: EAN-13, UPC, Code128"}
          </p>
        </div>

        {/* Camera Scan Button / Kamera Skən Düyməsi */}
        <Button
          onClick={handleCameraScan}
          variant={isScanning ? "destructive" : "outline"}
          className="w-full"
          disabled={isSearching}
        >
          {isScanning ? (
            <>
              <VideoOff className="h-4 w-4 mr-2" />
              {t('stopScanning') || "Stop Scanning / Skən Etməni Dayandır"}
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              {t('scanWithCamera') || "Scan with Camera / Kameradan Skən Et"}
            </>
          )}
        </Button>

        {/* Camera Scanner Container / Kamera Skener Konteyneri */}
        {isScanning && (
          <div className="space-y-2">
            <div
              id="barcode-scanner-container"
              ref={scanAreaRef}
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: '250px' }}
            />
            <p className="text-xs text-gray-500 text-center">
              {t('pointCameraAtBarcode') || "Point camera at barcode / Kameranı barkoda yönəldin"}
            </p>
          </div>
        )}

        {/* Camera Error Message / Kamera Xəta Mesajı */}
        {cameraError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('cameraError') || "Camera Error / Kamera Xətası"}</AlertTitle>
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}

        {/* Error Message / Xəta Mesajı */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error') || "Error / Xəta"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message / Uğur Mesajı */}
        {success && foundProduct && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{t('success') || "Success / Uğur"}</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="font-medium">{foundProduct.name}</p>
                {foundProduct.category && (
                  <p className="text-sm text-gray-600">
                    {tCommon('category') || "Category / Kateqoriya"}: {foundProduct.category.name}
                  </p>
                )}
                {foundProduct.price && (
                  <p className="text-sm text-gray-600">
                    {tCommon('price') || "Price / Qiymət"}: {foundProduct.price}
                  </p>
                )}
                {foundProduct.stock !== undefined && (
                  <p className="text-sm text-gray-600">
                    {tCommon('stock') || "Stock / Stok"}: {foundProduct.stock}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Product Not Found Message / Məhsul Tapılmadı Mesajı */}
        {error && error.includes("not found") && (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>{t('productNotFound') || "Product Not Found / Məhsul Tapılmadı"}</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{t('createNewProduct') || "Would you like to create a new product? / Yeni məhsul yaratmaq istəyirsiniz?"}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

