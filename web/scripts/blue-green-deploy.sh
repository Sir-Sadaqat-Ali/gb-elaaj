#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Gb Elaaj — Blue-green deploy on Vercel (local equivalent of
# .github/workflows/deploy-blue-green.yml).
#
# Flow:
#   1. Deploy a fresh "green" preview  (`vercel deploy --prod`)
#   2. Run health check + smoke tests against the green URL
#   3. If all pass, atomically alias gb-elaaj.vercel.app → green
#   4. If any fail, leave production alias untouched (= rollback)
#
# Run from anywhere — the script self-locates the repo root.
# (Vercel project has rootDirectory=web, so vercel deploy must be
# invoked from the *parent* of web/ for the path resolution to work.)
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# Locate the repo root (the parent of web/) regardless of where this
# script was invoked from. The script lives in web/scripts/, so two
# levels up from this file is the repo root.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PROD_ALIAS="${PROD_ALIAS:-gb-elaaj.vercel.app}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }
note()  { printf "  %s\n" "$*"; }

die() { red "✖ $1"; exit 1; }

cyan "▸ Step 1/4: Deploy green (immutable preview at production tier)"
# Note: prisma migrate deploy runs INSIDE this Vercel build via
# scripts/migrate-if-prod.mjs, gated on VERCEL_ENV=production. Preview
# deploys (which lack DB env vars) skip the migration cleanly.
LOG=$(mktemp)
# vercel deploy must run from the repo root because the project's
# rootDirectory setting points at "web" relative to that root.
( cd "$REPO_ROOT" && vercel deploy --prod --yes ) 2>&1 | tee "$LOG"
GREEN_URL=$(grep -oE 'https://gb-elaaj-[a-z0-9]+-[^ ]+\.vercel\.app' "$LOG" | tail -1)
[ -z "$GREEN_URL" ] && die "Failed to capture green deployment URL"
green "✔ Green deployed: $GREEN_URL"
echo

cyan "▸ Step 2/4: Wait for green to be reachable"
for i in {1..30}; do
  STATUS=$(curl -s -o /tmp/gbe-health.json -w "%{http_code}" "$GREEN_URL$HEALTH_PATH" || echo "000")
  if [ "$STATUS" = "200" ]; then
    green "✔ Health check passed on attempt $i"
    note "$(cat /tmp/gbe-health.json)"
    break
  fi
  if [ "$i" = "30" ]; then
    red "✖ Health check failed after 30 attempts (last status: $STATUS)"
    cat /tmp/gbe-health.json 2>/dev/null
    die "Production alias NOT moved. Blue still serves $PROD_ALIAS."
  fi
  printf "."
  sleep 3
done
echo

cyan "▸ Step 3/4: Smoke tests"

# Multiple smoke tests are deliberately resilient — they retry up to 3 times
# with backoff to absorb Vercel edge-cache propagation lag (typically <10 s
# but occasionally up to 30 s on cold edges).
smoke() {
  local name="$1" url="$2" pattern="$3" max="${4:-3}"
  for i in $(seq 1 "$max"); do
    BODY=$(curl -sf "$url" 2>/dev/null || true)
    if echo "$BODY" | grep -qE "$pattern"; then
      green "    ✔ $name"
      return 0
    fi
    sleep 4
  done
  red "    ✖ $name"
  echo "$BODY" | head -c 400
  echo
  die "Smoke test failed: $name"
}

note "[1/4] Homepage renders + has brand"
smoke "homepage" "$GREEN_URL/" "Health that travels|Gb Elaaj|theme-color.*0B84FE"

note "[2/4] /login page renders"
smoke "login page" "$GREEN_URL/login" "Welcome back|Sign in to your"

note "[3/4] /admin/dashboard bounces unauthenticated to /login"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GREEN_URL/admin/dashboard")
[ "$STATUS" = "307" ] || [ "$STATUS" = "302" ] || die "Expected 307/302 on /admin/dashboard, got $STATUS"
green "    ✔ RBAC redirect (got $STATUS)"

note "[4/4] Auth redirect carries Cache-Control: no-store (regression guard)"
CC=$(curl -sI "$GREEN_URL/admin/dashboard" | grep -i "^cache-control:" | tr -d '\r\n')
echo "$CC" | grep -qi "no-store" || die "Auth redirect not no-store — would re-introduce loop bug"
green "    ✔ ($CC)"
echo

cyan "▸ Step 4/4: Promote — atomically alias production to green"
vercel alias set "$GREEN_URL" "$PROD_ALIAS"
green "✔ Production alias now points to green"
echo

cyan "▸ Post-deploy: verify production"
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$PROD_ALIAS$HEALTH_PATH")
  if [ "$STATUS" = "200" ]; then
    green "✔ Production https://$PROD_ALIAS is serving green ($STATUS on $HEALTH_PATH)"
    break
  fi
  sleep 2
done

green "═══════════════════════════════════════════════════════════════"
green "✔ Blue-green deploy complete"
green "  Production alias:  https://$PROD_ALIAS"
green "  Underlying green:  $GREEN_URL"
green "  Health endpoint:   https://$PROD_ALIAS$HEALTH_PATH"
green "═══════════════════════════════════════════════════════════════"
