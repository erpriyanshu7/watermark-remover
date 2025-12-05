#!/bin/bash

echo "🚀 AI Watermark Remover - Auto Deploy"
echo "======================================"

# Create directory structure
mkdir -p public utils api

# Copy files to correct locations
cp index.html public/
cp style.css public/
cp watermark.js utils/
cp process.js api/
cp vercel.json .

echo "📁 Files organized successfully!"

# Initialize git
git init
git add .
git commit -m "🚀 AI Watermark Remover v2.0"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment Complete!"
echo "🔗 Your site is live at: "
