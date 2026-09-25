#!/bin/bash
npx concurrently --kill-others --names "API,WEB" -c "bgBlue.bold,bgMagenta.bold" \
    "npm --prefix api run dev" \
    "npm --prefix web run dev"
