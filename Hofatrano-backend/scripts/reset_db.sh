#!/usr/bin/env bash
set -euo pipefail

# Reset SQLite DB + app migrations safely (without touching Django in venv).
# Run from backend/:
#   bash scripts/reset_db.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "db.sqlite3" ]]; then
  rm db.sqlite3
  echo "[ok] db.sqlite3 supprimé"
else
  echo "[info] db.sqlite3 absent"
fi

# Delete only project app migrations. Never scan inside virtualenv/site-packages.
# The previous broad command below is dangerous and can break Django itself:
#   find . -path "*/migrations/*.py" ! -name "__init__.py" -delete
APP_DIRS=(listings gasycar_backend)
for app_dir in "${APP_DIRS[@]}"; do
  if [[ -d "$app_dir" ]]; then
    find "$app_dir" -type f -path "*/migrations/*.py" ! -name "__init__.py" -print -delete
    find "$app_dir" -type f -path "*/migrations/*.pyc" -print -delete
  fi
done

echo "[ok] reset terminé"
echo "Étapes suivantes :"
echo "  python -m pip install --upgrade --force-reinstall django"
echo "  python manage.py makemigrations"
echo "  python manage.py migrate"
