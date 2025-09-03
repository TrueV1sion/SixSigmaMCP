# Six Sigma MCP - Fixed Configuration

## Step 1: Update Claude Desktop Configuration

Replace the `six-sigma-mcp` entry in your Claude Desktop config with one of these options:

### Option A: Direct Node Execution (Recommended)
```json
"six-sigma-mcp": {
  "command": "node",
  "args": [
    "C:/Users/jared/OneDrive/Desktop/SixSigmaMCP/mcp-server/minimal-test.js"
  ],
  "env": {}
}
```

### Option B: Using the Enhanced Launcher
```json
"six-sigma-mcp": {
  "command": "node",
  "args": [
    "C:/Users/jared/OneDrive/Desktop/SixSigmaMCP/mcp-server/fix-launcher.js",
    "minimal-test.js"
  ],
  "env": {}
}
```

### Option C: Using NPX with SDK (if dependencies are installed)
```json
"six-sigma-mcp": {
  "command": "node",
  "args": [
    "C:/Users/jared/OneDrive/Desktop/SixSigmaMCP/mcp-server/simple-server.js"
  ],
  "env": {}
}
```

## Step 2: Install Dependencies (for Option C)

If you want to use the full SDK version:
```bash
cd C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server
npm install
```

## Step 3: Test the Fix

1. Close Claude Desktop completely (check system tray)
2. Update the config file at: `C:\Users\jared\AppData\Roaming\Claude\claude_desktop_config.json`
3. Restart Claude Desktop
4. Type: "Test six sigma MCP" and see if the tool appears

## Why This Works

The issue was with using PowerShell as an intermediary. By using Node.js directly:
- Cleaner stdio communication
- No shell interpretation issues
- Better signal handling
- More reliable JSON-RPC messaging

## Verification

After restarting Claude, you should see:
- "six-sigma-mcp" in available tools
- The test tool "test_six_sigma" when typing related queries

## If Still Not Working

1. Open Claude Desktop Developer Console (Ctrl+Shift+I)
2. Look for errors containing "six-sigma-mcp"
3. Common fixes:
   - Ensure no spaces in the path
   - Check file permissions
   - Verify Node.js is in PATH: `node --version`