#!/usr/bin/env bash
# Test Google Apps Script Web App endpoint with curl
# Usage: ./scripts/test-endpoint.sh <YOUR_WEB_APP_EXEC_URL>

set -euo pipefail

WEBHOOK_URL="${1:-}"

if [[ -z "$WEBHOOK_URL" ]]; then
  echo "Error: Missing Web App URL."
  echo "Usage: $0 <WEBHOOK_URL>"
  echo "Example: $0 https://script.google.com/macros/s/AKfycb.../exec"
  exit 1
fi

echo "========================================="
echo "Testing Google Apps Script Webhook..."
echo "Target: $WEBHOOK_URL"
echo "========================================="

TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Note: We omit -X POST so that curl follows Google's 302 redirect to the echo endpoint with GET cleanly
RESPONSE=$(curl -s -L \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d "{\"title\":\"Endpoint Verification Test\",\"venue\":\"Automated Test Gallery\",\"startDate\":\"2026-09-28\",\"endDate\":\"2026-12-31\",\"url\":\"https://example.com/test\",\"notes\":\"Verified via test-endpoint.sh\",\"savedAt\":\"$TIMESTAMP\"}" \
  "$WEBHOOK_URL")

echo "Response from Google Apps Script:"
echo "$RESPONSE"
echo ""

if [[ "$RESPONSE" == *"success"* ]]; then
  echo "✓ Test succeeded! Check your Google Sheet to confirm that a new row has been added."
else
  echo "⚠️ Warning: The response did not contain 'success'. If the script timed out or returned HTML, check your deployment permissions ('Who has access: Anyone')."
fi
