#!/bin/bash
set -e

DOMAIN="facture.innosft.com"
EMAIL="innosoftcreation@gmail.com"

echo "=== Déploiement FactureApp sur $DOMAIN ==="

# 1. Créer les dossiers nécessaires
mkdir -p backend/uploads backend/prisma/data

# 2. Vérifier que le .env existe
if [ ! -f .env ]; then
  echo "ERREUR: fichier .env manquant."
  exit 1
fi

# 3. Démarrer les containers
echo "--- Démarrage des containers ---"
docker compose up -d --build

# 4. Configurer le vhost Nginx système
echo "--- Configuration Nginx ---"
sudo tee /etc/nginx/sites-available/facture.innosft.com > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name facture.innosft.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
NGINXCONF

sudo ln -sf /etc/nginx/sites-available/facture.innosft.com /etc/nginx/sites-enabled/facture.innosft.com
sudo nginx -t && sudo systemctl reload nginx

# 5. Obtenir le certificat SSL
echo "--- Obtention du certificat SSL ---"
sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect

# 6. Créer le Super Admin
echo "--- Création du Super Admin ---"
docker compose exec backend node scripts/seed-superadmin.js

echo ""
echo "=== Déploiement terminé ! ==="
echo "Accédez à https://$DOMAIN"
