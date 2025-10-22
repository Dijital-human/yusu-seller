/**
 * Unauthorized Page / Yetkisiz Səhifə
 * This page is shown when user doesn't have required permissions
 * Bu səhifə istifadəçinin tələb olunan icazələri olmadığı zaman göstərilir
 */

import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { 
  Shield, 
  ArrowLeft, 
  Home,
  User,
  AlertTriangle
} from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                403 - Access Denied / Giriş Qadağandır
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Unauthorized Access / Yetkisiz Giriş
              </p>
              <p className="text-gray-500">
                You don't have permission to access this page / Bu səhifəyə daxil olmaq icazəniz yoxdur
              </p>
            </div>

            <div className="space-y-4">
              <Alert className="text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <h3 className="font-medium">Possible reasons / Mümkün səbəblər:</h3>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• You need to sign in / Giriş etməlisiniz</li>
                    <li>• Your account doesn't have the required role / Hesabınızın tələb olunan rolu yoxdur</li>
                    <li>• You don't have permission for this action / Bu əməliyyat üçün icazəniz yoxdur</li>
                    <li>• Your session may have expired / Sessiyanız bitmiş ola bilər</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home / Ana Səhifəyə Get
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/auth/signin">
                    <User className="h-4 w-4 mr-2" />
                    Sign In / Giriş Et
                  </Link>
                </Button>
              </div>

              <div className="pt-4 border-t">
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
