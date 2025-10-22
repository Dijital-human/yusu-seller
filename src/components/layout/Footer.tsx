/**
 * Footer Component / Altlıq Komponenti
 * This component provides the main footer with links and information
 * Bu komponent əsas altlığı linklər və məlumatlarla təmin edir
 */

import Link from "next/link";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Shield,
  Truck,
  RotateCcw
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info / Şirkət Məlumatı */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="ml-2 text-xl font-bold">Yusu</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your trusted e-commerce platform for quality products and reliable delivery. 
              / Keyfiyyətli məhsullar və etibarlı çatdırılma üçün etibar etdiyiniz e-ticarət platforması.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links / Sürətli Linklər */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links / Sürətli Linklər</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  About Us / Haqqımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Contact / Əlaqə
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Careers / Karyera
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Blog / Bloq
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Help Center / Yardım Mərkəzi
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service / Müştəri Xidməti */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service / Müştəri Xidməti</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Shipping Info / Çatdırılma Məlumatı
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Returns / Qaytarma
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Size Guide / Ölçü Bələdçisi
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                  FAQ / Tez-tez Verilən Suallar
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Track Order / Sifarişi İzlə
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info / Əlaqə Məlumatı */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info / Əlaqə Məlumatı</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  123 Business Street, Baku, Azerbaijan
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  +994 12 345 67 89
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  info@yusu.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section / Xüsusiyyətlər Bölməsi */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Free Shipping / Pulsuz Çatdırılma</h4>
                <p className="text-gray-400 text-xs">On orders over $50 / $50-dan yuxarı sifarişlərdə</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Easy Returns / Asan Qaytarma</h4>
                <p className="text-gray-400 text-xs">30-day return policy / 30 günlük qaytarma siyasəti</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Secure Payment / Təhlükəsiz Ödəniş</h4>
                <p className="text-gray-400 text-xs">100% secure transactions / 100% təhlükəsiz əməliyyatlar</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Multiple Payment / Çoxlu Ödəniş</h4>
                <p className="text-gray-400 text-xs">All major cards accepted / Bütün əsas kartlar qəbul edilir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar / Alt Sətir */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Yusu. All rights reserved. / Bütün hüquqlar qorunur.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy / Məxfilik Siyasəti
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service / Xidmət Şərtləri
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors text-sm">
                Cookie Policy / Cookie Siyasəti
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
