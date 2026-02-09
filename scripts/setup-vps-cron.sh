#!/bin/bash

# VPS Cron Setup Script
# Automatically adds the cron job to the remote VPS

VPS_IP="107.172.71.233"
VPS_USER="root"

echo "========================================"
echo "⏰ Setting up Cron Job on VPS ($VPS_IP)"
echo "========================================"

# Create temporary Expect script
cat <<EOF > cron_setup_temp.exp
#!/usr/bin/expect -f
set timeout -1

# SSH and Setup Cron
spawn ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "
    # Define the cron job line
    CRON_CMD=\"0 8 * * * /root/okdjw/scripts/vps-run.sh >> /root/okdjw/cron.log 2>&1\"
    
    # Check if job already exists to avoid duplicates
    # We use backslash to escape $ for Tcl, forcing it to send a literal $ to the remote shell
    # Use triple backslash in bash to get single backslash in output file for Tcl
    (crontab -l 2>/dev/null | grep -F \"vps-run.sh\") || (crontab -l 2>/dev/null; echo \"\\\$CRON_CMD\") | crontab -
    
    echo '✅ Current Crontab:'
    crontab -l
"
expect {
    "yes/no" { send "yes\r"; exp_continue }
    "password:" { send "I09FRzUl856qvTZ5yt\r" }
}
expect eof
EOF

# Run Expect Script
chmod +x cron_setup_temp.exp
./cron_setup_temp.exp

# Cleanup
rm cron_setup_temp.exp

echo "----------------------------------------"
echo "✅ CRON SETUP COMPLETE!"
