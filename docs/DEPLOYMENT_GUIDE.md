# Yusu E-commerce Deployment Guide / Yusu E-ticarət Deploy Təlimatı

## Overview / Ümumi Baxış

This guide covers deploying the Yusu E-commerce platform to production.
Bu təlimat Yusu E-ticarət platformasının production-a deploy edilməsini əhatə edir.

## Prerequisites / Tələblər

- Node.js 18+ installed / Node.js 18+ quraşdırılmış
- Git installed / Git quraşdırılmış
- Vercel account / Vercel hesabı
- Domain name (optional) / Domain adı (istəyə bağlı)

## Deployment Options / Deploy Seçənəkləri

### Option 1: Vercel (Recommended) / Seçənək 1: Vercel (Tövsiyə edilir)

#### Step 1: Prepare Repository / Addım 1: Repository Hazırla

1. **Push to GitHub / GitHub-a Push Et:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Create .env.production file / .env.production faylı yarat:**
```env
# Database / Veritabanı
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth / NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers / OAuth Provider-lər
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_CLIENT_SECRET="your-apple-client-secret"

# Stripe / Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

#### Step 2: Deploy to Vercel / Addım 2: Vercel-ə Deploy Et

1. **Go to Vercel Dashboard / Vercel Dashboard-a Get:**
   - Visit https://vercel.com
   - Sign in with GitHub / GitHub ilə giriş et

2. **Import Project / Layihəni İmport Et:**
   - Click "New Project" / "Yeni Layihə" düyməsini bas
   - Select your GitHub repository / GitHub repository-ni seç
   - Click "Import" / "İmport" düyməsini bas

3. **Configure Environment Variables / Mühit Dəyişənlərini Konfiqurasiya Et:**
   - Go to Project Settings / Layihə Tənzimləmələrinə get
   - Add all environment variables from .env.production / .env.production-dan bütün mühit dəyişənlərini əlavə et

4. **Deploy / Deploy Et:**
   - Click "Deploy" / "Deploy" düyməsini bas
   - Wait for deployment to complete / Deploy-in tamamlanmasını gözlə

#### Step 3: Database Setup / Addım 3: Veritabanı Quraşdırması

1. **Create PostgreSQL Database / PostgreSQL Veritabanı Yarat:**
   - Use Vercel Postgres / Vercel Postgres istifadə et
   - Or external service like Supabase / Və ya Supabase kimi xarici xidmət

2. **Run Migrations / Migration-ları Çalışdır:**
```bash
npx prisma migrate deploy
```

3. **Seed Database / Veritabanını Doldur:**
```bash
npm run db:seed
```

### Option 2: Self-Hosted / Seçənək 2: Öz Hostinq

#### Step 1: Server Setup / Addım 1: Server Quraşdırması

1. **Choose VPS Provider / VPS Provider Seç:**
   - DigitalOcean, AWS, Linode, etc. / DigitalOcean, AWS, Linode və s.

2. **Install Dependencies / Asılılıqları Quraşdır:**
```bash
# Update system / Sistemi yenilə
sudo apt update && sudo apt upgrade -y

# Install Node.js / Node.js quraşdır
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 / PM2 quraşdır
sudo npm install -g pm2

# Install Nginx / Nginx quraşdır
sudo apt install nginx -y
```

#### Step 2: Application Setup / Addım 2: Tətbiq Quraşdırması

1. **Clone Repository / Repository-ni Klonla:**
```bash
git clone https://github.com/yourusername/yusu-ecommerce.git
cd yusu-ecommerce
```

2. **Install Dependencies / Asılılıqları Quraşdır:**
```bash
npm install
```

3. **Build Application / Tətbiqi Build Et:**
```bash
npm run build
```

4. **Start with PM2 / PM2 ilə Başlat:**
```bash
pm2 start npm --name "yusu-ecommerce" -- start
pm2 save
pm2 startup
```

#### Step 3: Nginx Configuration / Addım 3: Nginx Konfiqurasiyası

1. **Create Nginx Config / Nginx Konfiq Yarat:**
```bash
sudo nano /etc/nginx/sites-available/yusu-ecommerce
```

2. **Add Configuration / Konfiqurasiya Əlavə Et:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable Site / Saytı Aktivləşdir:**
```bash
sudo ln -s /etc/nginx/sites-available/yusu-ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Domain Configuration / Domain Konfiqurasiyası

### Step 1: DNS Setup / Addım 1: DNS Quraşdırması

1. **Point Domain to Server / Domain-i Server-ə Yönləndir:**
   - A Record: `@` → `your-server-ip`
   - CNAME: `www` → `yourdomain.com`

2. **SSL Certificate / SSL Sertifikatı:**
```bash
# Install Certbot / Certbot quraşdır
sudo apt install certbot python3-certbot-nginx -y

# Get SSL Certificate / SSL Sertifikatı Al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 2: Environment Variables / Addım 2: Mühit Dəyişənləri

Update your production environment variables:
Production mühit dəyişənlərini yenilə:

```env
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="postgresql://username:password@host:port/database"
```

## Monitoring / Monitorinq

### Health Checks / Sağlamlıq Yoxlamaları

1. **Create Health Check Endpoint / Sağlamlıq Yoxlama Endpoint-i Yarat:**
```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
```

2. **Set up Monitoring / Monitorinq Quraşdır:**
   - Uptime monitoring / Uptime monitorinqi
   - Error tracking / Xəta izləmə
   - Performance monitoring / Performans monitorinqi

## Backup Strategy / Backup Strategiyası

### Database Backup / Veritabanı Backup-u

1. **Automated Backups / Avtomatik Backup-lar:**
```bash
# Create backup script / Backup script yarat
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Schedule with Cron / Cron ilə Planla:**
```bash
# Add to crontab / Crontab-a əlavə et
0 2 * * * /path/to/backup-script.sh
```

## Security / Təhlükəsizlik

### Security Headers / Təhlükəsizlik Başlıqları

Already configured in `next.config.ts`:
Artıq `next.config.ts`-də konfiqurasiya edilib:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      ],
    },
  ];
}
```

### Additional Security / Əlavə Təhlükəsizlik

1. **Rate Limiting / Sürət Məhdudiyyəti**
2. **CORS Configuration / CORS Konfiqurasiyası**
3. **Input Validation / Giriş Doğrulaması**
4. **SQL Injection Prevention / SQL Injection Qarşısını Alma**

## Troubleshooting / Problemlərin Həlli

### Common Issues / Ümumi Problemlər

1. **Build Failures / Build Uğursuzluqları:**
   - Check Node.js version / Node.js versiyasını yoxla
   - Clear cache: `rm -rf .next node_modules && npm install`
   - Check environment variables / Mühit dəyişənlərini yoxla

2. **Database Connection Issues / Veritabanı Bağlantı Problemləri:**
   - Verify DATABASE_URL / DATABASE_URL-i yoxla
   - Check database server status / Veritabanı server statusunu yoxla
   - Run migrations / Migration-ları çalışdır

3. **Authentication Issues / Autentifikasiya Problemləri:**
   - Verify OAuth credentials / OAuth məlumatlarını yoxla
   - Check NEXTAUTH_URL / NEXTAUTH_URL-i yoxla
   - Verify redirect URLs / Yönləndirmə URL-lərini yoxla

## Support / Dəstək

For deployment support, contact our team:
Deploy dəstəyi üçün komandamızla əlaqə saxlayın:

- **Email**: dev@yusu.com
- **Documentation**: https://docs.yusu.com
- **GitHub Issues**: https://github.com/yusu-ecommerce/issues
