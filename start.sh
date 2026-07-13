#!/usr/bin/env bash
# InsurApp — hər şeyi bir əmrlə qaldırır: MySQL + backend + frontend + portlar
# İstifadə:  bash start.sh
set +e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACK="$ROOT/System-insurance-back-master"
FRONT="$ROOT/System-insurance-front-master"
LOGS="$ROOT/logs"
mkdir -p "$LOGS"

port_up() { ss -tlnp 2>/dev/null | grep -q ":$1 "; }

# Baza root parolu (backend .env-dən)
DB_PASS="$(grep -E '^DB_PASSWORD=' "$BACK/.env" | cut -d= -f2- | tr -d '\r')"
db_ready() { mysql -h 127.0.0.1 -u root -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; }

echo "▸ InsurApp başladılır..."

# ── 1) MySQL ───────────────────────────────────────────────
if ! command -v mysqld >/dev/null 2>&1; then
  echo "  • MySQL quraşdırılır (ilk dəfə)..."
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server
fi

if db_ready; then
  echo "  ✓ MySQL onsuz da işləyir"
else
  echo "  • MySQL başladılır (InnoDB init 30-60 san çəkə bilər, gözləyin)..."
  sudo mkdir -p /var/run/mysqld && sudo chown mysql:mysql /var/run/mysqld
  # köhnə asılı prosesi təmizlə
  pgrep -x mysqld >/dev/null 2>&1 || sudo mysqld_safe >"$LOGS/mysql.log" 2>&1 &
  # ƏSL hazırlığı gözlə — sadəcə port yox, DB sorğusu (60 san-a qədər)
  for i in $(seq 1 60); do
    db_ready && break
    printf '.'; sleep 1
  done
  echo ""
  if db_ready; then echo "  ✓ MySQL qalxdı"; else
    echo "  ✗ MySQL 60 san-da qalxmadı — son loqlar:"; sudo tail -5 /var/log/mysql/error.log 2>/dev/null; fi
fi

# Baza
if db_ready; then
  mysql -h 127.0.0.1 -u root -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS insurance_db CHARACTER SET utf8mb4;" 2>/dev/null \
    && echo "  ✓ insurance_db hazırdır"
fi

# ── 2) Frontend .env.local (Codespace / localhost URL-ləri) ─
if [ -n "$CODESPACE_NAME" ]; then
  API="https://${CODESPACE_NAME}-5000.app.github.dev"
  WEB="https://${CODESPACE_NAME}-3000.app.github.dev"
else
  API="http://localhost:5000"
  WEB="http://localhost:3000"
fi
cat > "$FRONT/.env.local" <<EOF
NEXT_PUBLIC_API_URL=$API
NEXTAUTH_URL=$WEB
NEXTAUTH_SECRET=insurance_system_secret_2024
EOF
echo "  ✓ .env.local yeniləndi ($API)"

# ── 3) Backend ─────────────────────────────────────────────
if [ ! -d "$BACK/node_modules" ]; then
  echo "  • Backend paketləri quraşdırılır..."; (cd "$BACK" && npm install --silent)
fi
if port_up 5000; then
  echo "  ✓ Backend onsuz da işləyir"
else
  echo "  • Backend başladılır..."
  (cd "$BACK" && nohup npm run dev >"$LOGS/backend.log" 2>&1 &)
  for i in $(seq 1 20); do port_up 5000 && break; sleep 1; done
  port_up 5000 && echo "  ✓ Backend qalxdı" || echo "  ✗ Backend qalxmadı — $LOGS/backend.log yoxlayın"
fi

# ── 4) Frontend ────────────────────────────────────────────
if [ ! -d "$FRONT/node_modules" ]; then
  echo "  • Frontend paketləri quraşdırılır..."; (cd "$FRONT" && npm install --silent)
fi
if port_up 3000; then
  echo "  ✓ Frontend onsuz da işləyir (env dəyişibsə restart lazım ola bilər)"
else
  echo "  • Frontend başladılır..."
  (cd "$FRONT" && nohup npm run dev >"$LOGS/frontend.log" 2>&1 &)
  for i in $(seq 1 30); do port_up 3000 && break; sleep 1; done
  port_up 3000 && echo "  ✓ Frontend qalxdı" || echo "  ✗ Frontend qalxmadı — $LOGS/frontend.log yoxlayın"
fi

# ── 5) Portları public et (yalnız Codespace-də) ────────────
if [ -n "$CODESPACE_NAME" ]; then
  gh codespace ports visibility 5000:public 3000:public -c "$CODESPACE_NAME" >/dev/null 2>&1 \
    && echo "  ✓ Portlar public edildi (3000, 5000)" \
    || echo "  ! Portları əl ilə public edin (PORTS tab)"
fi

echo ""
echo "✅ Hazırdır!"
echo "🔗 Tətbiq:  $WEB/login"
echo "👤 Giriş:   admin@insurance.az  /  password"
echo "📄 Loglar:  $LOGS/{mysql,backend,frontend}.log"
