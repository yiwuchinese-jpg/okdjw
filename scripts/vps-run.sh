#!/bin/bash

# VPS Automation Entry Point
# This script is intended to be run by cron

# Navigate to project directory (crucial for cron)
cd "$(dirname "$0")/.."

# Load node environment if necessary (sometimes cron doesn't have same path)
# Load node environment if necessary (sometimes cron doesn't have same path)
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

echo "Starting Daily Automation: $(date)"

# 1. Fetch RSS and Generate Content
echo ">>> Step 1: Fetching RSS..."
npx tsx scripts/fetch-rss.ts

# 2. Sync Translations
echo ">>> Step 2: Syncing Translations..."
npx tsx scripts/sync-translations.ts

# 3. Sync to WeChat
echo ">>> Step 3: Syncing to WeChat..."
npx tsx scripts/sync-wechat.ts

echo "Automation Finished: $(date)"
echo "---------------------------------------------"
