# Six Sigma MCP - Setup Status

## What We've Created

1. **Multiple Server Versions** (in mcp-server folder):
   - `minimal-test.js` - Simplest version, no dependencies
   - `simple-server.js` - Basic version with MCP SDK
   - `server.js` - Full CommonJS version
   - `index.js` - ES modules version
   - `launch.bat` - Batch file to launch the server

2. **Current Configuration**:
   - Using `launch.bat` which runs `minimal-test.js`
   - Located at: `C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server\`

## Next Steps to Fix

### Option 1: Check Claude Developer Console
1. Open Claude Desktop
2. Press `Ctrl+Shift+I` to open Developer Tools
3. Go to Console tab
4. Look for any errors mentioning "six-sigma-mcp"
5. Share the error message for specific troubleshooting

### Option 2: Test Server Manually
1. Open Command Prompt
2. Run:
   ```
   cd C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server
   node minimal-test.js
   ```
3. If it shows "Six Sigma MCP ready", the server works
4. If not, you may need to install Node.js

### Option 3: Install Dependencies and Use Full Version
1. Open Command Prompt as Administrator
2. Run:
   ```
   cd C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server
   npm install @modelcontextprotocol/sdk
   ```
3. Update launch.bat to use `simple-server.js` instead of `minimal-test.js`
4. Restart Claude Desktop

### Option 4: Use NPM Package Approach
Create a proper npm package:
1. Run `npm init -y` in the mcp-server folder
2. Run `npm install @modelcontextprotocol/sdk`
3. Update config to use npx like other MCPs

## Most Likely Issues

1. **Node.js not installed or not in PATH**
   - Test: Run `node --version` in Command Prompt
   - Fix: Install from https://nodejs.org/

2. **File permissions**
   - The files might need different permissions
   - Try running Command Prompt as Administrator

3. **Path format issues**
   - Windows paths can be tricky
   - The current config uses escaped backslashes

## Quick Test

After restarting Claude Desktop, try typing:
"Test six sigma MCP"

If it works, you should see a tool option appear.

## Contact for Help

If none of these work, the error message from Claude's developer console will help identify the specific issue.