/**
 * Barcode Print Component / Barkod Çap Komponenti
 * This component displays and prints barcodes
 * Bu komponent barkodları göstərir və çap edir
 */

"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Printer, X, Download } from "lucide-react";
import { useTranslations } from 'next-intl';

interface BarcodePrintProps {
  barcode: string;
  productName?: string;
  productPrice?: number;
  onClose?: () => void;
  onPrint?: () => void;
}

export function BarcodePrint({
  barcode,
  productName,
  productPrice,
  onClose,
  onPrint,
}: BarcodePrintProps) {
  const t = useTranslations('barcode');
  const tCommon = useTranslations('common');
  const barcodeRef = useRef<SVGSVGElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Generate barcode SVG / Barkod SVG yarat
  useEffect(() => {
    if (barcodeRef.current && barcode) {
      try {
        JsBarcode(barcodeRef.current, barcode, {
          format: "EAN13",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [barcode]);

  // Handle print / Çapı idarə et
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Barcode Print / Barkod Çapı</title>
              <style>
                @media print {
                  @page {
                    size: 50mm 30mm;
                    margin: 5mm;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                }
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 10px;
                  margin: 0;
                }
                .barcode-container {
                  text-align: center;
                }
                .product-name {
                  font-size: 12px;
                  font-weight: bold;
                  margin-bottom: 5px;
                  word-wrap: break-word;
                  max-width: 200px;
                }
                .product-price {
                  font-size: 10px;
                  color: #666;
                  margin-top: 5px;
                }
                svg {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                ${productName ? `<div class="product-name">${productName}</div>` : ''}
                ${printRef.current.innerHTML}
                ${productPrice ? `<div class="product-price">${productPrice} AZN</div>` : ''}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          if (onPrint) {
            onPrint();
          }
        };
      }
    }
  };

  // Handle download as image / Şəkil kimi yüklə
  const handleDownload = () => {
    if (barcodeRef.current) {
      const svg = barcodeRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `barcode-${barcode}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          });
        }
      };

      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('printBarcode') || "Print Barcode / Barkod Çap Et"}</CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={printRef} className="flex flex-col items-center space-y-4 p-4 bg-white border rounded-lg">
          {productName && (
            <div className="text-center">
              <p className="font-semibold text-sm">{productName}</p>
            </div>
          )}
          <svg ref={barcodeRef} className="barcode-svg" />
          {productPrice !== undefined && (
            <div className="text-center">
              <p className="text-xs text-gray-600">{productPrice} AZN</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs text-gray-500 font-mono">{barcode}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            {t('print') || "Print / Çap Et"}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            {t('download') || "Download / Yüklə"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

