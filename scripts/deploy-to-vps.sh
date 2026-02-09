#!/bin/bash

# VPS Deployment Script
# Automatically deploys the current project to the user's VPS

VPS_IP="107.172.71.233"
VPS_USER="root"

echo "========================================"
echo "🚀 Deploying OKDJW to VPS ($VPS_IP)"
echo "========================================"

# 1. Package the project (exclude heavy/unnecessary files)
echo "📦 Packaging project files..."
# Exclude node_modules, git, build artifacts, and hidden system files
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='.DS_Store' \
    --exclude='*.tar.gz' \
    -czf okdjw-deploy.tar.gz .

if [ ! -f "okdjw-deploy.tar.gz" ]; then
    echo "❌ Failed to create package."
    exit 1
fi

# 2. Upload files
echo "----------------------------------------"
echo "📤 Uploading files to server..."
echo "⚠️  PLEASE ENTER YOUR VPS PASSWORD IF ASKED"
echo "   (Password: I09FRzUl856qvTZ5yt)"
echo "----------------------------------------"

# 2. Automated Upload & Setup (Using Expect)
echo "----------------------------------------"
echo "🤖 Starting Automated Deployment..."
echo "----------------------------------------"

# Create temporary Expect script
cat <<EOF > deploy_temp.exp
#!/usr/bin/expect -f
set timeout -1

# SCP Upload
spawn scp -o StrictHostKeyChecking=no okdjw-deploy.tar.gz .env.local $VPS_USER@$VPS_IP:/root/
expect {
    "yes/no" { send "yes\r"; exp_continue }
    "password:" { send "I09FRzUl856qvTZ5yt\r" }
}
expect eof

# SSH Remote Setup
spawn ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "
    # Basic tools check
    if ! command -v tar &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y tar
        elif command -v yum &> /dev/null; then
            yum install -y tar
        fi
    fi

    echo '📂 Extracting files...'
    mkdir -p okdjw
    tar -xzf okdjw-deploy.tar.gz -C okdjw --overwrite
    mv .env.local okdjw/
    rm okdjw-deploy.tar.gz
    
    echo '⚙️  Running Setup...'
    cd okdjw
    chmod +x scripts/vps-setup.sh scripts/vps-run.sh
    ./scripts/vps-setup.sh
"
expect {
    "yes/no" { send "yes\r"; exp_continue }
    "password:" { send "I09FRzUl856qvTZ5yt\r" }
}
expect eof
EOF

# Run Expect Script
chmod +x deploy_temp.exp
./deploy_temp.exp

# Cleanup
rm deploy_temp.exp okdjw-deploy.tar.gz

echo "✅ DEPLOYMENT COMPLETE!"
# echo "   Please check the output above for any errors."
