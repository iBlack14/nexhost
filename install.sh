#!/bin/bash
# NexHost — Panel de Hosting Advanced Installer
# Optimizado para Ubuntu (Contabo)

set -e

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}             🚀 NEXHOST — AUTO INSTALLER v1.0               ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. Configuración de Puertos
read -p "🔹 Puerto para el BACKEND [default 4000]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-4000}

read -p "🔹 Puerto para el FRONTEND [default 3000]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

read -p "🔹 GitHub Repository (ej: usuario/repo): " REPO_NAME
if [ -z "$REPO_NAME" ]; then
    echo "❌ Error: Debes proporcionar el nombre del repositorio para clonarlo."
    exit 1
fi

# 2. Generación de Secretos
DB_PASSWORD=$(openssl rand -base64 12)
JWT_SECRET=$(openssl rand -base64 32)
MYSQL_ROOT_PASS=$(openssl rand -base64 12)
SERVER_IP=$(curl -s ifconfig.me)

echo -e "\n${BLUE}📦 Instalando dependencias del sistema...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential postgresql postgresql-contrib mysql-server nginx

# 3. Instalación de Node.js 20
echo -e "${BLUE}🟢 Instalando Node.js y PM2...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 4. Configuración de PostgreSQL
echo -e "${BLUE}🐘 Configurando PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE DATABASE nexhost;" || true
sudo -u postgres psql -c "CREATE USER nexadmin WITH PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nexhost TO nexadmin;" || true

# 5. Configuración de MySQL
echo -e "${BLUE}🐬 Configurando MySQL Root...${NC}"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASS';" || true
sudo mysql -e "FLUSH PRIVILEGES;"

# 6. Preparar Carpeta y Clonar
INSTALL_DIR="/opt/nexhost"
echo -e "${BLUE}📂 Clonando proyecto en $INSTALL_DIR...${NC}"
sudo rm -rf $INSTALL_DIR
sudo mkdir -p $INSTALL_DIR
sudo git clone https://github.com/$REPO_NAME.git $INSTALL_DIR
sudo chown -R $USER:$USER $INSTALL_DIR

# 7. Configuración del Backend
echo -e "${BLUE}⚙️ Configurando API (Backend)...${NC}"
cd $INSTALL_DIR/backend
npm install
cat <<EOF > .env
PORT=$BACKEND_PORT
NODE_ENV=production
DATABASE_URL="postgresql://nexadmin:$DB_PASSWORD@localhost:5432/nexhost"
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_ROOT_USER=root
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASS
JWT_SECRET=$JWT_SECRET
NEXTAUTH_SECRET=$JWT_SECRET
FRONTEND_URL="http://$SERVER_IP:$FRONTEND_PORT"
EOF
npx prisma migrate deploy
npx prisma generate
pm2 delete nexhost-api || true
pm2 start src/index.js --name nexhost-api -- --port $BACKEND_PORT

# 8. Configuración del Frontend
echo -e "${BLUE}⚙️ Configurando Dashboard (Frontend)...${NC}"
cd $INSTALL_DIR/frontend
npm install
cat <<EOF > .env.local
NEXTAUTH_URL="http://$SERVER_IP:$FRONTEND_PORT"
NEXTAUTH_SECRET=$JWT_SECRET
NEXT_PUBLIC_API_URL="http://$SERVER_IP:$BACKEND_PORT/api"
API_URL="http://localhost:$BACKEND_PORT/api"
EOF

# Build de Next.js
echo -e "${BLUE}🏗️ Construyendo aplicación para producción (esto puede tardar)...${NC}"
npm run build
pm2 delete nexhost-frontend || true
pm2 start npm --name nexhost-frontend -- start -- -p $FRONTEND_PORT

# 9. Configuración de Nginx (Opcional - solo mostramos los comandos)
echo -e "${GREEN}✅ ¡INSTALACIÓN COMPLETADA!${NC}"
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "🚀 ${GREEN}URL DEL PANEL:${NC} http://$SERVER_IP:$FRONTEND_PORT"
echo -e "🔌 ${GREEN}URL DE LA API:${NC} http://$SERVER_IP:$BACKEND_PORT"
echo -e "🔗 ${GREEN}REPOSITORIO:${NC} https://github.com/$REPO_NAME"
echo -e "\n🔑 ${GREEN}POSTGRES PASS:${NC} $DB_PASSWORD"
echo -e "🔑 ${GREEN}MYSQL ROOT PASS:${NC} $MYSQL_ROOT_PASS"
echo -e "🔑 ${GREEN}JWT/AUTH SECRET:${NC} $JWT_SECRET"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "💡 TIP: Usa 'pm2 logs' para ver el estado de las aplicaciones."
