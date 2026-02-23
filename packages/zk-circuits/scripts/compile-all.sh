#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"
COMPILED_DIR="$CIRCUITS_DIR/compiled"

mkdir -p "$COMPILED_DIR"

CIRCUITS=(
  "income-range"
  "balance-threshold"
  "kyc-attestation"
  "transaction-pattern"
  "selective-disclosure"
  "merkle-membership"
)

echo "Compiling all Noir circuits..."

for circuit in "${CIRCUITS[@]}"; do
  echo "  Compiling $circuit..."
  cd "$CIRCUITS_DIR/$circuit"
  nargo compile

  # Copy compiled ACIR JSON to compiled/ directory
  circuit_name="${circuit//-/_}"
  if [ -f "target/${circuit_name}.json" ]; then
    cp "target/${circuit_name}.json" "$COMPILED_DIR/${circuit_name}.json"
    echo "    -> $COMPILED_DIR/${circuit_name}.json"
  fi
done

echo "All circuits compiled successfully!"
echo "Compiled files:"
ls -la "$COMPILED_DIR"
