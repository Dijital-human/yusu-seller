# Yusu E-commerce API Documentation / Yusu E-ticarət API Sənədləşməsi

## Overview / Ümumi Baxış

This document provides comprehensive API documentation for the Yusu E-commerce platform.
Bu sənəd Yusu E-ticarət platforması üçün hərtərəfli API sənədləşməsini təqdim edir.

## Base URL / Əsas URL
```
http://localhost:3000/api
```

## Authentication / Autentifikasiya

The API uses NextAuth.js for authentication. Include the session token in requests.
API autentifikasiya üçün NextAuth.js istifadə edir. Sorğularda sessiya tokenini daxil edin.

## Endpoints / Endpoint-lər

### Products / Məhsullar

#### GET /api/products
Get all products / Bütün məhsulları gətir

**Query Parameters / Sorğu Parametrləri:**
- `page` (optional): Page number / Səhifə nömrəsi
- `limit` (optional): Items per page / Səhifədə element sayı
- `categoryId` (optional): Filter by category / Kateqoriyaya görə filtrlə
- `search` (optional): Search term / Axtarış termini

**Response / Cavab:**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod-1",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with advanced camera system",
      "price": 999.99,
      "images": "https://images.unsplash.com/...",
      "categoryId": "1",
      "sellerId": "seller-1",
      "stock": 50,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "pages": 9
  }
}
```

#### POST /api/products
Create a new product / Yeni məhsul yarat

**Request Body / Sorğu Gövdəsi:**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "images": "https://example.com/image.jpg",
  "categoryId": "1",
  "stock": 100
}
```

### Categories / Kateqoriyalar

#### GET /api/categories
Get all categories / Bütün kateqoriyaları gətir

**Response / Cavab:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "1",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "image": "https://images.unsplash.com/...",
      "isActive": true,
      "_aggr_count_products": 25
    }
  ]
}
```

### Cart / Səbət

#### GET /api/cart
Get user's cart / İstifadəçinin səbətini gətir

#### POST /api/cart
Add item to cart / Səbətə element əlavə et

**Request Body / Sorğu Gövdəsi:**
```json
{
  "productId": "prod-1",
  "quantity": 2
}
```

#### PUT /api/cart
Update cart item quantity / Səbət elementinin miqdarını yenilə

#### DELETE /api/cart
Remove item from cart / Səbətdən element sil

### Orders / Sifarişlər

#### GET /api/orders
Get user's orders / İstifadəçinin sifarişlərini gətir

#### POST /api/orders
Create new order / Yeni sifariş yarat

**Request Body / Sorğu Gövdəsi:**
```json
{
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2
    }
  ],
  "addressId": "addr-1",
  "paymentMethod": "stripe"
}
```

### Admin APIs / Admin API-ləri

#### GET /api/admin/stats
Get admin statistics / Admin statistikalarını gətir

**Response / Cavab:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalProducts": 500,
    "totalOrders": 1200,
    "totalRevenue": 50000.00,
    "userGrowth": 15.5,
    "orderGrowth": 8.2,
    "revenueGrowth": 12.3
  }
}
```

#### GET /api/admin/users
Get all users (Admin only) / Bütün istifadəçiləri gətir (Yalnız Admin)

#### GET /api/admin/products
Get all products (Admin only) / Bütün məhsulları gətir (Yalnız Admin)

#### GET /api/admin/orders
Get all orders (Admin only) / Bütün sifarişləri gətir (Yalnız Admin)

## Error Handling / Xəta İdarəetməsi

All API endpoints return consistent error responses.
Bütün API endpoint-ləri ardıcıl xəta cavabları qaytarır.

**Error Response Format / Xəta Cavab Formatı:**
```json
{
  "success": false,
  "error": "Error message in English and Azerbaijani"
}
```

**Common HTTP Status Codes / Ümumi HTTP Status Kodları:**
- `200`: Success / Uğur
- `400`: Bad Request / Yanlış Sorğu
- `401`: Unauthorized / Yetkisiz
- `403`: Forbidden / Qadağan
- `404`: Not Found / Tapılmadı
- `500`: Internal Server Error / Daxili Server Xətası

## Rate Limiting / Sürət Məhdudiyyəti

API endpoints are rate limited to prevent abuse.
API endpoint-ləri sui-istifadəni qarşısını almaq üçün sürət məhdudlaşdırılıb.

- **General endpoints**: 100 requests per minute / Ümumi endpoint-lər: dəqiqədə 100 sorğu
- **Admin endpoints**: 200 requests per minute / Admin endpoint-lər: dəqiqədə 200 sorğu

## Examples / Nümunələr

### JavaScript / JavaScript
```javascript
// Get products
const response = await fetch('/api/products?page=1&limit=10');
const data = await response.json();

// Add to cart
const addToCart = async (productId, quantity) => {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      quantity
    })
  });
  return response.json();
};
```

### cURL / cURL
```bash
# Get products
curl -X GET "http://localhost:3000/api/products?page=1&limit=10"

# Add to cart
curl -X POST "http://localhost:3000/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod-1", "quantity": 2}'
```

## Support / Dəstək

For API support, please contact our development team.
API dəstəyi üçün inkişaf komandamızla əlaqə saxlayın.

- **Email**: support@yusu.com
- **Documentation**: https://docs.yusu.com
- **GitHub**: https://github.com/yusu-ecommerce
