"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart,
  Settings,
  Plus,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Zap,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Truck,
  Star,
  Activity,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    nameAz: "İdarə Paneli",
    href: "/seller/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Products",
    nameAz: "Məhsullar",
    href: "/seller/products",
    icon: Package,
    badge: "12",
  },
  {
    name: "Orders",
    nameAz: "Sifarişlər",
    href: "/seller/orders",
    icon: ShoppingCart,
    badge: "3",
  },
  {
    name: "Analytics",
    nameAz: "Analitika",
    href: "/seller/analytics",
    icon: BarChart,
    badge: null,
  },
  {
    name: "Marketing",
    nameAz: "Marketinq",
    href: "/seller/marketing",
    icon: Target,
    badge: null,
  },
  {
    name: "Settings",
    nameAz: "Tənzimləmələr",
    href: "/seller/settings",
    icon: Settings,
    badge: null,
  },
];

const quickActions = [
  {
    name: "Add Product",
    nameAz: "Məhsul Əlavə Et",
    href: "/seller/products/new",
    icon: Plus,
  },
  {
    name: "View Orders",
    nameAz: "Sifarişlərə Bax",
    href: "/seller/orders",
    icon: ShoppingCart,
  },
  {
    name: "Analytics",
    nameAz: "Analitika",
    href: "/seller/analytics",
    icon: BarChart,
  },
];

export default function SellerNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r shadow-lg transform transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-center h-16 border-b px-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Yusu Seller</h1>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Seller Account
                </p>
                <p className="text-xs text-gray-500 truncate">
                  seller@yusu.com
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search... / Axtar..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-12 text-left ${
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-75">{item.nameAz}</div>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className="ml-2"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions / Sürətli Əməliyyatlar
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-10 text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <div className="flex-1 text-left">
                        <div>{action.name}</div>
                        <div className="text-xs text-gray-500">{action.nameAz}</div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="p-4 border-t bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Today's Summary / Bu Günün Xülasəsi
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-sm font-semibold text-gray-900">$1,234</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">Orders</p>
                <p className="text-sm font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Logout / Çıxış</div>
                <div className="text-xs opacity-75">Sign out of your account</div>
              </div>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}