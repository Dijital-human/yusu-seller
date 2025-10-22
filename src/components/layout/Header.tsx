/**
 * Header Component / Başlıq Komponenti
 * This component provides the main navigation header
 * Bu komponent əsas naviqasiya başlığını təmin edir
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Search,
  Heart,
  Package,
  Truck,
  Settings
} from "lucide-react";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, handleSignOut } = useAuth();
  // const { canAccess } = usePermissions();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOutClick = () => {
    handleSignOut();
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar / Üst Sətir */}
        <div className="flex items-center justify-between h-16">
          {/* Logo / Loqo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Yusu</span>
            </Link>
          </div>

          {/* Desktop Navigation / Desktop Naviqasiya */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/products" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Products / Məhsullar
            </Link>
            <Link 
              href="/categories" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Categories / Kateqoriyalar
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              About / Haqqımızda
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Contact / Əlaqə
            </Link>
          </nav>

                 {/* Search Bar / Axtarış Səhifəsi */}
                 <div className="hidden md:flex flex-1 max-w-lg mx-8">
                   <form 
                     className="relative w-full"
                     onSubmit={(e) => {
                       e.preventDefault();
                       const formData = new FormData(e.currentTarget);
                       const query = formData.get('search') as string;
                       if (query.trim()) {
                         window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                       }
                     }}
                   >
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Search className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                       type="text"
                       name="search"
                       placeholder="Search products... / Məhsul axtar..."
                       className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     />
                   </form>
                 </div>

          {/* Right Side Actions / Sağ Tərəf Əməliyyatları */}
          <div className="flex items-center space-x-4">
            {/* Wishlist / İstək Siyahısı */}
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Button>

            {/* Cart / Səbət */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {/* Cart items count - commented out for seller panel */}
              {/* {cartState.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartState.totalItems}
                </span>
              )} */}
            </Button>

            {/* User Menu / İstifadəçi Menyu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleUserMenu}
                  className="relative"
                >
                  <User className="h-5 w-5" />
                </Button>
                
                {/* Dropdown Menu / Açılan Menyu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-gray-500">{user?.email}</p>
                    <p className="text-xs text-blue-600 font-medium capitalize">{user?.role?.toLowerCase()}</p>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLinkClick}
                  >
                    Profile / Profil
                  </Link>
                  
                  {canAccess("/orders") && (
                    <Link 
                      href="/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLinkClick}
                    >
                      Orders / Sifarişlər
                    </Link>
                  )}
                  
                  {canAccess("/dashboard") && (
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLinkClick}
                    >
                      Dashboard / İdarə Paneli
                    </Link>
                  )}
                  
                  {canAccess("/admin") && (
                    <Link 
                      href="/admin" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLinkClick}
                    >
                      <Settings className="inline h-4 w-4 mr-2" />
                      Admin Panel / Admin Paneli
                    </Link>
                  )}
                  
                  {canAccess("/seller") && (
                    <Link 
                      href="/seller" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLinkClick}
                    >
                      <Package className="inline h-4 w-4 mr-2" />
                      Seller Panel / Satıcı Paneli
                    </Link>
                  )}
                  
                  {canAccess("/courier") && (
                    <Link 
                      href="/courier" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLinkClick}
                    >
                      <Truck className="inline h-4 w-4 mr-2" />
                      Courier Panel / Kuryer Paneli
                    </Link>
                  )}
                  
                  <button
                    onClick={handleSignOutClick}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out / Çıxış
                  </button>
                </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In / Giriş
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up / Qeydiyyat
                  </Button>
                </Link>
              </div>
            )}

            {/* Desktop User Menu / Desktop İstifadəçi Menyusu */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name || user?.email} / Xoş gəlmisiniz, {user?.name || user?.email}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user?.role}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOutClick}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Sign Out / Çıxış
                </Button>
              </div>
            )}

            {/* Mobile Menu Button / Mobil Menyu Düyməsi */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu / Mobil Menyu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
                     {/* Mobile Search / Mobil Axtarış */}
                     <div className="px-3 py-2">
                       <form 
                         onSubmit={(e) => {
                           e.preventDefault();
                           const formData = new FormData(e.currentTarget);
                           const query = formData.get('search') as string;
                           if (query.trim()) {
                             window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                           }
                         }}
                       >
                         <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <Search className="h-5 w-5 text-gray-400" />
                           </div>
                           <input
                             type="text"
                             name="search"
                             placeholder="Search products... / Məhsul axtar..."
                             className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                           />
                         </div>
                       </form>
                     </div>

              {/* Mobile Navigation Links / Mobil Naviqasiya Linkləri */}
              <Link
                href="/products"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products / Məhsullar
              </Link>
              <Link
                href="/categories"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories / Kateqoriyalar
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About / Haqqımızda
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact / Əlaqə
              </Link>

              {/* Mobile User Actions / Mobil İstifadəçi Əməliyyatları */}
              {!isAuthenticated && (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center px-3 space-x-3">
                    <Link href="/auth/signin" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Sign In / Giriş
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="flex-1">
                      <Button className="w-full">
                        Sign Up / Qeydiyyat
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar / Səbət Yan Paneli */}
    </header>
  );
}
