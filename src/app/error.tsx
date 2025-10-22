/**
 * Error Page / Xəta Səhifəsi
 * This page is displayed when an error occurs
 * Bu səhifə xəta baş verdikdə göstərilir
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Home, 
  RefreshCw, 
  AlertTriangle,
  Bug,
  ArrowLeft
} from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Bug className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-2">
                500
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Internal Server Error / Daxili Server Xətası
              </h2>
              <p className="text-gray-600 mb-6">
                Something went wrong on our end / Bizim tərəfdə bir şey səhv getdi
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">
                      Error Details / Xəta Təfərrüatları:
                    </h3>
                    <p className="text-sm text-red-700">
                      {error.message || 'An unexpected error occurred / Gözlənilməz xəta baş verdi'}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-red-600 mt-2 font-mono">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-medium text-gray-900 mb-2">
                  What you can do / Nə edə bilərsiniz:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Try refreshing the page / Səhifəni yeniləməyə çalışın</li>
                  <li>• Go back to the previous page / Əvvəlki səhifəyə qayıdın</li>
                  <li>• Visit our homepage / Ana səhifəmizi ziyarət edin</li>
                  <li>• Contact support if the problem persists / Problem davam edərsə dəstək ilə əlaqə saxlayın</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={reset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again / Yenidən Cəhd Et
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home / Ana Səhifəyə Get
                  </Link>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="ghost" 
                  onClick={() => window.history.back()}
                  className="text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back / Geri Qayıt
                </Button>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  If this error persists, please contact our support team / 
                  Əgər bu xəta davam edərsə, dəstək komandamızla əlaqə saxlayın
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
