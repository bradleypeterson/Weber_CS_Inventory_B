#!/bin/bash
echo -e "\033[1;36mStarting Weber CS Tech Inventory Tracker Setup...\033[0m"

NODE_VER=$(node -v)
if [[ ! "$NODE_VER" =~ ^v22 ]]; then
    echo -e "\033[1;31mERROR: Node v22 is strictly required.\033[0m"
    exit 1
fi

for dir in @types api web; do
    (cd $dir && npm ci)
done
