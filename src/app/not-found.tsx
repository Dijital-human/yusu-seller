/**
 * 404 Not Found Page / 404 Tapılmadı Səhifəsi
 * This page is displayed when a route is not found
 * Bu səhifə route tapılmadıqda göstərilir
 */

"use client";

import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Home, 
  Search, 
  ArrowLeft,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-orange-600" />
              </div>
              <h1 className="text-6xl font-bold text-gray-900 mb-2">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Page Not Found / Səhifə Tapılmadı
              </h2>
              <p className="text-gray-600 mb-6">
                The page you're looking for doesn't exist / Axtardığınız səhifə mövcud deyil
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-medium text-gray-900 mb-2">
                  What you can do / Nə edə bilərsiniz:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check the URL for typos / URL-də yazım xətası yoxlayın</li>
                  <li>• Go back to the previous page / Əvvəlki səhifəyə qayıdın</li>
                  <li>• Visit our homepage / Ana səhifəmizi ziyarət edin</li>
                  <li>• Search for what you need / Ehtiyacınızı axtarın</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home / Ana Səhifəyə Get
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/products">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Products / Məhsullara Bax
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
                  If you believe this is an error, please contact support / 
                  Əgər bunun xəta olduğunu düşünürsünüzsə, dəstək xidməti ilə əlaqə saxlayın
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
