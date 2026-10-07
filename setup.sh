#!/bin/bash
echo -e "\033[1;36mStarting Weber CS Tech Inventory Tracker Setup...\033[0m"

NODE_VER=$(node -v)
if [[ ! "$NODE_VER" =~ ^v22 ]]; then
    echo -e "\033[1;31mERROR: Node v22 is strictly required.\033[0m"
    exit 1
fi

for dir in @types api web; do
    (cd "$dir" && npm ci) || exit 1
done

if [ ! -f web/.env ]; then
    printf '%s\n' 'VITE_API_URL=http://localhost:8080' > web/.env
fi
if [ ! -f api/.env ]; then
    printf '%s\n' 'WARNING: api/.env not found; create it before running dbinit.' >&2
fi
