#!/bin/bash

# VPS Setup Script for OKDJW Automation
# Usage: ./scripts/vps-setup.sh

echo "🚀 Starting VPS Environment Setup..."

# 1. Check for Node.js
# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js is not installed. Installing Node.js v20..."
    
    # Check for curl
    if ! command -v curl &> /dev/null; then
        echo "Installing curl..."
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y curl
        elif command -v yum &> /dev/null; then
            yum install -y curl
        fi
    fi

    # Install Node.js
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    else
        echo "❌ Unsupported OS package manager. Please install Node.js manually."
        exit 1
    fi
    
    echo "✅ Node.js installed!"
fi

echo "✅ Node.js found: $(node -v)"

# 2. Check for NPM/PNPM
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# 3. Install Dependencies
echo "📦 Installing project dependencies..."
npm ci
# Or if using pnpm: pnpm install

# Install md2wechat binary for WeChat Sync
if ! command -v md2wechat &> /dev/null; then
    echo "📦 Installing md2wechat tool..."
    curl -Lo md2wechat https://github.com/geekjourneyx/md2wechat-skill/releases/latest/download/md2wechat-linux-amd64
    chmod +x md2wechat
    mv md2wechat /usr/local/bin/
    echo "✅ md2wechat installed!"
fi

# 4. Check .env.local
if [ ! -f .env.local ]; then
    echo "⚠️ .env.local file not found!"
    echo "👉 Please upload your .env.local file to this directory:"
    echo "   $(pwd)/.env.local"
else
    echo "✅ .env.local found."
fi

# 5. Permissions
chmod +x scripts/vps-run.sh

echo "🎉 Setup Complete!"
echo "-----------------------------------"
echo "Next Steps:"
echo "1. Ensure .env.local is populated with your secrets."
echo "2. Get your VPS Public IP: curl ifconfig.me"
echo "3. Add that IP to WeChat Official Account Whitelist."
echo "4. Add to Crontab (Run every day at 12:00 - Noon):"
echo "   crontab -e"
echo "   0 12 * * * $(pwd)/scripts/vps-run.sh >> $(pwd)/cron.log 2>&1"
