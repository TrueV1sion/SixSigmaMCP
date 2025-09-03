# Troubleshooting Six Sigma MCP

## Current Issue
The Six Sigma MCP is not loading in Claude Desktop. Here's how to fix it:

## Step 1: Test Basic Setup

1. Open Command Prompt
2. Navigate to the MCP folder:
   ```
   cd C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server
   ```

3. Test if Node.js is installed:
   ```
   node --version
   ```

4. Test the minimal server:
   ```
   node minimal-test.js
   ```
   
   You should see "Six Sigma MCP ready" in the console.

## Step 2: Install Dependencies

If the minimal test works, install the MCP SDK:

```
npm install @modelcontextprotocol/sdk
```

## Step 3: Test with Dependencies

After installing, test the simple server:

```
node simple-server.js
```

## Step 4: Update Claude Config

The configuration has been updated to use the minimal test server at:
`C:/Users/jared/OneDrive/Desktop/SixSigmaMCP/mcp-server/minimal-test.js`

## Step 5: Restart Claude Desktop

1. Completely close Claude Desktop (check system tray)
2. Reopen Claude Desktop
3. Check if "six-sigma-mcp" appears in available tools

## Common Issues

### "node is not recognized"
- Node.js might not be installed or not in PATH
- Install from: https://nodejs.org/

### "Cannot find module"
- Dependencies not installed
- Run: `npm install @modelcontextprotocol/sdk`

### MCP still not showing
- Check Claude's developer console (Ctrl+Shift+I) for errors
- Look for any error messages related to "six-sigma-mcp"

## Alternative: Use NPX

If direct node execution fails, try using npx like other MCPs:

```json
"six-sigma-mcp": {
  "command": "npx",
  "args": [
    "node",
    "C:/Users/jared/OneDrive/Desktop/SixSigmaMCP/mcp-server/simple-server.js"
  ],
  "env": {}
}
```