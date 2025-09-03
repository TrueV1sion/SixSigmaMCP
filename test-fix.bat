@echo off
echo Testing Six Sigma MCP Server...
echo.

echo Step 1: Testing Node.js installation
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed successfully!
echo.

echo Step 2: Testing minimal server
cd /d "C:\Users\jared\OneDrive\Desktop\SixSigmaMCP\mcp-server"
echo Running: node minimal-test.js
echo (Press Ctrl+C to stop when you see "Six Sigma MCP ready")
echo.
node minimal-test.js
echo.

echo If you saw "Six Sigma MCP ready", the server is working!
echo.
echo Step 3: Next steps
echo 1. Close Claude Desktop completely (check system tray)
echo 2. Restart Claude Desktop
echo 3. Type "Test six sigma MCP" to see if the tool appears
echo.
echo Configuration has been updated to use direct Node.js execution.
echo.
pause