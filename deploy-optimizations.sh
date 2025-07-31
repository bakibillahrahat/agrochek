#!/bin/bash

# API Route Optimization Deployment Script
# This script backs up existing routes and replaces them with optimized versions

echo "🚀 Starting API Route Optimization Deployment..."

# Create backup directory
BACKUP_DIR="./api-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Created backup directory: $BACKUP_DIR"

# Backup existing routes
echo "💾 Backing up existing routes..."

# Create backup directory structure
mkdir -p "$BACKUP_DIR/app/api/clients"
mkdir -p "$BACKUP_DIR/app/api/clients/[id]"
mkdir -p "$BACKUP_DIR/app/api/orders"
mkdir -p "$BACKUP_DIR/app/api/samples"
mkdir -p "$BACKUP_DIR/app/api/agrotest"
mkdir -p "$BACKUP_DIR/app/api/reports"

# Backup existing routes
cp app/api/clients/route.ts "$BACKUP_DIR/app/api/clients/" 2>/dev/null || echo "⚠️  Clients route not found"
cp app/api/clients/[id]/route.ts "$BACKUP_DIR/app/api/clients/[id]/" 2>/dev/null || echo "⚠️  Clients [id] route not found"
cp app/api/orders/route.ts "$BACKUP_DIR/app/api/orders/" 2>/dev/null || echo "⚠️  Orders route not found"
cp app/api/samples/route.ts "$BACKUP_DIR/app/api/samples/" 2>/dev/null || echo "⚠️  Samples route not found"
cp app/api/agrotest/route.ts "$BACKUP_DIR/app/api/agrotest/" 2>/dev/null || echo "⚠️  Agrotest route not found"
cp app/api/reports/route.ts "$BACKUP_DIR/app/api/reports/" 2>/dev/null || echo "⚠️  Reports route not found"

echo "✅ Backup completed"

# Replace with optimized versions
echo "🔄 Replacing routes with optimized versions..."

# Replace main routes
mv app/api/clients/route-optimized.ts app/api/clients/route.ts 2>/dev/null || echo "⚠️  Optimized clients route not found"
mv app/api/clients/[id]/route-optimized.ts app/api/clients/[id]/route.ts 2>/dev/null || echo "⚠️  Optimized clients [id] route not found"
mv app/api/orders/route-optimized.ts app/api/orders/route.ts 2>/dev/null || echo "⚠️  Optimized orders route not found"
mv app/api/samples/route-optimized.ts app/api/samples/route.ts 2>/dev/null || echo "⚠️  Optimized samples route not found"
mv app/api/agrotest/route-optimized.ts app/api/agrotest/route.ts 2>/dev/null || echo "⚠️  Optimized agrotest route not found"
mv app/api/reports/route-optimized.ts app/api/reports/route.ts 2>/dev/null || echo "⚠️  Optimized reports route not found"

echo "✅ Routes replaced successfully"

# Check if optimized routes are in place
echo "🔍 Verifying optimization deployment..."

optimized_count=0
total_routes=6

if [ -f "app/api/clients/route.ts" ]; then
    if grep -q "getCachedClients\|pagination\|selectClause" "app/api/clients/route.ts"; then
        echo "✅ Clients route optimized"
        ((optimized_count++))
    else
        echo "⚠️  Clients route may not be optimized"
    fi
fi

if [ -f "app/api/orders/route.ts" ]; then
    if grep -q "getCachedOrders\|batch\|transaction" "app/api/orders/route.ts"; then
        echo "✅ Orders route optimized"
        ((optimized_count++))
    else
        echo "⚠️  Orders route may not be optimized"
    fi
fi

if [ -f "app/api/samples/route.ts" ]; then
    if grep -q "getCachedSamples\|pagination" "app/api/samples/route.ts"; then
        echo "✅ Samples route optimized"
        ((optimized_count++))
    else
        echo "⚠️  Samples route may not be optimized"
    fi
fi

if [ -f "app/api/agrotest/route.ts" ]; then
    if grep -q "getCachedAgrotests\|unstable_cache" "app/api/agrotest/route.ts"; then
        echo "✅ Agrotest route optimized"
        ((optimized_count++))
    else
        echo "⚠️  Agrotest route may not be optimized"
    fi
fi

if [ -f "app/api/reports/route.ts" ]; then
    if grep -q "getCachedReports\|pagination" "app/api/reports/route.ts"; then
        echo "✅ Reports route optimized"
        ((optimized_count++))
    else
        echo "⚠️  Reports route may not be optimized"
    fi
fi

if [ -f "app/api/clients/[id]/route.ts" ]; then
    if grep -q "selectClause\|includeStats" "app/api/clients/[id]/route.ts"; then
        echo "✅ Clients [id] route optimized"
        ((optimized_count++))
    else
        echo "⚠️  Clients [id] route may not be optimized"
    fi
fi

echo ""
echo "📊 Optimization Summary:"
echo "   Optimized routes: $optimized_count/$total_routes"
echo "   Backup location: $BACKUP_DIR"

if [ $optimized_count -eq $total_routes ]; then
    echo "🎉 All routes successfully optimized!"
else
    echo "⚠️  Some routes may need manual verification"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Test the optimized API endpoints"
echo "2. Apply database indexes (see DATABASE_OPTIMIZATION.md)"
echo "3. Monitor performance improvements"
echo "4. Update frontend code to use new pagination parameters"
echo ""
echo "💡 To rollback changes, restore files from: $BACKUP_DIR"
echo ""
echo "🚀 Optimization deployment completed!"
