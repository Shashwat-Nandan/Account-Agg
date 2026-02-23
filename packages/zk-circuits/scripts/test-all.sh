#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"

CIRCUITS=(
  "income-range"
  "balance-threshold"
  "kyc-attestation"
  "transaction-pattern"
  "selective-disclosure"
  "merkle-membership"
)

echo "Testing all Noir circuits..."

PASSED=0
FAILED=0

for circuit in "${CIRCUITS[@]}"; do
  echo "  Testing $circuit..."
  cd "$CIRCUITS_DIR/$circuit"
  if nargo test; then
    echo "    PASSED"
    PASSED=$((PASSED + 1))
  else
    echo "    FAILED"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "Results: $PASSED passed, $FAILED failed (out of ${#CIRCUITS[@]} circuits)"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
