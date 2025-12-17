# QA Deployment Setup Guide

Complete guide for setting up automatic QA deployment using GitHub Actions + Cloudflare Tunnel.

## Overview

This setup uses a **hybrid approach** where GitHub builds and stores Docker images, then notifies your homeserver to pull and deploy:

```
1. PR Merge to main
   ↓
2. GitHub Actions builds Docker image
   ↓
3. Push to GitHub Container Registry (ghcr.io)
   ↓
4. Webhook → Cloudflare Tunnel → Your Homeserver
   ↓
5. Homeserver pulls image and restarts QA
```

**Benefits:**
- ✅ Heavy building happens on GitHub's infrastructure (free for public repos)
- ✅ Homeserver only pulls pre-built images (fast, lightweight)
- ✅ Works with dynamic IP (no static IP needed)
- ✅ Secure with signature verification

## Prerequisites

- [ ] GitHub repository (public or private)
- [ ] Homeserver with Docker installed
- [ ] Cloudflare account (free tier works)
- [ ] Node.js installed on homeserver

## Part 1: Setup Cloudflare Tunnel

Cloudflare Tunnel creates a secure connection from your homeserver to the internet, bypassing firewall/NAT issues.

### 1.1 Install cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
# Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Or use package manager
# Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### 1.2 Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens your browser to authorize. Choose your domain/zone.

### 1.3 Create a Tunnel

```bash
cloudflared tunnel create smart-pocket-webhook
```

Note the **Tunnel ID** - you'll need this later.

### 1.4 Create Tunnel Configuration

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR-TUNNEL-ID-HERE
credentials-file: /Users/youruser/.cloudflared/YOUR-TUNNEL-ID-HERE.json

ingress:
  # Route webhook subdomain to local webhook listener
  - hostname: webhook.yourdomain.com
    service: http://localhost:9000
  
  # Catch-all rule (required)
  - service: http_status:404
```

Replace:
- `YOUR-TUNNEL-ID-HERE` with your actual tunnel ID
- `webhook.yourdomain.com` with your desired subdomain
- `/Users/youruser` with your actual home directory

### 1.5 Create DNS Record

```bash
cloudflared tunnel route dns smart-pocket-webhook webhook.yourdomain.com
```

This creates a CNAME record pointing `webhook.yourdomain.com` to your tunnel.

### 1.6 Test the Tunnel

```bash
# Start tunnel
cloudflared tunnel run smart-pocket-webhook

# In another terminal, test with a simple HTTP server
python3 -m http.server 9000

# Visit https://webhook.yourdomain.com in browser
# You should see the Python server directory listing
```

If it works, **Ctrl+C** to stop both servers.

### 1.7 Run Tunnel as a Service

**macOS (launchd):**
```bash
cloudflared service install
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

**Linux (systemd):**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

Verify it's running:
```bash
# macOS
sudo launchctl list | grep cloudflared

# Linux
sudo systemctl status cloudflared
```

## Part 2: Setup Webhook Listener on Homeserver

### 2.1 Generate Webhook Secret

```bash
openssl rand -hex 32
```

Save this secret - you'll use it in both GitHub and the webhook listener.

Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 2.2 Install Dependencies

```bash
cd /path/to/smart-pocket-js/deploy/scripts
npm install express
```

### 2.3 Configure Environment Variables

Create `/path/to/smart-pocket-js/.env.webhook`:

```bash
# Webhook configuration
WEBHOOK_SECRET=your-secret-from-step-2.1
WEBHOOK_PORT=9000
PROJECT_PATH=/path/to/smart-pocket-js

# GitHub Container Registry (for private repos)
# Leave empty for public repos
GITHUB_USERNAME=
GITHUB_TOKEN=
```

**For private repositories only:**
- Create a Personal Access Token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Scopes needed: `read:packages`
- Add username and token to `.env.webhook`

### 2.4 Test Webhook Listener

```bash
cd /path/to/smart-pocket-js/deploy/scripts

# Load environment variables
set -a
source ../../.env.webhook
set +a

# Start listener
node webhook-listener.js
```

You should see:
```
🎧 Webhook listener running on port 9000
📂 Project path: /path/to/smart-pocket-js
📜 Deploy script: /path/to/smart-pocket-js/deploy/scripts/deploy-qa-pull.sh
```

Test it's accessible via tunnel:
```bash
curl https://webhook.yourdomain.com/health
```

Should return:
```json
{"status":"ok","service":"smart-pocket-webhook-listener","uptime":...}
```

If this works, **Ctrl+C** to stop the listener.

### 2.5 Run Webhook Listener as a Service

**macOS (launchd):**

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
    <key>WorkingDirectory</key>
    <string>/path/to/smart-pocket-js/deploy/scripts</string>
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

Replace placeholders and load:
```bash
launchctl load ~/Library/LaunchAgents/com.smartpocket.webhook.plist
launchctl start com.smartpocket.webhook

# View logs
tail -f /tmp/smart-pocket-webhook.log
```

**Linux (systemd):**

Create `/etc/systemd/system/smart-pocket-webhook.service`:

```ini
[Unit]
Description=Smart Pocket Webhook Listener
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/smart-pocket-js/deploy/scripts
EnvironmentFile=/path/to/smart-pocket-js/.env.webhook
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

## Part 3: Configure GitHub

### 3.1 Add Repository Secrets

Go to your repository: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

1. **QA_WEBHOOK_URL**
   - Value: `https://webhook.yourdomain.com/deploy`
   
2. **QA_WEBHOOK_SECRET**
   - Value: Your secret from Part 2, step 2.1

### 3.2 Enable GitHub Container Registry

The workflow will automatically push to GitHub Container Registry (ghcr.io). No additional setup needed - it uses `GITHUB_TOKEN` automatically.

Images will be stored at: `ghcr.io/patterueldev/smart-pocket-js/server:qa`

### 3.3 Workflow is Already Committed

The workflow file `.github/workflows/deploy-qa.yml` is already in your repository. It will:

1. Trigger on push to `main` branch (only if server/config files changed)
2. Build Docker image
3. Push to GitHub Container Registry
4. Send webhook to your homeserver

## Part 4: Test the Complete Flow

### 4.1 Make a Test Change

```bash
# Make a small change to trigger deployment
echo "# Test change" >> packages/server/README.md

git add packages/server/README.md
git commit -m "test: trigger QA deployment"
git push origin main
```

### 4.2 Watch the Deployment

**On GitHub:**
- Go to **Actions** tab
- Click on the running workflow
- Watch the build and push steps

**On Your Homeserver:**
```bash
# Watch webhook listener logs
tail -f /tmp/smart-pocket-webhook.log   # macOS
# or
sudo journalctl -u smart-pocket-webhook -f   # Linux

# Watch QA environment logs
cd /path/to/smart-pocket-js
pnpm run docker:quality -- logs -f
```

### 4.3 Verify Deployment

```bash
# Check QA health
curl http://localhost:3002/health

# Should return something like:
# {"status":"ok","environment":"qa"}
```

## Troubleshooting

### Webhook not received

```bash
# Check Cloudflare tunnel is running
cloudflared tunnel info smart-pocket-webhook

# Check webhook listener is running
curl https://webhook.yourdomain.com/health

# Check GitHub webhook deliveries
# Go to: Settings → Webhooks → Recent Deliveries
# (Note: webhook is sent from Actions, not as a repo webhook)
```

### Deployment fails

```bash
# Check webhook listener logs
tail -f /tmp/smart-pocket-webhook.log

# Manually test deployment
cd /path/to/smart-pocket-js
./deploy/scripts/deploy-qa-pull.sh

# Check if image exists
docker images | grep smart-pocket-server
```

### Image pull fails

```bash
# For public repos, no auth needed
# For private repos, make sure GITHUB_TOKEN is set

# Test manual pull
docker pull ghcr.io/patterueldev/smart-pocket-js/server:qa

# Login manually if needed
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

### Health check fails

```bash
# Check QA containers
docker ps | grep qa

# Check server logs
pnpm run docker:quality -- logs smart-pocket-server-qa

# Check if port 3002 is available
lsof -i :3002
```

## Maintenance

### View Logs

```bash
# Webhook listener
tail -f /tmp/smart-pocket-webhook.log

# Cloudflare tunnel
cloudflared tunnel info smart-pocket-webhook

# QA environment
pnpm run docker:quality -- logs -f
```

### Restart Services

```bash
# Restart webhook listener (macOS)
launchctl stop com.smartpocket.webhook
launchctl start com.smartpocket.webhook

# Restart webhook listener (Linux)
sudo systemctl restart smart-pocket-webhook

# Restart Cloudflare tunnel
sudo systemctl restart cloudflared  # Linux
sudo launchctl kickstart -k system/com.cloudflare.cloudflared  # macOS
```

### Manual Deployment

```bash
cd /path/to/smart-pocket-js
./deploy/scripts/deploy-qa-pull.sh
```

## Security Notes

- ✅ Webhook signature verification prevents unauthorized deployments
- ✅ Cloudflare Tunnel provides HTTPS encryption
- ✅ No exposed SSH ports or database access
- ✅ Images stored in GitHub Container Registry (private or public)
- ⚠️  Keep webhook secret secure (use environment variables)
- ⚠️  For private repos, protect GitHub token with proper scopes

## Cost

- **Cloudflare Tunnel**: FREE (unlimited)
- **GitHub Actions**: FREE for public repos (2,000 min/month for private)
- **GitHub Container Registry**: FREE for public images (500MB for private)
- **Homeserver**: You already have it!

**Total: $0/month** ✨
