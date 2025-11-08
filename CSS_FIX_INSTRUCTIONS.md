# CSS və Static Fayllar Probleminin Həlli / CSS and Static Files Issue Resolution

## Problem / Problem
Browser-də CSS və JavaScript faylları `text/plain` MIME type ilə yüklənir və 404 xətaları alınır.

## Həll / Solution

### 1. Browser Cache Təmizləmə / Clear Browser Cache

**Chrome/Edge:**
- `Ctrl+Shift+Delete` (Windows/Linux) və ya `Cmd+Shift+Delete` (Mac)
- "Cached images and files" seçin
- "Clear data" düyməsini basın
- Və ya `Ctrl+Shift+R` (Windows/Linux) və ya `Cmd+Shift+R` (Mac) ilə hard refresh edin

**Firefox:**
- `Ctrl+Shift+Delete` (Windows/Linux) və ya `Cmd+Shift+Delete` (Mac)
- "Cache" seçin
- "Clear Now" düyməsini basın
- Və ya `Ctrl+F5` (Windows/Linux) və ya `Cmd+Shift+R` (Mac) ilə hard refresh edin

**Safari:**
- `Cmd+Option+E` ilə cache təmizləyin
- Və ya `Cmd+Shift+R` ilə hard refresh edin

### 2. Server Restart / Serveri Yenidən Başlatmaq

```bash
# Serveri dayandırın / Stop the server
cd /Users/dijital_human/Documents/Documents/WEB/Yusu.com/yusu-seller
kill -9 $(lsof -ti:3002)

# .next qovluğunu silin / Remove .next directory
rm -rf .next

# Serveri yenidən başladın / Restart the server
npm run dev
```

### 3. Development Mode-da Test / Testing in Development Mode

1. Serverin işlədiyindən əmin olun / Make sure server is running:
   ```bash
   lsof -ti:3002
   ```

2. Browser-də `http://localhost:3002/` açın

3. Developer Tools açın (F12) və Network tab-ına baxın

4. CSS faylının `Content-Type: text/css` olduğunu yoxlayın

### 4. Əgər Problem Davam Edərsə / If Problem Persists

1. **Node modules yeniləyin / Update node modules:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Next.js cache təmizləyin / Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

3. **Port müxtəlifdirsə yoxlayın / Check if port is different:**
   ```bash
   lsof -i :3002
   ```

## Yoxlama / Verification

CSS faylının düzgün yükləndiyini yoxlamaq üçün:

```bash
curl -I http://localhost:3002/_next/static/css/app/layout.css
```

Cavabda `Content-Type: text/css; charset=UTF-8` olmalıdır.

## Qeyd / Note

Next.js development server avtomatik olaraq düzgün MIME type-ları təmin edir. Problem əsasən browser cache-dən qaynaqlanır.

