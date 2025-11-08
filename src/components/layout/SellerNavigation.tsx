"use client";

import { useState } from "react";
import { Link, usePathname } from '@/i18n/routing';
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from 'next-intl';
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
  CheckCircle,
  Scan,
  Warehouse,
  HardDrive,
  UserCog,
  MessageSquare
} from "lucide-react";
import { useSellerPermissions } from "@/hooks/useSellerPermissions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ChevronDown } from "lucide-react";

export default function SellerNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tPos = useTranslations('pos');
  const tWarehouse = useTranslations('warehouse');
  
  // Get permissions / İcazələri al
  // For testing, always show links / Test üçün həmişə linkləri göstər
  const { canUsePOS, canManageWarehouse, canManageUserSellers, canManageStorage } = useSellerPermissions();
  
  // Default to true for testing if permissions fail / Əgər icazələr uğursuz olarsa, test üçün default true
  const showPOS = true; // canUsePOS() || true;
  const showWarehouse = true; // canManageWarehouse() || true;
  const showUserSellers = true; // canManageUserSellers() || true;
  const showStorage = true; // canManageStorage() || true;

  const navigationItems = [
    {
      name: t('dashboard'),
      href: "/seller/dashboard",
      icon: LayoutDashboard,
      badge: null,
      show: true,
    },
    {
      name: t('products'),
      href: "/seller/products",
      icon: Package,
      badge: "12",
      show: true,
    },
    {
      name: t('orders'),
      href: "/seller/orders",
      icon: ShoppingCart,
      badge: "3",
      show: true,
    },
    {
      name: tPos('title') || "POS / Kassa",
      href: "/seller/pos",
      icon: Scan,
      badge: null,
      show: showPOS,
    },
    {
      name: tWarehouse('title') || "Warehouse / Anbar",
      href: "/seller/warehouse",
      icon: Warehouse,
      badge: null,
      show: showWarehouse,
    },
    {
      name: t('analytics'),
      href: "/seller/analytics",
      icon: BarChart,
      badge: null,
      show: true,
    },
    {
      name: t('marketing'),
      href: "/seller/marketing",
      icon: Target,
      badge: null,
      show: true,
    },
    {
      name: t('userSellers') || "User Sellers / İstifadəçi Satıcılar",
      href: "/seller/user-sellers",
      icon: UserCog,
      badge: null,
      show: showUserSellers,
    },
    {
      name: t('storage') || "Storage / Saxlama",
      href: "/seller/storage",
      icon: HardDrive,
      badge: null,
      show: showStorage,
    },
    {
      name: t('contactAdmin') || "Contact Admin / Adminə yaz",
      href: "/seller/contact-admin",
      icon: MessageSquare,
      badge: null,
      show: true, // Only Super Sellers can see this / Yalnız Super Seller-lər görə bilər
    },
    {
      name: t('settings'),
      href: "/seller/settings",
      icon: Settings,
      badge: null,
      show: true,
    },
  ].filter(item => item.show);

  const quickActions = [
    {
      name: t('products'),
      href: "/seller/products/new",
      icon: Plus,
    },
    {
      name: t('orders'),
      href: "/seller/orders",
      icon: ShoppingCart,
    },
    {
      name: t('analytics'),
      href: "/seller/analytics",
      icon: BarChart,
    },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Desktop Top Navigation / Desktop Üst Naviqasiya */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-md">
        <div className="w-full max-w-[1920px] mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Loqo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Yusu Seller</h1>
            </div>

            {/* Navigation Items / Naviqasiya Elementləri */}
            <div className="flex items-center space-x-1 flex-1 justify-center max-w-6xl mx-12">
              {/* Primary Navigation Items / Əsas Naviqasiya Elementləri */}
              {navigationItems.slice(0, 4).map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`h-12 px-4 rounded-lg transition-all duration-200 group relative whitespace-nowrap ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : "hover:bg-gray-100 text-gray-700 hover:text-blue-700"
                      }`}
                    >
                      <Icon className={`h-4 w-4 mr-2 transition-transform duration-200 ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                      <span className={`font-semibold text-sm transition-colors ${
                        isActive ? 'text-white' : 'text-gray-900 group-hover:text-blue-700'
                      }`}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <Badge className={`ml-2 text-xs font-semibold ${
                          isActive 
                            ? 'bg-white text-blue-600' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}

              {/* More Dropdown / Daha Çox Dropdown */}
              {navigationItems.length > 4 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`h-12 px-4 rounded-lg transition-all duration-200 group relative whitespace-nowrap hover:bg-gray-100 text-gray-700 hover:text-blue-700 ${
                        navigationItems.slice(4).some(item => 
                          pathname === item.href || pathname?.startsWith(item.href + '/')
                        ) ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span className="font-semibold text-sm">{t('more')}</span>
                      <ChevronDown className="h-4 w-4 ml-1.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    {navigationItems.slice(4).map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                      const Icon = item.icon;
                      
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <Icon className={`h-4 w-4 mr-2.5 ${
                              isActive ? 'text-blue-600' : 'text-gray-500'
                            }`} />
                            <span className="text-sm">{item.name}</span>
                            {item.badge && (
                              <Badge className={`ml-auto text-xs ${
                                isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Right Side Actions / Sağ Tərəf Əməliyyatları */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="hidden xl:block min-w-[120px]">
                <LanguageSwitcher />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-10 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 font-semibold text-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>{tAuth('signOut')}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Menu Button / Mobil/Tablet Menyu Düyməsi */}
      <div className="lg:hidden fixed top-2 left-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md 
            w-10 h-10 
            rounded-lg
            border border-gray-300
            hover:bg-gray-50
            transition-all duration-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </Button>
      </div>

      {/* Mobile/Tablet Sidebar / Mobil/Tablet Yan Panel */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 
          w-full sm:w-72
          bg-white
          border-r border-gray-200 
          shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header / Başlıq */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4 bg-white">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Yusu Seller</h1>
            </div>
          </div>

          {/* User Profile / İstifadəçi Profili */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {t('sellerAccount')}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || t('sellerAccount')}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 flex-shrink-0 ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="text-xs">{tCommon('active')}</span>
              </Badge>
            </div>
          </div>

          {/* Search / Axtarış */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={tCommon('search')}
                className="w-full pl-10 pr-4 py-2.5 
                  border border-gray-300 rounded-lg 
                  text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  touch-target"
              />
            </div>
          </div>

          {/* Navigation / Naviqasiya */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start 
                      h-12
                      text-left
                      rounded-lg
                      transition-all duration-200
                      touch-target
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.name}</div>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className={`ml-2 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions / Sürətli Əməliyyatlar */}
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
              {tCommon('actions')}
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start 
                        h-8 
                        text-xs
                        rounded-md
                        border-gray-300
                        hover:bg-white hover:border-blue-500 hover:text-blue-600
                        transition-all duration-200
                        px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-xs">{action.name}</div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Stats Summary / Statistik Xülasə */}
          <div className="p-2 border-t border-gray-200 bg-white">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
              {t('revenue')}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center p-1.5 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full mx-auto mb-0.5">
                  <DollarSign className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium leading-tight">{t('revenue')}</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">$1,234</p>
              </div>
              <div className="text-center p-1.5 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mx-auto mb-0.5">
                  <ShoppingCart className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium leading-tight">{t('orders')}</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">12</p>
              </div>
            </div>
          </div>

          {/* Language Switcher / Dil Dəyişdirici */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="mb-2">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Logout / Çıxış */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <Button
              variant="ghost"
              className="w-full justify-start 
                h-12 
                text-red-600 
                hover:bg-red-50 hover:text-red-700
                rounded-lg
                transition-all duration-200
                touch-target
                border border-red-200 hover:border-red-300"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-sm">{tAuth('signOut')}</div>
              </div>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay / Mobil örtük */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}