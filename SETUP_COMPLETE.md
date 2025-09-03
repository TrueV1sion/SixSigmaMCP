# Six Sigma MCP Setup Instructions

## ✅ MCP Added to Claude Configuration!

The Six Sigma MCP has been successfully added to your Claude Desktop configuration.

## 🚀 To activate it:

1. **First-time setup** (run once):
   ```
   cd C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server
   setup.bat
   ```
   This will install dependencies and build the TypeScript files.

2. **Restart Claude Desktop**:
   - Close Claude Desktop completely
   - Reopen Claude Desktop

3. **Verify the MCP is loaded**:
   - In a new Claude conversation, you should see "six-sigma-mcp" in the available tools
   - Try: "Create a new Six Sigma project for building a payment system"

## 📋 Available Commands:

Once activated, you can use these commands in Claude:

- `create_project` - Start a new DMAIC project
- `define_phase` - Run Define phase (VOC, CTQ, Constraints)
- `measure_phase` - Run Measure phase (KPIs, Baselines)
- `analyze_phase` - Run Analyze phase (RCA, FMEA)
- `improve_phase` - Run Improve phase (Solution Generation)
- `control_phase` - Run Control phase (Validation, Monitoring)
- `get_project_status` - Check current project status

## 🛠️ Troubleshooting:

If the MCP doesn't appear:
1. Check that Node.js is installed: `node --version`
2. Run setup.bat to ensure everything is built
3. Check Claude's developer console for errors
4. Ensure the path in the config is correct

## 📂 File Locations:

- **MCP Server**: `C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server\`
- **Config File**: `C:\Users\jared\AppData\Roaming\Claude\claude_desktop_config.json`
- **Protocol Definition**: `C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\protocol\six_sigma_mcp_protocol.dsx`