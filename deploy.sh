#!/bin/bash
set -e

DOMAIN="facture.innosft.com"
EMAIL="admin@innosft.com"   # <-- Mettez votre email ici

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
rm -f nginx/conf.d/app.conf

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
cp nginx/conf.d/app.conf nginx/conf.d/default.conf

docker compose restart nginx

echo ""
echo "=== Déploiement terminé ! ==="
echo "Accédez à https://$DOMAIN"
