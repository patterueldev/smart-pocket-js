# Webhook-Based QA Deployment Setup

This guide explains how to set up automatic QA deployment using GitHub webhooks with a dynamic IP residential ISP.

## Overview

Since your homeserver has a rotating IP from a residential ISP, we use **webhooks with a tunnel service**:

```
GitHub → Tunnel Service → Your Homeserver → QA Environment
         (ngrok/Tailscale/     (webhook         (Docker)
          Cloudflare)           listener)
```

The webhook listener runs on your homeserver and receives push notifications from GitHub through a public tunnel.

## Components

1. **webhook-listener.js** - Node.js server that receives webhooks
2. **deploy-qa.sh** - Bash script that performs the deployment
3. **Tunnel Service** - Exposes your local webhook listener (ngrok, Tailscale Funnel, or Cloudflare Tunnel)

## Setup Instructions

### 1. Generate Webhook Secret

```bash
# Generate a secure random secret
openssl rand -hex 32

# Save this - you'll need it for both GitHub and the listener
# Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 2. Choose and Setup a Tunnel Service

You need a tunnel to expose your local webhook listener to the internet.

#### Option A: ngrok (Easiest for Testing)

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start tunnel
ngrok http 9000

# Note the public URL: https://abcd-1234.ngrok-free.app
```

**Pros**: Quick setup, free tier available
**Cons**: URL changes on restart (free tier), requires account

#### Option B: Tailscale Funnel (Best for Permanent Setup)

```bash
# Install Tailscale
brew install tailscale  # macOS
# or visit https://tailscale.com/download

# Login and enable funnel
tailscale up
tailscale funnel 9000

# Get your permanent public URL
tailscale funnel status
# Example: https://your-machine.your-tailnet.ts.net
```

**Pros**: Permanent URL, no account signup, secure
**Cons**: Requires Tailscale installation

#### Option C: Cloudflare Tunnel (Production-Grade)

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create smart-pocket-webhook

# Start tunnel
cloudflared tunnel --url http://localhost:9000

# Get your permanent URL from Cloudflare dashboard
```

**Pros**: Production-grade, custom domains, permanent, DDoS protection
**Cons**: Requires Cloudflare account, more setup

### 3. Start Webhook Listener

```bash
cd /path/to/smart-pocket-js

# Set environment variables
export WEBHOOK_SECRET="your-secret-from-step-1"
export WEBHOOK_PORT=9000
export PROJECT_PATH="/path/to/smart-pocket-js"

# Install dependencies (if not already installed)
cd deploy/scripts
npm install express

# Start listener
node webhook-listener.js
```

You should see:
```
🎧 Webhook listener running on port 9000
📂 Project path: /path/to/smart-pocket-js
📜 Deploy script: /path/to/smart-pocket-js/deploy/scripts/deploy-qa.sh
```

### 4. Configure GitHub Webhook

1. Go to your repository: https://github.com/patterueldev/smart-pocket-js
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: Your tunnel URL + `/webhook`
     - ngrok: `https://abcd-1234.ngrok-free.app/webhook`
     - Tailscale: `https://your-machine.your-tailnet.ts.net/webhook`
     - Cloudflare: `https://webhook.yourdomain.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: Paste the secret from step 1
   - **Which events**: Select "Just the push event"
   - **Active**: ✓ Checked
4. Click **Add webhook**

### 5. Test the Webhook

```bash
# In another terminal, watch the webhook listener logs
# It should be running from step 3

# Now push to main branch (or merge a PR)
git push origin main
```

You should see in the webhook listener:
```
📨 Received webhook event: push
✨ Push to main by yourname in patterueldev/smart-pocket-js
🚀 Starting QA deployment...
📥 Pulling latest code from main branch...
✅ Code updated to latest main
🛑 Stopping QA environment...
...
✨ QA Deployment Complete!
```

## Running as a Service (Recommended)

### systemd (Linux)

Create `/etc/systemd/system/smart-pocket-webhook.service`:

```ini
[Unit]
Description=Smart Pocket Webhook Listener
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/smart-pocket-js/deploy/scripts
Environment="WEBHOOK_SECRET=your-secret-here"
Environment="WEBHOOK_PORT=9000"
Environment="PROJECT_PATH=/path/to/smart-pocket-js"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node webhook-listener.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable smart-pocket-webhook
sudo systemctl start smart-pocket-webhook
sudo systemctl status smart-pocket-webhook

# View logs
sudo journalctl -u smart-pocket-webhook -f
```

### launchd (macOS)

Create `~/Library/LaunchAgents/com.smartpocket.webhook.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.smartpocket.webhook</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/smart-pocket-js/deploy/scripts/webhook-listener.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>WEBHOOK_SECRET</key>
        <string>your-secret-here</string>
        <key>WEBHOOK_PORT</key>
        <string>9000</string>
        <key>PROJECT_PATH</key>
        <string>/path/to/smart-pocket-js</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/smart-pocket-webhook.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/smart-pocket-webhook.err</string>
</dict>
</plist>
```

Load and start:
```bash
launchctl load ~/Library/LaunchAgents/com.smartpocket.webhook.plist
launchctl start com.smartpocket.webhook

# View logs
tail -f /tmp/smart-pocket-webhook.log
```

## Deployment Flow

1. You merge a PR to `main` on GitHub
2. GitHub sends webhook to your tunnel URL
3. Tunnel forwards to your homeserver webhook listener (port 9000)
4. Webhook listener verifies signature and triggers `deploy-qa.sh`
5. Deployment script:
   - Pulls latest code
   - Stops QA environment
   - Builds new Docker images
   - Starts QA environment
   - Runs health check
6. QA is now running latest main branch

## Security Considerations

- ✅ Webhook signature verification prevents unauthorized deployments
- ✅ Only responds to push events on main branch
- ✅ Tunnel services provide HTTPS encryption
- ✅ No exposed SSH ports or database access
- ⚠️  Keep your webhook secret secure (use environment variables, not hardcoded)
- ⚠️  Consider IP allowlisting in tunnel service if available

## Troubleshooting

### Webhook not received

```bash
# Check webhook listener is running
curl http://localhost:9000/health

# Check tunnel is running
# For ngrok: Open http://localhost:4040 (ngrok dashboard)
# For Tailscale: tailscale funnel status
# For Cloudflare: Check cloudflared logs

# Check GitHub webhook delivery
# Go to Settings → Webhooks → Recent Deliveries
# Click on a delivery to see request/response
```

### Deployment fails

```bash
# Check deployment script logs
tail -f /tmp/smart-pocket-webhook.log  # If using systemd/launchd

# Manually test deployment script
cd /path/to/smart-pocket-js
./deploy/scripts/deploy-qa.sh

# Check Docker logs
pnpm run docker:quality -- logs -f
```

### Health check fails

```bash
# Check QA server is running
docker ps | grep smart-pocket

# Check server logs
pnpm run docker:quality -- logs smart-pocket-server-qa

# Test health endpoint manually
curl http://localhost:3002/health
```

## Alternative: Self-Hosted Runner (No Tunnel Needed!)

**Important**: Despite having a rotating IP, **self-hosted GitHub Actions runners still work** because they make outbound connections TO GitHub, not the other way around.

If you'd prefer to avoid webhooks and tunnels entirely, consider using a self-hosted runner instead. See `SELF_HOSTED_RUNNER.md` for setup instructions.

The runner approach is often simpler because:
- ✅ No tunnel service required
- ✅ No webhook configuration
- ✅ No exposed public endpoint
- ✅ Native GitHub Actions integration
- ✅ Can run smoke tests after deployment

## Monitoring

Consider setting up monitoring for:
- Webhook listener uptime
- Tunnel service health
- Deployment success/failure notifications
- QA environment health checks

You could integrate with:
- Slack/Discord notifications
- Email alerts
- Status page (UptimeRobot, StatusCake)

## Cost Comparison

| Service | Cost | Limits |
|---------|------|--------|
| ngrok Free | Free | 1 agent, URL changes on restart |
| ngrok Paid | $8/mo | Permanent URLs, custom domains |
| Tailscale | Free | Permanent URLs, 100 devices |
| Cloudflare Tunnel | Free | Unlimited tunnels, custom domains |
| Self-Hosted Runner | Free | No additional cost |

**Recommendation**: Use Tailscale Funnel for permanent free solution, or consider self-hosted runner for simplicity.
