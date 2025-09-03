@echo off
echo Testing Six Sigma MCP Server...
echo.
cd /d C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server

echo Installing dependencies...
call npm install @modelcontextprotocol/sdk

echo.
echo Testing the server...
node simple-server.js

pause