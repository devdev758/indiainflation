#!/usr/bin/env bash
set -euo pipefail

target="infra/dhparam/dhparam.pem"
mkdir -p infra/dhparam

if [[ -f "$target" ]]; then
  echo "dhparam already exists at $target"
  exit 0
fi

openssl dhparam -out "$target" 4096
echo "Generated Diffie-Hellman parameters at $target"
