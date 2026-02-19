#!/bin/bash
# Install Node.js for MCP server
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Python dependencies
cd backend
pip install -r requirements.txt
