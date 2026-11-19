#!/bin/sh
# Commit messages here are ONE clean subject line:
#   1) strip AI-attribution trailers  2) drop everything after the first line (body, trailers)
# BSD/macOS + GNU compatible. lefthook must reproduce this before commitlint.
sed -E -i.bak \
  -e '/^[Cc]o-[Aa]uthored-[Bb]y:.*([Cc]laude|[Aa]nthropic)/d' \
  -e '/[Gg]enerated with .*[Cc]laude [Cc]ode/d' \
  -e '/^Claude-Session:/d' \
  "$1" && rm -f "$1.bak"
awk '!/^#/ && NF { print; exit }' "$1" > "$1.tmp" && mv "$1.tmp" "$1"
