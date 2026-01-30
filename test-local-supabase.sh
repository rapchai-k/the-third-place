#!/bin/bash

echo "🔍 Testing Local Supabase Setup"
echo "================================"
echo ""

# Check if Supabase is running
echo "1️⃣ Checking if Supabase is running..."
if ! supabase status &> /dev/null; then
    echo "❌ Supabase is not running!"
    echo "   Run: supabase start"
    exit 1
fi
echo "✅ Supabase is running"
echo ""

# Get Supabase details
echo "2️⃣ Getting Supabase configuration..."
SUPABASE_URL=$(supabase status | grep "API URL:" | awk '{print $3}')
PUBLISHABLE_KEY=$(supabase status | grep "Publishable key:" | awk '{print $3}')

echo "   URL: $SUPABASE_URL"
echo "   Key: ${PUBLISHABLE_KEY:0:30}..."
echo ""

# Check .env.local
echo "3️⃣ Checking .env.local file..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "   Run: ./update-local-env.sh"
    exit 1
fi

ENV_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
ENV_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)

echo "   .env.local URL: $ENV_URL"
echo "   .env.local Key: ${ENV_KEY:0:30}..."
echo ""

# Compare keys
echo "4️⃣ Verifying keys match..."
if [ "$SUPABASE_URL" != "$ENV_URL" ]; then
    echo "❌ URLs don't match!"
    echo "   Supabase: $SUPABASE_URL"
    echo "   .env.local: $ENV_URL"
    echo "   Run: ./update-local-env.sh"
    exit 1
fi

if [ "$PUBLISHABLE_KEY" != "$ENV_KEY" ]; then
    echo "❌ Keys don't match!"
    echo "   Supabase: $PUBLISHABLE_KEY"
    echo "   .env.local: $ENV_KEY"
    echo "   Run: ./update-local-env.sh"
    exit 1
fi

echo "✅ Keys match!"
echo ""

# Test API connection
echo "5️⃣ Testing API connection..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $PUBLISHABLE_KEY" \
    -H "Authorization: Bearer $PUBLISHABLE_KEY" \
    "$SUPABASE_URL/rest/v1/")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ API connection successful (HTTP $RESPONSE)"
else
    echo "❌ API connection failed (HTTP $RESPONSE)"
    echo "   This might indicate an issue with the Supabase instance"
fi
echo ""

# Test events table query
echo "6️⃣ Testing events table query..."
EVENTS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "apikey: $PUBLISHABLE_KEY" \
    -H "Authorization: Bearer $PUBLISHABLE_KEY" \
    "$SUPABASE_URL/rest/v1/events?select=id&limit=1")

HTTP_CODE=$(echo "$EVENTS_RESPONSE" | tail -n1)
BODY=$(echo "$EVENTS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Events query successful (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ 401 Unauthorized - Key is invalid or not accepted"
    echo "   Response: $BODY"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ 403 Forbidden - RLS policy might be blocking access"
    echo "   Response: $BODY"
else
    echo "❌ Query failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Check RLS policies
echo "7️⃣ Checking if RLS is enabled on events table..."
# We can't easily check this without psql, so skip for now
echo "   (Skipped - requires psql)"
echo ""

# Summary
echo "================================"
echo "📊 Summary"
echo "================================"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Everything looks good!"
    echo ""
    echo "If you're still getting 401 errors in the browser:"
    echo "1. Clear browser cache and local storage"
    echo "2. Restart your dev server: npm run dev"
    echo "3. Check browser console for specific error messages"
    echo "4. Open debug tool: open debug-supabase-connection.html"
else
    echo "❌ Issues detected!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Run: ./update-local-env.sh"
    echo "2. Restart Supabase: supabase stop && supabase start"
    echo "3. Restart dev server: npm run dev"
    echo "4. Check Supabase logs: supabase logs"
fi
echo ""

