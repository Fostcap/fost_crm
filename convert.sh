#!/bin/bash
# Usage: paste your artifact code into input.txt, then run:
#   bash convert.sh input.txt
# Output: src/App.jsx (patched for Vercel)

INPUT="$1"
OUTPUT="src/App.jsx"

if [ -z "$INPUT" ]; then
  echo "Usage: bash convert.sh <artifact-code-file>"
  exit 1
fi

# Apply the 4 patches
sed \
  -e '1s/^/import storage from ".\/storage.js";\n/' \
  -e 's/window\.storage\.get(KS,true)/storage.get(KS,true)/g' \
  -e 's/window\.storage\.set(KS,json,true)/storage.set(KS,json,true)/g' \
  -e 's/function copyToClipboard(text){var el=document.createElement("textarea");el.style.position="fixed";el.style.top="-9999px";el.value=text;document.body.appendChild(el);el.select();try{document.execCommand("copy");}catch(e){}document.body.removeChild(el);}/function downloadCSV(text,filename){var blob=new Blob(["\\uFEFF"+text],{type:"text\/csv;charset=utf-8;"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=filename||"export.csv";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}/' \
  -e 's/copyToClipboard(makeCSV(rows))/downloadCSV(makeCSV(rows),"fost-clients.csv")/g' \
  "$INPUT" > "$OUTPUT"

echo "✓ Patched $OUTPUT"
echo "  - Added: import storage"
echo "  - Replaced: window.storage → storage module"  
echo "  - Replaced: copyToClipboard → downloadCSV (Blob download)"
