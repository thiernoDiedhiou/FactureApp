#!/bin/bash
set -e

DOMAIN="facture.innosft.com"
EMAIL="innosoftcreation@gmail.com"
SERVER_USER="tfksservice"
SERVER_IP="72.62.23.55"
REMOTE_DIR="/home/tfksservice/factureapp"

# ─────────────────────────────────────────────
# MODE : local  → transfère les fichiers et lance le déploiement
#        remote → s'exécute directement sur le serveur
# ─────────────────────────────────────────────

if [ "$1" == "push" ]; then
  echo "=== Transfert du projet vers $SERVER_USER@$SERVER_IP:$REMOTE_DIR ==="

  ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR"

  rsync -avz --exclude='node_modules' \
             --exclude='.git' \
             --exclude='frontend/node_modules' \
             --exclude='backend/node_modules' \
             --exclude='certbot' \
             --exclude='backend/prisma/data' \
             --exclude='backend/uploads' \
             . "$SERVER_USER@$SERVER_IP:$REMOTE_DIR"

  echo "--- Copie du .env ---"
  scp .env "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/.env"

  echo "--- Lancement du déploiement sur le serveur ---"
  ssh "$SERVER_USER@$SERVER_IP" "cd $REMOTE_DIR && chmod +x deploy.sh && ./deploy.sh"

  exit 0
fi

# ─────────────────────────────────────────────
# Déploiement sur le serveur
# ─────────────────────────────────────────────
echo "=== Déploiement FactureApp sur $DOMAIN ==="

# 1. Créer les dossiers nécessaires
mkdir -p certbot/www certbot/conf backend/uploads backend/prisma/data

# 2. Vérifier que le .env existe
if [ ! -f .env ]; then
  echo "ERREUR: fichier .env manquant. Copiez .env.example et configurez-le."
  exit 1
fi

# 3. Première étape: démarrer avec la config HTTP uniquement (pour certbot)
echo "--- Étape 1: Démarrage HTTP pour validation Let's Encrypt ---"
cp nginx/conf.d/app-init.conf nginx/conf.d/default.conf
cp nginx/conf.d/app.conf nginx/conf.d/app.conf.bak 2>/dev/null || true

docker compose up -d --build frontend backend nginx

echo "--- Attente que Nginx soit prêt ---"
sleep 5

# 4. Obtenir le certificat SSL
echo "--- Étape 2: Obtention du certificat SSL ---"
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Télécharger les paramètres recommandés Let's Encrypt
if [ ! -f certbot/conf/options-ssl-nginx.conf ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o certbot/conf/options-ssl-nginx.conf
fi
if [ ! -f certbot/conf/ssl-dhparams.pem ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o certbot/conf/ssl-dhparams.pem
fi

# 5. Basculer sur la config HTTPS complète
echo "--- Étape 3: Activation HTTPS ---"
cp nginx/conf.d/app.conf.bak nginx/conf.d/default.conf 2>/dev/null || \
  cp nginx/conf.d/app.conf nginx/conf.d/default.conf

docker compose restart nginx

# 6. Créer le Super Admin
echo "--- Étape 4: Création du Super Admin ---"
docker compose exec backend node scripts/seed-superadmin.js

echo ""
echo "=== Déploiement terminé ! ==="
echo "Accédez à https://$DOMAIN"
