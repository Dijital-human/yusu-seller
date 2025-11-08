"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  Upload,
  File,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";

interface UploadResult {
  success: number;
  errors: number;
  details: {
    successful: Array<{ row: number; product: { id: string; name: string } }>;
    failed: Array<{ row: number; error: string; data: any }>;
  };
}

export function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "excel">("csv");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);

      // Auto-detect file type
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (extension === "csv") {
        setFileType("csv");
      } else if (["xlsx", "xls"].includes(extension || "")) {
        setFileType("excel");
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setResult(null);

      const extension = droppedFile.name.split(".").pop()?.toLowerCase();
      if (extension === "csv") {
        setFileType("csv");
      } else if (["xlsx", "xls"].includes(extension || "")) {
        setFileType("excel");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", fileType);

      const response = await fetch("/api/seller/products/bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,description,price,stock,category,images,sku,brand
iPhone 15,Latest iPhone with advanced features,1200,50,Electronics,"[]",IPHONE15,Apple
Samsung S24,Flagship phone with great camera,1000,30,Electronics,"[]",SAMSUNG24,Samsung
T-Shirt,Comfortable cotton t-shirt,25,100,Clothing,"[]",TSHIRT001,BrandName`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Product Upload</CardTitle>
          <CardDescription>
            Upload multiple products at once using CSV or Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4 mb-4">
            <Button
              variant={fileType === "csv" ? "default" : "outline"}
              onClick={() => setFileType("csv")}
            >
              CSV
            </Button>
            <Button
              variant={fileType === "excel" ? "default" : "outline"}
              onClick={() => setFileType("excel")}
            >
              Excel
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={fileType === "csv" ? ".csv" : ".xlsx,.xls"}
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <File className="h-12 w-12 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4 mt-4">
              <Alert
                className={
                  result.errors === 0
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }
              >
                <AlertDescription>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800">
                        {result.success} successful
                      </span>
                    </div>
                    {result.errors > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-800">
                          {result.errors} failed
                        </span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.details.successful.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-green-800">
                    Successful Products:
                  </h4>
                  <div className="space-y-1">
                    {result.details.successful.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          Row {item.row}: {item.product.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.details.failed.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-800">
                    Failed Products:
                  </h4>
                  <div className="space-y-2">
                    {result.details.failed.map((item, index) => (
                      <div
                        key={index}
                        className="p-2 bg-red-50 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">
                            Row {item.row}: {item.error}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">CSV Format:</h4>
            <pre className="text-xs overflow-x-auto">
              {`name,description,price,stock,category,images,sku,brand
Product Name,Product Description,100,50,Category Name,"[]",SKU001,BrandName`}
            </pre>
            <p className="text-sm text-gray-600 mt-2">
              Required fields: name, description, price, stock, category
              <br />
              Optional fields: images (JSON array), sku, brand
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

