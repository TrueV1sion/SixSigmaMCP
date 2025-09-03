@echo off
echo ==================================
echo Six Sigma MCP Server Test
echo ==================================
echo.

cd /d "%~dp0mcp-server"

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install @modelcontextprotocol/sdk
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Running server test...
node test-six-sigma.js

echo.
pause