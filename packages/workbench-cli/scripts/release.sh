#!/usr/bin/env bash
set -euo pipefail

RELEASE_TYPE="${1:-patch}"

if [[ "$RELEASE_TYPE" != "major" && "$RELEASE_TYPE" != "minor" && "$RELEASE_TYPE" != "patch" ]]; then
  echo "Error: release type must be major, minor, or patch (got: '$RELEASE_TYPE')"
  exit 1
fi

echo "This will:"
echo "  1. Bump the $RELEASE_TYPE version number"
echo "  2. Push main with the newly created tag to origin"
echo "  3. Trigger a release action"
echo ""
read -r -p "Do you want to continue? [y/N] " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

bun run "release:$RELEASE_TYPE"
git push origin main --tags
