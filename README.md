# Yusu Seller Panel / Yusu Satıcı Paneli

## 📋 Təsvir / Description

Yusu Seller Panel - Satıcılar üçün xüsusi idarəetmə paneli / Special management panel for sellers.

Bu panel satıcıların məhsullarını idarə etməsi, sifarişləri izləməsi və satış statistikalarını görə bilməsi üçün yaradılmışdır.

This panel is designed for sellers to manage their products, track orders, and view sales statistics.

## 🚀 Xüsusiyyətlər / Features

### Məhsul İdarəetməsi / Product Management
- ✅ Məhsul əlavə etmə / Add products
- ✅ Məhsul redaktə etmə / Edit products  
- ✅ Məhsul silmə / Delete products
- ✅ Məhsul kateqoriyaları / Product categories
- ✅ Şəkil yükləmə / Image upload

### Sifariş İdarəetməsi / Order Management
- ✅ Sifarişləri görüntüləmə / View orders
- ✅ Sifariş statusunu dəyişdirmə / Change order status
- ✅ Sifariş detalları / Order details
- ✅ Sifariş tarixçəsi / Order history

### Satış Analitikası / Sales Analytics
- ✅ Günlük satışlar / Daily sales
- ✅ Aylıq satışlar / Monthly sales
- ✅ Məhsul performansı / Product performance
- ✅ Müştəri analizi / Customer analysis

## 🛠️ Texnologiyalar / Technologies

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Database:** Prisma ORM, SQLite
- **Authentication:** NextAuth.js
- **State Management:** React Context

## 📁 Proyekt Strukturu / Project Structure

```
yusu-seller/
├── src/
│   ├── app/
│   │   ├── seller/           # Seller səhifələri / Seller pages
│   │   ├── api/seller/       # Seller API-ləri / Seller APIs
│   │   └── auth/             # Giriş səhifələri / Auth pages
│   ├── components/           # Komponentlər / Components
│   ├── lib/                  # Yardımçı funksiyalar / Helper functions
│   └── types/                # TypeScript tipləri / TypeScript types
├── prisma/                   # Veritabanı şeması / Database schema
└── public/                   # Statik fayllar / Static files
```

## 🚀 Quraşdırma / Installation

### Tələblər / Requirements
- Node.js 18+
- npm və ya yarn
- SQLite veritabanı / SQLite database

### Addımlar / Steps

1. **Bağımlılıqları yükləyin / Install dependencies:**
```bash
npm install
```

2. **Veritabanını quraşdırın / Setup database:**
```bash
npx prisma migrate dev
npx prisma db:seed
```

3. **Mühit dəyişənlərini təyin edin / Set environment variables:**
```bash
cp .env.example .env.local
# .env.local faylını redaktə edin / Edit .env.local file
```

4. **Proyekti işə salın / Start the project:**
```bash
npm run dev
```

## 🌐 URL Strukturu / URL Structure

- **Ana səhifə / Home:** `http://localhost:3002/`
- **Seller Dashboard:** `http://localhost:3002/seller/dashboard`
- **Məhsullar / Products:** `http://localhost:3002/seller/products`
- **Sifarişlər / Orders:** `http://localhost:3002/seller/orders`
- **Giriş / Login:** `http://localhost:3002/auth/signin`

## 🔐 Təhlükəsizlik / Security

- ✅ Rol əsaslı giriş nəzarəti / Role-based access control
- ✅ JWT token autentifikasi / JWT token authentication
- ✅ CSRF qorunması / CSRF protection
- ✅ XSS qorunması / XSS protection
- ✅ SQL injection qorunması / SQL injection protection

## 📚 API Sənədləşməsi / API Documentation

### Seller API Endpoints

#### Məhsullar / Products
- `GET /api/seller/products` - Məhsulları listələ / List products
- `POST /api/seller/products` - Yeni məhsul əlavə et / Add new product
- `PUT /api/seller/products/[id]` - Məhsulu yenilə / Update product
- `DELETE /api/seller/products/[id]` - Məhsulu sil / Delete product

#### Sifarişlər / Orders
- `GET /api/seller/orders` - Sifarişləri listələ / List orders
- `GET /api/seller/orders/[id]` - Sifariş detalları / Order details
- `PUT /api/seller/orders/[id]` - Sifariş statusunu yenilə / Update order status

#### Statistika / Statistics
- `GET /api/seller/stats` - Satış statistikaları / Sales statistics
- `GET /api/seller/stats/daily` - Günlük satışlar / Daily sales
- `GET /api/seller/stats/monthly` - Aylıq satışlar / Monthly sales

## 🤝 Töhfə Vermək / Contributing

1. Fork edin / Fork the project
2. Feature branch yaradın / Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit edin / Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push edin / Push to branch (`git push origin feature/AmazingFeature`)
5. Pull Request yaradın / Open Pull Request

## 📄 Lisenziya / License

Bu proyekt MIT lisenziyası altında paylaşılır / This project is licensed under the MIT License.

## 📞 Əlaqə / Contact

- **Email:** seller@yusu.com
- **Website:** https://seller.yusu.com
- **Support:** support@yusu.com

---

**Yusu Seller Panel** - Satıcılar üçün ən yaxşı həll / The best solution for sellers