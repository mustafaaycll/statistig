#!/bin/bash

# Output file
OUT_FILE="tokens.txt"

# Clear existing output
> "$OUT_FILE"

# Step 1: Dump all .ts file contents under src/
find src -type f -name "*.ts" | sort | while read -r file; do
  echo "===== $file =====" >> "$OUT_FILE"
  cat "$file" >> "$OUT_FILE"
  echo -e "\n\n" >> "$OUT_FILE"
done

# Step 2: Append directory structure
echo "===== Directory structure =====" >> "$OUT_FILE"
tree src >> "$OUT_FILE"
