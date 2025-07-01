#!/bin/bash

echo "🔧 Quick Puppeteer MCP Fix"
echo "=========================="
echo ""
echo "Run these commands to install the missing libraries:"
echo ""
echo "sudo apt-get update"
echo "sudo apt-get install -y libnss3 libnssutil3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2"
echo ""
echo "Or run this single command:"
echo "sudo apt-get update && sudo apt-get install -y libnss3 libnssutil3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2"
echo ""
echo "After installation, the Puppeteer MCP should work!"