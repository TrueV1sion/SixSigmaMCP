#!/usr/bin/env node

// Enhanced launcher with better error handling and logging
const { spawn } = require('child_process');
const path = require('path');

// Log to stderr to avoid interfering with JSON-RPC
const log = (msg) => console.error(`[Six Sigma MCP] ${new Date().toISOString()} - ${msg}`);

log('Starting Six Sigma MCP Server...');

// Determine which server to use
const serverFile = process.argv[2] || 'minimal-test.js';
const serverPath = path.join(__dirname, serverFile);

log(`Using server: ${serverPath}`);

// Spawn the actual server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: false,
  windowsHide: true
});

// Forward stdin to server
process.stdin.pipe(server.stdin);

// Forward server stdout to our stdout (JSON-RPC messages)
server.stdout.pipe(process.stdout);

// Forward server stderr to our stderr (logs)
server.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle server exit
server.on('exit', (code, signal) => {
  log(`Server exited with code ${code} and signal ${signal}`);
  process.exit(code || 0);
});

// Handle errors
server.on('error', (err) => {
  log(`Server error: ${err.message}`);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...');
  server.kill('SIGTERM');
});

log('Launcher ready, forwarding to server...');