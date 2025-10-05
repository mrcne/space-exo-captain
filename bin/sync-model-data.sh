#!/usr/bin/env bash

set -euo pipefail

# Sync subset of model artifact files from the training pipeline into the web app's data directory for dashboard consumption.
# Copies only web-friendly files (csv, json, txt, and common image formats) from:
#   - artifacts/
#   - dl_artifacts/
#   - exo_ml/
#   - mlp_artifacts/
#   - transformer_artifacts/
#   - data (only testing.csv)

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_BASE="$ROOT_DIR/pipeline"
DEST_BASE="$ROOT_DIR/apps/web/data/pipeline"

SUBDIRS=(
  "artifacts"
  "dl_artifacts"
  "exo_ml"
  "mlp_artifacts"
  "transformer_artifacts"
  "data" # special-case
)

INCLUDE_EXT=(json csv txt png jpg jpeg webp gif svg)

mkdir -p "$DEST_BASE"

if [ -d "$DEST_BASE" ]; then
  find "$DEST_BASE" -mindepth 1 -maxdepth 1 -type d -print0 | xargs -0 -I{} rm -rf "{}"
fi

should_copy() {
  local f="$1"
  local ext
  ext="${f##*.}"
  ext="${ext,,}"
  for e in "${INCLUDE_EXT[@]}"; do
    if [[ "$ext" == "$e" ]]; then
      return 0
    fi
  done
  return 1
}

for sub in "${SUBDIRS[@]}"; do
  src_dir="$SRC_BASE/$sub"
  dest_dir="$DEST_BASE/$sub"

  if [ ! -d "$src_dir" ]; then
    echo "[skip] $sub (not found)"
    continue
  fi

  echo "[sync] $sub"
  while IFS= read -r -d '' file; do
    if [[ "$sub" == "data" ]]; then
      if [[ "$(basename "$file")" != "testing.csv" ]]; then
        continue
      fi
    fi

    if should_copy "$file"; then
      rel_path="${file#"$SRC_BASE/"}"
      out_path="$DEST_BASE/$rel_path"
      mkdir -p "$(dirname "$out_path")"
      cp -f "$file" "$out_path"
    fi
  done < <(find "$src_dir" -type f -print0)

done

echo "Done."

