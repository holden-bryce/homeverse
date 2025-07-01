#!/bin/bash

# Install script for Puppeteer/Chrome dependencies on Ubuntu/Debian/WSL
echo "🚀 Installing Puppeteer/Chrome dependencies for MCP..."

# Update package list
echo "📦 Updating package list..."
sudo apt-get update

# Install Chrome dependencies
echo "🌐 Installing Chrome/Chromium dependencies..."
sudo apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils

# Install additional dependencies that might be needed
echo "📚 Installing additional libraries..."
sudo apt-get install -y \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxshmfence1

# Install Node.js dependencies for Puppeteer
echo "📦 Installing Node.js Puppeteer package..."
cd /mnt/c/Users/12486/homeverse/frontend
npm install puppeteer playwright

# Download browser binaries
echo "🌐 Downloading browser binaries..."
npx playwright install chromium
npx playwright install-deps chromium

# For Puppeteer specifically
node -e "require('puppeteer').createBrowserFetcher().download('chrome')"

echo "✅ Installation complete!"
echo ""
echo "🧪 Testing Puppeteer installation..."

# Test script
cat > test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('Browser launched successfully!');
    
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Puppeteer is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
EOF

node test-puppeteer.js

echo ""
echo "🎯 To run this installation script:"
echo "chmod +x install-puppeteer-deps.sh"
echo "./install-puppeteer-deps.sh"