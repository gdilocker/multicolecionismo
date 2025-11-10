#!/bin/bash

# 🚀 COM.RICH - Pre-Deploy Validation Script
# Validates everything is ready for deployment

set -e

echo "🔍 COM.RICH - Validating deployment readiness..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 missing"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check env var
check_env() {
    if grep -q "^$1=" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 configured"
    else
        echo -e "${YELLOW}⚠${NC} $1 not found in .env"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "📁 Checking essential files..."
check_file "package.json"
check_file "index.html"
check_file "vite.config.ts"
check_file ".env"
check_file "netlify.toml"
check_file "_headers"

echo ""
echo "🔧 Checking environment variables..."
check_env "VITE_SUPABASE_URL"
check_env "VITE_SUPABASE_ANON_KEY"
check_env "VITE_SUPABASE_FUNCTIONS_URL"

echo ""
echo "📦 Checking public assets..."
check_file "public/favicon.svg"
check_file "public/manifest.json"
check_file "public/robots.txt"

echo ""
echo "🏗️ Testing build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build successful"

    # Check build output
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓${NC} dist/ directory created"

        BUILD_SIZE=$(du -sh dist/ | cut -f1)
        echo -e "${GREEN}✓${NC} Build size: $BUILD_SIZE"
    else
        echo -e "${RED}✗${NC} dist/ directory not found"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} Build failed"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📊 Validation Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Ready for deployment!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
    echo ""
    echo "⚠️  You can deploy, but review warnings above"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "❌ Fix errors before deploying"
    exit 1
fi
