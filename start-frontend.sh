#!/bin/bash
echo "============================================"
echo "  Starting E-Commerce Frontend Server"
echo "============================================"
echo ""
echo "Frontend will be available at: http://localhost:8081"
echo ""

cd "$(dirname "$0")/frontend"
"$(dirname "$0")/venv/Scripts/python" -m http.server 8081
