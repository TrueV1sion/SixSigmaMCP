# Six Sigma MCP - Updated Configuration Instructions

## Quick Start

1. **Ensure Node.js is installed**:
   ```
   node --version
   ```

2. **Install dependencies**:
   ```
   cd C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server
   npm install @modelcontextprotocol/sdk
   ```

3. **Update Claude Desktop Configuration**:
   
   Edit your Claude Desktop config at:
   `C:\Users\jared\AppData\Roaming\Claude\claude_desktop_config.json`

   Replace the `six-sigma-mcp` entry with:
   ```json
   "six-sigma-mcp": {
     "command": "node",
     "args": [
       "C:/Users/jared/OneDrive/Desktop/SixSigmaMCP/mcp-server/six-sigma-server.js"
     ],
     "env": {}
   }
   ```

4. **Restart Claude Desktop**:
   - Close Claude Desktop completely (check system tray)
   - Restart Claude Desktop
   - The Six Sigma MCP tools should now be available

## Available Tools

1. **create_project** - Initialize a new Six Sigma DMAIC project
2. **define_phase** - Execute Define phase (VOC, CTQ, constraints)
3. **measure_phase** - Execute Measure phase (KPIs, baselines)
4. **analyze_phase** - Execute Analyze phase (RCA, FMEA)
5. **improve_phase** - Execute Improve phase (solution generation)
6. **control_phase** - Execute Control phase (monitoring, validation)
7. **get_project_status** - Check project status and progress
8. **check_phase_gate** - Verify phase gate criteria

## Usage Example

```
User: Create a Six Sigma project for an e-commerce platform

Claude: I'll help you create a Six Sigma project. Let me initialize it with the DMAIC methodology.

[Uses create_project tool]

User: Run the define phase

Claude: I'll execute the Define phase to analyze Voice of Customer, create the CTQ tree, and document constraints.

[Uses define_phase tool]

User: Check if we're ready for the next phase

Claude: Let me check the phase gate criteria.

[Uses check_phase_gate tool]
```

## Troubleshooting

If the MCP doesn't load:
1. Check Claude Desktop developer console (Ctrl+Shift+I) for errors
2. Verify Node.js is in your PATH
3. Ensure the MCP SDK is installed
4. Try the test command:
   ```
   node C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server\six-sigma-server.js
   ```
   You should see "Six Sigma MCP Server running"

## Implementation Status

✅ **Completed**:
- Full DMAIC phase implementation
- VOC analysis and CTQ tree generation
- KPI definition and baseline establishment
- Root cause analysis and FMEA
- Solution generation and evaluation
- Control plan and monitoring setup
- Phase gate criteria checking
- Quality score calculation

🚧 **Future Enhancements**:
- Integration with Claude API for AI-powered solution generation
- Persistent state management with Redis
- Multi-agent orchestration
- Real-time dashboards
- Advanced statistical analysis