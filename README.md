# FactureApp — Application de Facturation XOF

Application web complète de facturation en **Franc CFA (XOF)** pour techniciens IT, freelances et PME de la zone UEMOA (Sénégal).

## Fonctionnalités

- **Tableau de bord** : statistiques, graphique des revenus, alertes factures en retard
- **Gestion des clients** : CRUD complet, historique des documents, import CSV
- **Produits & Services** : catalogue avec catégories, TVA configurable (18% par défaut)
- **Documents** : Factures, Devis, Proformas avec numérotation automatique
  - Calcul automatique HT / TVA / TTC en XOF
  - Remise globale en pourcentage
  - Conversion entre types (devis → facture)
  - Duplication de documents
- **Export PDF** : 3 templates (Classique, Moderne, Compact)
- **Envoi email** : PDF joint automatiquement via SMTP
- **Paramètres** : Logo, signature, couleur principale, NINEA, TVA...
- **Multi-langue** : Français / Anglais (react-i18next)
- **Authentification** : JWT + refresh token + bcrypt

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js + Express.js |
| Base de données | SQLite (dev) / PostgreSQL (prod) + Prisma ORM |
| Frontend | React 18 + Vite + TailwindCSS |
| PDF | PDFKit |
| Email | Nodemailer (SMTP) |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| Forms | React Hook Form |
| i18n | react-i18next |

## Installation & Démarrage

### Prérequis

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** 9+

### 1. Backend

```bash
cd backend

# Copier les variables d'environnement
cp .env.example .env
# Éditez .env avec vos paramètres SMTP

# Installer les dépendances
npm install

# Initialiser la base de données SQLite
npm run db:push

# Générer le client Prisma
npm run db:generate

# Insérer les données de test (optionnel)
npm run db:seed

# Lancer en développement
npm run dev
```

Le backend tourne sur `http://localhost:5000`

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

Le frontend tourne sur `http://localhost:3000`

### 3. Compte de démonstration

```
Email    : demo@factureapp.sn
Mot de passe : password123
```

## Variables d'environnement Backend

Copiez `backend/.env.example` → `backend/.env` et modifiez :

```env
# Base de données SQLite (développement)
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=votre_secret_jwt_tres_long
REFRESH_TOKEN_SECRET=votre_refresh_secret

# SMTP (Gmail exemple)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
EMAIL_FROM="FactureApp <votre.email@gmail.com>"

# CORS
FRONTEND_URL=http://localhost:3000
```

> **Gmail** : Activez "Mot de passe d'application" dans les paramètres de sécurité Google.

## Structure du Projet

```
FactureApp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schéma base de données
│   │   └── seed.js            # Données de test sénégalaises
│   ├── src/
│   │   ├── app.js             # Application Express
│   │   ├── server.js          # Point d'entrée
│   │   ├── controllers/       # Logique métier
│   │   ├── routes/            # Routes API
│   │   ├── middlewares/       # Auth, erreurs, rate limiting
│   │   ├── services/          # PDF (PDFKit), Email (Nodemailer)
│   │   └── utils/             # formatCFA, documentNumber, jwt
│   ├── uploads/               # Logos et signatures uploadés
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── auth/          # Login, Register
    │   │   ├── clients/       # List, Form, Detail
    │   │   ├── products/      # List, Form
    │   │   ├── documents/     # List, Form, Detail
    │   │   ├── Dashboard.jsx
    │   │   └── Settings.jsx
    │   ├── components/        # Layout, Sidebar, Header, UI
    │   ├── contexts/          # AuthContext, SettingsContext
    │   ├── utils/             # formatCFA, dateUtils, api (axios)
    │   └── i18n/              # fr.json, en.json
    ├── tailwind.config.js
    └── vite.config.js
```

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| GET | `/api/clients` | Liste des clients |
| POST | `/api/clients` | Créer un client |
| GET | `/api/products` | Liste des produits |
| GET | `/api/documents` | Liste des documents |
| POST | `/api/documents` | Créer un document |
| GET | `/api/documents/:id/pdf` | Télécharger le PDF |
| POST | `/api/documents/:id/email` | Envoyer par email |
| PATCH | `/api/documents/:id/status` | Changer le statut |
| POST | `/api/documents/:id/convert` | Convertir en autre type |
| POST | `/api/documents/:id/duplicate` | Dupliquer |
| GET | `/api/dashboard/stats` | Statistiques |
| GET | `/api/dashboard/revenue-chart` | Données graphique |
| GET | `/api/settings` | Paramètres utilisateur |
| PUT | `/api/settings` | Mettre à jour les paramètres |
| POST | `/api/settings/logo` | Uploader un logo |

## Formatage XOF

Les montants sont toujours affichés sans décimales, avec espace comme séparateur des milliers :

```
1 250 000 FCFA
  125 000 FCFA
   25 000 FCFA
```

## TVA Sénégal

- **Taux par défaut : 18%** (configurable par utilisateur)
- Applicable ligne par ligne
- Calcul automatique : HT → TVA → TTC

## Numérotation automatique

| Type | Format | Exemple |
|------|--------|---------|
| Facture | FAC-YYYY-NNN | FAC-2025-001 |
| Devis | DEV-YYYY-NNN | DEV-2025-001 |
| Proforma | PRO-YYYY-NNN | PRO-2025-001 |

Le compteur se réinitialise automatiquement chaque année.

## Développement avec Docker (optionnel)

```bash
# Copier et configurer le .env
cp backend/.env.example backend/.env

# Lancer
docker-compose up -d
```

- Frontend : http://localhost:3000
- Backend : http://localhost:5000

## Contribution

Ce projet est destiné aux techniciens IT et PME sénégalaises. Contributions bienvenues !

## Licence

MIT — Libre d'utilisation et de modification.

---

*Développé pour la zone UEMOA — Sénégal 🇸🇳*
