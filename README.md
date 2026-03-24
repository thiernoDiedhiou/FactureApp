# FactureApp — Application de Facturation XOF

Application web SaaS de facturation en **Franc CFA (XOF)** pour techniciens IT, freelances et PME de la zone UEMOA (Sénégal).

## Fonctionnalités

### Facturation
- **Tableau de bord** : statistiques, graphique des revenus 12 mois, alertes factures en retard
- **Gestion des clients** : CRUD complet, import CSV, historique des documents
- **Produits & Services** : catalogue avec catégories, TVA configurable (18% par défaut)
- **Documents** : Factures, Devis, Proformas avec numérotation automatique
  - Calcul automatique HT / TVA / TTC en XOF
  - Remise globale en pourcentage
  - Conversion entre types (devis → facture → proforma)
  - Duplication de documents
- **Export PDF** : 3 templates (Classique, Moderne, Compact)
- **Envoi email** : PDF joint automatiquement via SMTP
- **Partage WhatsApp** : PDF en pièce jointe (mobile) ou message formaté (desktop) avec nom de l'entreprise

### Multi-tenant & Organisations
- **Multi-organisation** : chaque utilisateur peut appartenir à plusieurs organisations
- **Rôles** : OWNER / ADMIN / MEMBRE avec permissions graduées
- **Invitation de collaborateurs** : par email avec lien sécurisé JWT (7 jours)
  - Fonctionne pour les utilisateurs existants (ajout direct) et nouveaux (lien d'inscription)
- **Changement d'organisation** : basculer entre organisations depuis le menu (nouveau JWT émis)

### Sécurité & Comptes
- **Vérification email** obligatoire à l'inscription
- **Authentification** : JWT access token (15 min) + refresh token (7 jours) + bcrypt
- **Renvoi** d'email de vérification
- **Changement de mot de passe** depuis les paramètres

### Plans & Limites

- **Limites dynamiques** : enforcer max documents, clients et membres par plan en base de données
- **Erreur explicite** (`403 PLAN_LIMIT_REACHED`) quand la limite est atteinte
- Plans modifiables en temps réel par le Super Admin (prix, limites, fonctionnalités, actif/inactif)

### Gestion des paiements (marché UEMOA)

- **Modal de paiement** adaptée au marché sénégalais : Wave, Orange Money, Mixx by Joni Joni, Espèces
- **Demande de mise à niveau** : l'utilisateur soumet sa référence de transaction
- **Validation manuelle** par le Super Admin → plan mis à jour automatiquement
- **Numéro de paiement configurable** par le Super Admin sans redéploiement

### Administration (Super Admin)

- **Dashboard KPI** : MRR, taux de conversion, orgs actives/dormantes, nouveaux utilisateurs
- **Graphiques** : courbe de croissance (12 mois) et volume de documents (Recharts)
- **Gestion des organisations** : changer le plan, suspendre, supprimer
- **Gestion des utilisateurs** : promouvoir/révoquer les super admins
- **Plans tarifaires** : configurer prix, limites (membres / documents / clients), activer/désactiver
- **Demandes upgrade** : valider ou rejeter les demandes de paiement avec motif
- **Paramètres plateforme** : numéro Wave/OM, nom bénéficiaire, email support

### Paramètres (par organisation)

- Logo, signature/cachet, couleur principale
- NINEA (numéro fiscal sénégalais), coordonnées entreprise
- Langue (FR/EN), devise, taux TVA par défaut
- Style de document (Classique / Moderne / Compact)

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js + Express.js |
| Base de données | PostgreSQL + Prisma ORM |
| Frontend | React 18 + Vite + TailwindCSS |
| PDF | PDFKit |
| Email | Nodemailer (SMTP) |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| i18n | react-i18next |

---

## Installation & Démarrage

### Prérequis

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **PostgreSQL** 14+

### 1. Backend

```bash
cd backend

# Copier les variables d'environnement
cp .env.example .env
# Éditez .env avec vos paramètres (DB, SMTP, JWT...)

# Installer les dépendances
npm install

# Appliquer les migrations Prisma
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Initialiser les plans tarifaires en base
node scripts/seed-plans.js

# Initialiser la config plateforme (numéro de paiement)
node scripts/seed-platform-config.js

# (Optionnel) Créer un super admin
node scripts/make-superadmin.js votre@email.com

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
Email        : demo@factureapp.sn
Mot de passe : password123
```

> Le compte démo est marqué comme vérifié automatiquement.

---

## Variables d'environnement Backend

Copiez `backend/.env.example` → `backend/.env` et modifiez :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/factureapp"

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_minimum_32_chars
REFRESH_TOKEN_SECRET=votre_refresh_secret_different_du_jwt

# SMTP (Gmail exemple)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
EMAIL_FROM="FactureApp <votre.email@gmail.com>"

# CORS
FRONTEND_URL=http://localhost:3000

# Environnement
NODE_ENV=development
PORT=5000
```

> **Gmail** : Activez "Mot de passe d'application" dans les paramètres de sécurité Google (authentification 2 facteurs requise).

---

## Structure du Projet

```
FactureApp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Schéma multi-tenant complet
│   │   └── migrations/            # Historique des migrations SQL
│   ├── scripts/
│   │   ├── seed-plans.js              # Initialise les plans tarifaires
│   │   ├── seed-platform-config.js    # Initialise la config de paiement
│   │   ├── make-superadmin.js         # Promouvoir un utilisateur super admin
│   │   └── verify-existing-users.js   # Marquer les anciens comptes comme vérifiés
│   ├── src/
│   │   ├── app.js                 # Application Express
│   │   ├── server.js              # Point d'entrée
│   │   ├── controllers/
│   │   │   ├── authController.js          # Inscription, connexion, vérification email
│   │   │   ├── organizationController.js  # Org, membres, invitations, switch
│   │   │   ├── clientController.js        # CRUD clients + import CSV
│   │   │   ├── productController.js       # CRUD produits
│   │   │   ├── documentController.js      # CRUD documents, PDF, email, conversion
│   │   │   ├── dashboardController.js     # Statistiques organisation
│   │   │   ├── settingsController.js      # Paramètres org, logo, signature
│   │   │   ├── planController.js          # Plans publics + config paiement
│   │   │   ├── upgradeController.js       # Demandes de mise à niveau
│   │   │   └── adminController.js         # Super admin (stats, orgs, users, plans, config)
│   │   ├── routes/
│   │   │   ├── auth.js, organizations.js, clients.js
│   │   │   ├── documents.js, products.js, settings.js
│   │   │   ├── plans.js, upgrades.js, admin.js
│   │   │   └── index.js
│   │   ├── middlewares/           # authenticate, requireAdmin, requireSuperAdmin, errorHandler
│   │   ├── services/
│   │   │   ├── pdfService.js      # Génération PDF (3 templates PDFKit)
│   │   │   └── emailService.js    # Emails (documents, invitations, vérification)
│   │   └── utils/
│   │       ├── documentNumber.js  # Numérotation FAC/DEV/PRO-YYYY-NNN
│   │       ├── formatCFA.js       # Calculs HT/TVA/TTC + formatage XOF
│   │       ├── jwt.js             # Génération access + refresh tokens
│   │       └── planLimits.js      # checkPlanLimit() — enforcement des limites
│   ├── uploads/                   # Logos et signatures uploadés
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   ├── Register.jsx       # Supporte ?invite=TOKEN (email pré-rempli)
    │   │   │   ├── VerifyEmail.jsx    # Page "vérifiez votre boite" + confirmation token
    │   │   │   └── AcceptInvite.jsx   # Accepter une invitation (connecté ou non)
    │   │   ├── clients/               # ClientList, ClientForm, ClientDetail
    │   │   ├── products/              # ProductList, ProductForm
    │   │   ├── documents/             # DocumentList, DocumentForm, DocumentDetail
    │   │   ├── admin/
    │   │   │   ├── AdminLayout.jsx    # Layout Super Admin (sidebar dark)
    │   │   │   ├── AdminDashboard.jsx # KPIs, graphiques MRR/croissance
    │   │   │   ├── AdminOrganizations.jsx
    │   │   │   ├── AdminUsers.jsx
    │   │   │   ├── AdminPlans.jsx     # Config plans (prix, limites, toggle actif)
    │   │   │   ├── AdminUpgrades.jsx  # Valider/rejeter demandes de paiement
    │   │   │   └── AdminSettings.jsx  # Numéro Wave/OM, email support
    │   │   ├── Dashboard.jsx
    │   │   ├── Settings.jsx
    │   │   ├── Organization.jsx       # Gestion org + invitations
    │   │   └── Plans.jsx              # Plans tarifaires + modal paiement Wave/OM/Cash
    │   ├── components/                # Layout, Sidebar, Header
    │   ├── contexts/                  # AuthContext, SettingsContext
    │   ├── utils/                     # formatCFA, dateUtils, api (axios)
    │   └── i18n/                      # fr.json, en.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## API Endpoints

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription (crée user + org, envoie email vérification) |
| POST | `/api/auth/login` | Connexion (bloque si email non vérifié) |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/verify-email/:token` | Vérifier l'email |
| POST | `/api/auth/resend-verification` | Renvoyer l'email de vérification |
| GET | `/api/auth/me` | Profil utilisateur + organisations |
| PUT | `/api/auth/change-password` | Changer le mot de passe |

### Organisation & Membres
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/organizations/me` | Infos de l'organisation courante |
| PATCH | `/api/organizations/me` | Modifier le nom de l'org |
| GET | `/api/organizations/members` | Liste des membres |
| POST | `/api/organizations/invite` | Inviter un collaborateur (existant ou nouveau) |
| POST | `/api/organizations/accept-invite` | Accepter une invitation (utilisateur connecté) |
| PATCH | `/api/organizations/members/:id/role` | Changer le rôle d'un membre |
| DELETE | `/api/organizations/members/:id` | Retirer un membre |
| POST | `/api/auth/switch-org` | Changer d'organisation active |

### Documents
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/documents` | Liste (filtres : type, statut, client, dates, recherche) |
| POST | `/api/documents` | Créer (vérifie limite plan) |
| GET | `/api/documents/:id` | Détail complet |
| PUT | `/api/documents/:id` | Modifier |
| DELETE | `/api/documents/:id` | Supprimer |
| GET | `/api/documents/:id/pdf` | Télécharger le PDF |
| POST | `/api/documents/:id/email` | Envoyer par email |
| PATCH | `/api/documents/:id/status` | Changer le statut (en_attente / paye / annule) |
| POST | `/api/documents/:id/convert` | Convertir en autre type |
| POST | `/api/documents/:id/duplicate` | Dupliquer |

### Clients, Produits, Paramètres
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/clients` | Liste / Créer (vérifie limite plan) |
| GET/PUT/DELETE | `/api/clients/:id` | Détail / Modifier / Supprimer |
| POST | `/api/clients/import-csv` | Import CSV en masse |
| GET/POST | `/api/products` | Liste / Créer |
| GET/PUT/DELETE | `/api/products/:id` | Détail / Modifier / Supprimer |
| GET/PUT | `/api/settings` | Paramètres org |
| POST | `/api/settings/logo` | Uploader un logo |
| POST | `/api/settings/signature` | Uploader une signature |

### Plans & Upgrades

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/plans` | Plans actifs (public) |
| GET | `/api/plans/payment-config` | Numéro Wave/OM + email support (public) |
| POST | `/api/upgrades` | Soumettre une demande de mise à niveau |
| GET | `/api/upgrades/mine` | Mes demandes (org courante) |

### Super Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/stats` | KPIs plateforme (MRR, orgs, users, graphiques) |
| GET | `/api/admin/organizations` | Toutes les organisations |
| PATCH | `/api/admin/organizations/:id/plan` | Changer le plan |
| PATCH | `/api/admin/organizations/:id/suspend` | Suspendre/réactiver |
| DELETE | `/api/admin/organizations/:id` | Supprimer |
| GET | `/api/admin/users` | Tous les utilisateurs |
| PATCH | `/api/admin/users/:id/superadmin` | Promouvoir super admin |
| GET | `/api/admin/plans` | Liste des plans configurables |
| PATCH | `/api/admin/plans/:key` | Modifier un plan (prix, limites, features, actif) |
| GET | `/api/admin/upgrades` | Demandes de mise à niveau |
| PATCH | `/api/admin/upgrades/:id` | Valider ou rejeter une demande |
| GET | `/api/admin/config` | Config plateforme (numéro paiement, email) |
| PATCH | `/api/admin/config` | Modifier la config plateforme |

---

## Modèle Multi-Tenant

Chaque organisation est un **tenant isolé**. Toutes les données (clients, produits, documents, paramètres) sont filtrées par `organizationId`.

```
User (1) ──── (N) OrganizationMember (N) ──── (1) Organization
                        │ role: OWNER / ADMIN / MEMBER
                        └── scoping par organizationId
```

**Flux d'invitation :**

1. OWNER/ADMIN entre un email → système vérifie si l'utilisateur existe
2. Si email **existant** → ajout direct à l'org + email de notification
3. Si email **inconnu** → email avec lien `/accept-invite?token=JWT_7j`
4. Destinataire clique → s'inscrit (crée son propre espace) + rejoint l'org invitante

---

## Plans & Enforcement des Limites

| Plan | Prix/mois | Membres | Documents | Clients |
|------|-----------|---------|-----------|---------|
| FREE | 0 FCFA | 1 | 10 | 5 |
| STARTER | 9 900 FCFA | 3 | 100 | 50 |
| PRO | 24 900 FCFA | 10 | Illimité | Illimité |
| ENTERPRISE | Sur devis | Illimité | Illimité | Illimité |

Les limites sont **vérifiées en base** à chaque création via `checkPlanLimit()`. Si la limite est atteinte, l'API retourne `403 PLAN_LIMIT_REACHED` avec un message explicite invitant à passer au plan supérieur. Les plans et leurs limites sont modifiables en temps réel depuis `/admin/plans`.

---

## Flux de Paiement (marché UEMOA)

Adapté à la réalité du terrain africain : pas de carte bancaire, Mobile Money dominant.

```
Utilisateur → Choisit un plan supérieur
           → Sélectionne méthode : Wave / Orange Money / Mixx / Espèces
           → Effectue le virement et entre la référence de transaction
           → Demande créée (status: pending)
                        ↓
Super Admin → Reçoit la notification dans /admin/upgrades
           → Vérifie la transaction dans l'application mobile
           → Clique "Valider" → plan mis à jour automatiquement
           → Ou "Rejeter" avec motif → utilisateur informé
```

Le numéro de téléphone de réception des paiements est configurable depuis `/admin/settings` sans redéploiement.

---

## Formatage XOF

Les montants sont toujours affichés sans décimales, avec espace comme séparateur des milliers :

```
1 250 000 FCFA
  125 000 FCFA
   25 000 FCFA
```

## TVA Sénégal

- **Taux par défaut : 18%** (configurable par organisation)
- Applicable ligne par ligne
- Calcul automatique : HT → TVA → TTC

## Numérotation automatique

| Type | Format | Exemple |
|------|--------|---------|
| Facture | FAC-YYYY-NNN | FAC-2026-001 |
| Devis | DEV-YYYY-NNN | DEV-2026-001 |
| Proforma | PRO-YYYY-NNN | PRO-2026-001 |

Le compteur se réinitialise automatiquement chaque année, par organisation.

---

## Licence

MIT — Libre d'utilisation et de modification.

---

Développé pour la zone UEMOA — Sénégal 🇸🇳
