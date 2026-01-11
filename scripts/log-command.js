#!/usr/bin/env node
/**
 * Append an ISO timestamp to a per-command log file under .usage/
 * Usage: node scripts/log-command.js "command-name"
 */
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const command = process.argv[2] || 'unknown';
  const root = path.resolve(__dirname, '..');
  const usageDir = path.join(root, '.usage');
  ensureDir(usageDir);

  // Sanitize command name for safe filenames across platforms
  // Replace characters outside [A-Za-z0-9_.-] with underscore
  const safeName = String(command).replace(/[^A-Za-z0-9_.-]/g, '_');
  const file = path.join(usageDir, `${safeName}.log`);
  const line = new Date().toISOString();
  try {
    fs.appendFileSync(file, line + '\n', 'utf8');
    // Optional console for debugging
    // console.log(`[usage] ${command} → ${line}`);
  } catch (err) {
    console.error('[usage] Failed to write usage log:', { file, err });
    process.exitCode = 0; // do not fail the main command
  }
}

main();
