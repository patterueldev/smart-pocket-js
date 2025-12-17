#!/usr/bin/env node

/**
 * GitHub Webhook Listener for QA Deployment
 * 
 * Listens for push events to main branch and triggers QA deployment.
 * Runs on homeserver - GitHub webhooks work with dynamic IPs using services like:
 * - ngrok (temporary public URL)
 * - Tailscale Funnel (permanent public URL)
 * - Cloudflare Tunnel (permanent public URL)
 * 
 * Usage:
 *   node webhook-listener.js
 * 
 * Environment Variables:
 *   WEBHOOK_SECRET - GitHub webhook secret (required)
 *   WEBHOOK_PORT - Port to listen on (default: 9000)
 *   PROJECT_PATH - Path to smart-pocket-js repo (default: current directory)
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Configuration
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 9000;
const PROJECT_PATH = process.env.PROJECT_PATH || path.join(__dirname, '../..');
const DEPLOY_SCRIPT = path.join(__dirname, 'deploy-qa-pull.sh');

if (!WEBHOOK_SECRET) {
  console.error('❌ Error: WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
  if (!signature) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Execute deployment script
function deployQA() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting QA deployment...');
    
    const deployProcess = exec(
      DEPLOY_SCRIPT,
      { 
        cwd: PROJECT_PATH,
        env: { ...process.env }
      }
    );
    
    let stdout = '';
    let stderr = '';
    
    deployProcess.stdout.on('data', (data) => {
      stdout += data;
      console.log(data.toString().trim());
    });
    
    deployProcess.stderr.on('data', (data) => {
      stderr += data;
      console.error(data.toString().trim());
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ QA deployment completed successfully');
        resolve({ success: true, stdout, stderr });
      } else {
        console.error(`❌ QA deployment failed with code ${code}`);
        reject({ success: false, code, stdout, stderr });
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'smart-pocket-webhook-listener',
    uptime: process.uptime()
  });
});

// Webhook endpoint - handles deployment notifications from GitHub Actions
app.post('/deploy', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  
  // Verify signature
  if (!verifySignature(req.body, signature)) {
    console.warn('⚠️  Invalid webhook signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
  console.log(`📨 Received webhook event: ${event}`);
  
  // Handle deployment event from GitHub Actions
  if (event === 'deployment') {
    const { repository, sha, actor, image_tag } = req.body;
    
    console.log(`✨ Deployment triggered by ${actor} in ${repository}`);
    console.log(`📦 Image: ${image_tag}`);
    console.log(`🔖 SHA: ${sha}`);
    
    // Respond immediately (don't wait for deployment)
    res.status(202).json({ 
      message: 'QA deployment started',
      repository,
      sha,
      image_tag
    });
    
    // Deploy in background
    try {
      await deployQA();
    } catch (error) {
      console.error('❌ Deployment error:', error);
    }
    
    return;
  }
  
  // Legacy: Handle direct push events (for backward compatibility)
  if (event === 'push') {
    const { ref, repository, pusher } = req.body;
    
    // Only deploy on push to main branch
    if (ref !== 'refs/heads/main') {
      console.log(`ℹ️  Ignoring push to ${ref}`);
      return res.json({ message: 'Not main branch, ignoring' });
    }
    
    console.log(`✨ Push to main by ${pusher.name} in ${repository.full_name}`);
    
    // Respond immediately
    res.status(202).json({ 
      message: 'Deployment started',
      ref,
      repository: repository.full_name
    });
    
    // Deploy in background
    try {
      await deployQA();
    } catch (error) {
      console.error('❌ Deployment error:', error);
    }
    
    return;
  }
  
  // Ignore other events
  console.log(`ℹ️  Ignoring ${event} event`);
  res.json({ message: 'Event ignored' });
});

// Start server
app.listen(WEBHOOK_PORT, () => {
  console.log(`🎧 Webhook listener running on port ${WEBHOOK_PORT}`);
  console.log(`📂 Project path: ${PROJECT_PATH}`);
  console.log(`📜 Deploy script: ${DEPLOY_SCRIPT}`);
  console.log('');
  console.log('Expose this server with:');
  console.log(`  - ngrok: ngrok http ${WEBHOOK_PORT}`);
  console.log(`  - Tailscale Funnel: tailscale funnel ${WEBHOOK_PORT}`);
  console.log(`  - Cloudflare Tunnel: cloudflared tunnel --url http://localhost:${WEBHOOK_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down webhook listener...');
  process.exit(0);
});
