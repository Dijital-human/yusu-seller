/**
 * Home Page Component / Ana Səhifə Komponenti
 * This component displays the main landing page
 * Bu komponent əsas açılış səhifəsini göstərir
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Eye,
  ArrowRight,
  Truck,
  Shield,
  RotateCcw,
  CreditCard,
  TrendingUp,
  Users,
  Package
} from "lucide-react";

// Mock data for featured products / Tövsiyə edilən məhsullar üçün mock məlumat
const featuredProducts = [
  {
    id: 1,
    name: "Wireless Headphones / Simsiz Qulaqlıq",
    price: 99.99,
    originalPrice: 149.99,
    rating: 4.5,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1505740420928-5e880c94d7c0?w=300&h=300&fit=crop",
    badge: "Best Seller / Ən Çox Satılan"
  },
  {
    id: 2,
    name: "Smart Watch / Ağıllı Saat",
    price: 199.99,
    originalPrice: 299.99,
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    badge: "New / Yeni"
  },
  {
    id: 3,
    name: "Laptop Backpack / Laptop Çantası",
    price: 49.99,
    originalPrice: 79.99,
    rating: 4.3,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    badge: "Sale / Endirim"
  },
  {
    id: 4,
    name: "Bluetooth Speaker / Bluetooth Səsverici",
    price: 79.99,
    originalPrice: 119.99,
    rating: 4.6,
    reviews: 167,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
    badge: "Limited / Məhdud"
  }
];

const categories = [
  {
    id: 1,
    name: "Electronics / Elektronika",
    image: "https://images.unsplash.com/photo-1498049794561-7780c723c1c0?w=300&h=200&fit=crop",
    productCount: 1250
  },
  {
    id: 2,
    name: "Fashion / Moda",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
    productCount: 890
  },
  {
    id: 3,
    name: "Home & Garden / Ev və Bağ",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
    productCount: 567
  },
  {
    id: 4,
    name: "Sports / İdman",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop",
    productCount: 423
  }
];

const stats = [
  { icon: Users, label: "Happy Customers / Məmnun Müştərilər", value: "50K+" },
  { icon: Package, label: "Products / Məhsullar", value: "3K+" },
  { icon: Truck, label: "Orders Delivered / Çatdırılan Sifarişlər", value: "100K+" },
  { icon: TrendingUp, label: "Growth Rate / Artım Tempi", value: "25%" }
];

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Welcome to Yusu / Yusu-ya Xoş Gəlmisiniz",
      subtitle: "Discover Amazing Products / Heyrətamiz Məhsulları Kəşf Edin",
      description: "Shop the latest trends with fast delivery and secure payment / Ən son trendlərlə alış-veriş edin, sürətli çatdırılma və təhlükəsiz ödənişlə",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
      buttonText: "Shop Now / İndi Alış-veriş Et",
      buttonLink: "/products"
    },
    {
      title: "Best Deals / Ən Yaxşı Təkliflər",
      subtitle: "Up to 70% Off / 70%-ə qədər Endirim",
      description: "Don't miss out on our amazing discounts / Heyrətamiz endirimlərimizi qaçırmayın",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=600&fit=crop",
      buttonText: "View Deals / Təkliflərə Bax",
      buttonLink: "/deals"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen">
      {/* Hero Section / Hero Bölməsi */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroSlides[currentSlide].image}
            alt={heroSlides[currentSlide].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {heroSlides[currentSlide].title}
              </h1>
              <h2 className="text-xl md:text-2xl text-blue-200 mb-6">
                {heroSlides[currentSlide].subtitle}
              </h2>
              <p className="text-lg text-gray-200 mb-8">
                {heroSlides[currentSlide].description}
              </p>
              <Link href={heroSlides[currentSlide].buttonLink}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {heroSlides[currentSlide].buttonText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators / Sürüşdürmə Göstəriciləri */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section / Statistika Bölməsi */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section / Kateqoriyalar Bölməsi */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shop by Category / Kateqoriyaya Görə Alış-veriş
            </h2>
            <p className="text-lg text-gray-600">
              Find exactly what you're looking for / Axtardığınızı tapın
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`}>
                <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.productCount} products</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section / Tövsiyə Edilən Məhsullar Bölməsi */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Products / Tövsiyə Edilən Məhsullar
            </h2>
            <p className="text-lg text-gray-600">
              Handpicked items just for you / Sizin üçün xüsusi seçilmiş məhsullar
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {product.badge}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline">
                View All Products / Bütün Məhsullara Bax
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section / Xüsusiyyətlər Bölməsi */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Yusu? / Niyə Yusu Seçməli?
            </h2>
            <p className="text-lg text-gray-600">
              We provide the best shopping experience / Ən yaxşı alış-veriş təcrübəsini təmin edirik
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery / Sürətli Çatdırılma</h3>
              <p className="text-gray-600">Get your orders delivered within 24-48 hours / Sifarişlərinizi 24-48 saat ərzində alın</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payment / Təhlükəsiz Ödəniş</h3>
              <p className="text-gray-600">Your payment information is always safe and secure / Ödəniş məlumatlarınız həmişə təhlükəsizdir</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Returns / Asan Qaytarma</h3>
              <p className="text-gray-600">30-day return policy for all products / Bütün məhsullar üçün 30 günlük qaytarma siyasəti</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
