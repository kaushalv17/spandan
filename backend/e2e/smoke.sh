#!/usr/bin/env bash
set -euo pipefail
API="${API_BASE:-http://localhost:8080/api/v1}"
EMAIL="smoke+$(date +%s)@spandan.test"; PASS="Spandan@12345"
echo "1) health"; curl -fsS "${API%/api/v1}/health" && echo
echo "2) register"; curl -fsS -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"Smoke\",\"role\":\"authority\"}" >/dev/null || true
echo "3) login"; TOKEN=$(curl -fsS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "   token: ${TOKEN:0:12}..."
echo "4) presign"; curl -fsS -X POST "$API/uploads/presign" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"contentType":"image/jpeg"}' && echo
echo "5) create asset"; curl -fsS -X POST "$API/assets" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Road","type":"road","lat":28.61,"lng":77.20,"importance":4}' && echo
echo "SMOKE OK"
