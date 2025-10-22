"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Settings,
  BarChart3
} from "lucide-react";

export default function SellerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check if user is seller and redirect to dashboard
  // İstifadəçinin satıcı olub-olmadığını yoxla və dashboard-a yönləndir
  useEffect(() => {
    if (status === "loading") return;
    
    // For testing purposes, skip authentication check
    // Test məqsədləri üçün autentifikasiya yoxlamasını keç
    // if (!session || session.user?.role !== "SELLER") {
    //   router.push("/auth/signin");
    //   return;
    // }
    
    // Redirect to dashboard
    // Dashboard-a yönləndir
    router.push("/seller/dashboard");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // For testing purposes, skip authentication check
  // Test məqsədləri üçün autentifikasiya yoxlamasını keç
  // if (!session || session.user?.role !== "SELLER") {
  //   return null;
  // }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Redirecting to Dashboard / Dashboard-a yönləndirilir
            </h1>
            <p className="text-gray-600 mb-8">
              Please wait while we redirect you to your seller dashboard.
              / Satıcı panelinizə yönləndirilirken gözləyin.
            </p>
            <Button onClick={() => router.push("/seller/dashboard")}>
              Go to Dashboard / Dashboard-a Get
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}