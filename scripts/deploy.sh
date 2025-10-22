#!/bin/bash

# Yusu Seller Deployment Script
echo "🚀 Starting Yusu Seller Deployment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# 3. Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# 4. Build the application
echo "🏗️ Building application..."
npm run build

# 5. Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is now live at: https://seller.yusu.com"
