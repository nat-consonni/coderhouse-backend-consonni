#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
# Config
# ------------------------------------------------------------
BASE_URL="${BASE_URL:-http://localhost:8080}"

# Pretty printer: usa jq si existe, sino python3 -m json.tool
pretty() {
  if command -v jq >/dev/null 2>&1; then
    jq .
  else
    python3 -m json.tool
  fi
}

# Extrae payload._id de una respuesta JSON
# (no requiere jq; usa Python para parsear)
extract_payload_id() {
  local json="$1"
  python3 - "$json" <<'PY'
import sys, json
data = json.loads(sys.argv[1])
print(data.get("payload", {}).get("_id",""))
PY
}

# ------------------------------------------------------------
# 0) Ping /health
# ------------------------------------------------------------
echo "==> Healthcheck"
curl -s "${BASE_URL}/health" | pretty
echo

# ------------------------------------------------------------
# 1) Crea 3 productos de prueba y guarda sus IDs
# ------------------------------------------------------------
echo "==> Creando productos de prueba"

create_product() {
  local title="$1" desc="$2" code="$3" price="$4" status="$5" stock="$6" category="$7"
  local body
  body=$(cat <<JSON
{
  "title":"${title}",
  "description":"${desc}",
  "code":"${code}",
  "price":${price},
  "status":${status},
  "stock":${stock},
  "category":"${category}",
  "thumbnails":[]
}
JSON
)
  local resp
  resp=$(curl -s -X POST "${BASE_URL}/api/products" -H "Content-Type: application/json" -d "${body}")
  echo "${resp}" | pretty
  extract_payload_id "${resp}"
}

PID1=$(create_product "Silla Neo"  "Silla ergonómica"            "CHA-777" 199 true  12 "chairs")
PID2=$(create_product "Mesa Nord"  "Mesa ratona de pino"         "TAB-101" 280 true   7 "tables")
PID3=$(create_product "Silla Pop"  "Silla plástica apilable"     "CHA-888"  99 false  0 "chairs")

echo "IDs creados:"
echo "  PID1=${PID1}"
echo "  PID2=${PID2}"
echo "  PID3=${PID3}"
echo

# ------------------------------------------------------------
# 2) GET /api/products con paginación/filtros/orden
# ------------------------------------------------------------
echo "==> Listado de productos (paginación + filtros + sort)"
echo "-- /api/products"
curl -s "${BASE_URL}/api/products" | pretty
echo

echo "-- /api/products?limit=2&page=1"
curl -s "${BASE_URL}/api/products?limit=2&page=1" | pretty
echo

echo "-- /api/products?query=category:chairs"
curl -s "${BASE_URL}/api/products?query=category:chairs" | pretty
echo

echo "-- /api/products?query=status:true"
curl -s "${BASE_URL}/api/products?query=status:true" | pretty
echo

echo "-- /api/products?sort=asc"
curl -s "${BASE_URL}/api/products?sort=asc" | pretty
echo

# ------------------------------------------------------------
# 3) Crea carrito y guarda CID
# ------------------------------------------------------------
echo "==> Creando carrito"
CREATE_CART_RESP=$(curl -s -X POST "${BASE_URL}/api/carts")
echo "${CREATE_CART_RESP}" | pretty
CID=$(extract_payload_id "${CREATE_CART_RESP}")
echo "CID=${CID}"
echo

# ------------------------------------------------------------
# 4) Agrega productos al carrito
# ------------------------------------------------------------
echo "==> Agregando productos al carrito ${CID}"

echo "-- add PID1 (quantity 1)"
curl -s -X POST "${BASE_URL}/api/carts/${CID}/products/${PID1}" \
  -H "Content-Type: application/json" \
  -d '{"quantity":1}' | pretty
echo

echo "-- add PID2 (quantity 2)"
curl -s -X POST "${BASE_URL}/api/carts/${CID}/products/${PID2}" \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}' | pretty
echo

echo "-- add PID1 otra vez (incrementa quantity)"
curl -s -X POST "${BASE_URL}/api/carts/${CID}/products/${PID1}" \
  -H "Content-Type: application/json" \
  -d '{"quantity":1}' | pretty
echo

# ------------------------------------------------------------
# 5) GET /api/carts/:cid (con populate)
# ------------------------------------------------------------
echo "==> Ver carrito (populate)"
curl -s "${BASE_URL}/api/carts/${CID}" | pretty
echo

# ------------------------------------------------------------
# 6) PUT /api/carts/:cid/products/:pid (actualiza SOLO quantity)
# ------------------------------------------------------------
echo "==> Actualizar SOLO quantity de PID2 a 5"
curl -s -X PUT "${BASE_URL}/api/carts/${CID}/products/${PID2}" \
  -H "Content-Type: application/json" \
  -d '{"quantity":5}' | pretty
echo

# ------------------------------------------------------------
# 7) PUT /api/carts/:cid (reemplaza TODO el arreglo de products)
# ------------------------------------------------------------
echo "==> Reemplazar productos del carrito por: [{ PID3, quantity 3 }]"
curl -s -X PUT "${BASE_URL}/api/carts/${CID}" \
  -H "Content-Type: application/json" \
  -d "{\"products\":[{\"product\":\"${PID3}\",\"quantity\":3}]}" | pretty
echo

# ------------------------------------------------------------
# 8) DELETE /api/carts/:cid/products/:pid (eliminar 1 producto)
# ------------------------------------------------------------
echo "==> Eliminar PID3 del carrito"
curl -s -X DELETE "${BASE_URL}/api/carts/${CID}/products/${PID3}" | pretty
echo

# ------------------------------------------------------------
# 9) DELETE /api/carts/:cid (vaciar carrito)
# ------------------------------------------------------------
echo "==> Vaciar carrito"
curl -s -X DELETE "${BASE_URL}/api/carts/${CID}" | pretty
echo

echo "✅ Script de prueba finalizado OK."
