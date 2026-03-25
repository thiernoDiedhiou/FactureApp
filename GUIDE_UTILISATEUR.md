# Guide Utilisateur — CFActure

> Application de facturation XOF pour techniciens IT, freelances et PME — Zone UEMOA

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Créer un compte](#2-créer-un-compte)
3. [Se connecter](#3-se-connecter)
4. [Tableau de bord](#4-tableau-de-bord)
5. [Gérer ses clients](#5-gérer-ses-clients)
6. [Gérer ses produits et services](#6-gérer-ses-produits-et-services)
7. [Créer un document](#7-créer-un-document)
8. [Gérer un document](#8-gérer-un-document)
9. [Paramètres de l'entreprise](#9-paramètres-de-lentreprise)
10. [Organisation et membres](#10-organisation-et-membres)
11. [Plans et abonnements](#11-plans-et-abonnements)
12. [Administration Super Admin](#12-administration-super-admin)
13. [FAQ](#13-faq)

---

## 1. Présentation

CFActure est une application de facturation en ligne adaptée à la zone UEMOA. Elle permet de créer et envoyer des **factures**, **devis** et **factures proforma** en Franc CFA (XOF), de gérer vos clients et produits, et de collaborer avec votre équipe au sein d'une organisation.

**Fonctionnalités principales :**

- Création de factures, devis et proformas numérotés automatiquement
- Génération et envoi de PDF par email
- Gestion du catalogue produits/services avec TVA (18% par défaut)
- Tableau de bord avec statistiques en temps réel
- Collaboration multi-utilisateurs au sein d'une organisation
- Plans adaptés aux besoins de chaque structure

---

## 2. Créer un compte

1. Rendez-vous sur la page d'accueil de CFActure
2. Cliquez sur **Créer mon compte**
3. Remplissez le formulaire :
   - **Nom complet** — votre nom ou celui du responsable
   - **Nom de l'organisation** — le nom de votre entreprise ou activité
   - **Adresse email** — sera utilisée pour vous connecter
   - **Mot de passe** — minimum 8 caractères
4. Cliquez sur **Créer mon compte**
5. Un email de vérification est envoyé à votre adresse — cliquez sur le lien dans cet email pour activer votre compte

> **Important :** Le lien de vérification est valable 24 heures. Vérifiez aussi votre dossier spam si vous ne recevez pas l'email.

---

## 3. Se connecter

1. Rendez-vous sur la page de connexion
2. Saisissez votre **adresse email** et votre **mot de passe**
3. Cliquez sur **Se connecter**

### Mot de passe oublié ?

1. Cliquez sur **Mot de passe oublié ?** sur la page de connexion
2. Saisissez votre adresse email
3. Vous recevrez un email avec un lien de réinitialisation (valable **1 heure**)
4. Cliquez sur le lien, saisissez votre nouveau mot de passe
5. Vous êtes redirigé vers la page de connexion

---

## 4. Tableau de bord

Le tableau de bord est la première page affichée après connexion. Il présente :

- **Chiffre d'affaires du mois** — total des factures payées ce mois
- **Documents en attente** — factures non encore payées
- **Nombre de clients** — total de votre base clients
- **Derniers documents** — les 5 documents les plus récents avec leur statut
- **Graphique mensuel** — évolution du CA sur les 6 derniers mois

---

## 5. Gérer ses clients

### Ajouter un client

1. Cliquez sur **Clients** dans le menu latéral
2. Cliquez sur **Nouveau client**
3. Remplissez les informations :
   - **Nom** *(obligatoire)* — nom du client ou du contact
   - **Société** — raison sociale si applicable
   - **NINEA** — numéro d'identification fiscale (optionnel)
   - **Email** — pour l'envoi des documents
   - **Téléphone**
   - **Adresse**
4. Cliquez sur **Enregistrer**

### Modifier ou supprimer un client

1. Dans la liste des clients, cliquez sur le client souhaité
2. Utilisez le bouton **Modifier** pour mettre à jour ses informations
3. Utilisez le bouton **Supprimer** pour le supprimer

> **Attention :** La suppression d'un client est irréversible. Les documents associés sont conservés mais ne seront plus liés à ce client.

### Fiche client

La fiche client affiche l'historique de tous les documents créés pour ce client, ainsi que le total facturé.

---

## 6. Gérer ses produits et services

Le catalogue produits vous permet de pré-enregistrer vos articles pour les réutiliser rapidement lors de la création de documents.

### Ajouter un produit / service

1. Cliquez sur **Produits** dans le menu latéral
2. Cliquez sur **Nouveau produit**
3. Remplissez les informations :
   - **Nom** *(obligatoire)*
   - **Description**
   - **Prix unitaire** (en FCFA HT)
   - **Taux de TVA** — 18% par défaut (modifiable)
   - **Catégorie** — pour organiser votre catalogue
4. Cliquez sur **Enregistrer**

### Utilisation dans un document

Lors de la création d'un document, vous pouvez rechercher et sélectionner un produit du catalogue — le prix et la TVA sont remplis automatiquement.

---

## 7. Créer un document

CFActure propose trois types de documents :

| Type | Numérotation | Usage |
|------|-------------|-------|
| **Facture** | FAC-AAAA-NNN | Document de vente définitif |
| **Devis** | DEV-AAAA-NNN | Proposition commerciale avant vente |
| **Proforma** | PRO-AAAA-NNN | Facture provisoire pour engagement |

### Étapes de création

1. Cliquez sur **Documents** dans le menu latéral
2. Cliquez sur **Nouveau document**
3. Choisissez le **type** (Facture, Devis, Proforma)
4. Sélectionnez le **client**
5. Renseignez la **date d'émission** et la **date d'échéance** (optionnelle)
6. Ajoutez les **lignes de produits/services** :
   - Cliquez sur **Ajouter une ligne**
   - Recherchez un produit du catalogue ou saisissez librement
   - Indiquez la **quantité**, le **prix unitaire** et le **taux de TVA**
7. Ajoutez une **remise** globale en pourcentage si nécessaire (ex : 10%)
8. Ajoutez des **notes** (optionnel) — apparaîtront en bas du document
9. Cliquez sur **Créer**

> Le numéro est attribué **automatiquement** et de manière séquentielle (ex : FAC-2025-001, FAC-2025-002…).

---

## 8. Gérer un document

### Statuts d'un document

| Statut | Signification |
|--------|---------------|
| **En attente** | Document émis, paiement non reçu |
| **Payé** | Paiement confirmé |
| **Annulé** | Document annulé |

Pour changer le statut, ouvrez le document et utilisez les boutons d'action.

### Actions disponibles sur un document

- **Télécharger PDF** — génère et télécharge le PDF du document
- **Envoyer par email** — envoie le PDF en pièce jointe à l'adresse du client
  - Vous pouvez personnaliser l'objet et le corps du message
- **Dupliquer** — crée une copie du document (utile pour des factures similaires)
- **Convertir en facture** — transforme un devis ou proforma en facture
- **Marquer comme payé** — passe le statut à "Payé"
- **Annuler** — passe le statut à "Annulé"
- **Supprimer** — supprime définitivement le document

### Templates PDF

Trois styles de PDF sont disponibles, configurables dans les **Paramètres** :

- **Classique** — sobre et professionnel
- **Moderne** — avec bandeau coloré en en-tête
- **Compact** — format condensé sur une page

---

## 9. Paramètres de l'entreprise

1. Cliquez sur **Paramètres** dans le menu latéral
2. Configurez les informations de votre entreprise :

### Identité de l'entreprise

- **Nom de l'entreprise** — affiché sur tous vos documents
- **NINEA** — numéro d'identification fiscale
- **Adresse**, **Téléphone**, **Email**, **Site web**
- **Logo** — importez votre logo (PNG/JPG, max 2 Mo) — apparaît sur les PDF
- **Signature** — importez une image de signature

### Préférences de facturation

- **Taux de TVA par défaut** — 18% pour le Sénégal
- **Style de document** — Classique, Moderne ou Compact
- **Couleur principale** — personnalisez la couleur de vos documents PDF
- **Langue** — Français ou Anglais

---

## 10. Organisation et membres

CFActure fonctionne avec un système d'organisation. Toutes les données (clients, documents, produits) appartiennent à votre organisation.

### Rôles des membres

| Rôle | Droits |
|------|--------|
| **Propriétaire** | Tous les droits + gestion du plan et de la facturation |
| **Administrateur** | Tous les droits sauf la gestion du plan |
| **Membre** | Création et consultation, pas de suppression |

### Inviter un membre

1. Cliquez sur **Organisation** dans le menu latéral
2. Cliquez sur **Inviter un membre**
3. Saisissez l'adresse email et choisissez le rôle
4. Cliquez sur **Envoyer l'invitation**

La personne invitée recevra un email avec un lien. Si elle n'a pas encore de compte CFActure, elle pourra en créer un directement depuis le lien d'invitation.

### Modifier ou retirer un membre

Dans la page Organisation, cliquez sur les actions à côté du membre concerné pour modifier son rôle ou le retirer de l'organisation.

---

## 11. Plans et abonnements

### Tableau comparatif des plans

| Plan | Prix | Documents | Clients | Membres |
|------|------|-----------|---------|---------|
| **Gratuit** | 0 FCFA | 10 | 5 | 1 |
| **Starter** | Sur devis | 100 | 50 | 3 |
| **Pro** | Sur devis | Illimité | Illimité | 10 |
| **Entreprise** | Sur devis | Illimité | Illimité | Illimité |

> Les prix exacts de chaque plan sont affichés sur la page **Plans** de votre espace.

### Comment passer à un plan supérieur ?

1. Cliquez sur **Plans** dans le menu latéral
2. Choisissez le plan souhaité et cliquez sur **Choisir ce plan**
3. Sélectionnez votre moyen de paiement :
   - **Wave** — envoyez le montant au numéro affiché
   - **Orange Money** — envoyez le montant au numéro affiché
   - **Mixx by Joni Joni** — envoyez le montant au numéro affiché
   - **Cash** — remise en main propre
4. Après avoir effectué le paiement, **saisissez la référence de transaction** (ID Wave, Orange Money, etc.)
5. Cliquez sur **Envoyer la demande**

Votre demande sera examinée par l'équipe CFActure. Une fois validée, votre plan est **mis à niveau immédiatement**. Vous pouvez suivre l'état de votre demande sur la page Plans.

> Pour tout problème, contactez le support à l'adresse affichée sur la page Plans.

---

## 12. Administration Super Admin

> Cette section concerne uniquement l'équipe CFActure (accès restreint).

L'interface Super Admin est accessible via `/admin` pour les comptes ayant le statut Super Admin.

### Tableau de bord admin

Vue d'ensemble de la plateforme : nombre d'organisations, utilisateurs, documents créés, revenus.

### Gestion des organisations

- Lister toutes les organisations inscrites
- Consulter les détails (plan actuel, nombre de membres, date de création)
- Suspendre ou réactiver une organisation

### Gestion des utilisateurs

- Lister tous les utilisateurs de la plateforme
- Rechercher par email ou nom

### Gestion des plans

- Modifier les limites de chaque plan (documents max, clients max, membres max)
- Modifier le prix affiché et la description
- Activer ou désactiver un plan

### Demandes de mise à niveau

1. Accédez à **Demandes upgrade** dans le menu admin
2. Consultez les demandes en attente avec : organisation, plan demandé, montant, moyen de paiement, référence de transaction
3. Cliquez sur **Valider** pour confirmer le paiement — le plan de l'organisation est mis à jour automatiquement
4. Cliquez sur **Rejeter** pour refuser en ajoutant un motif (visible par l'utilisateur)

### Paramètres plateforme

Modifiez depuis **Paramètres** dans le menu admin :
- **Numéro Wave / Orange Money** — affiché aux utilisateurs qui souhaitent passer à un plan payant
- **Nom du bénéficiaire**
- **Email de support**

---

## 13. FAQ

**Mon email de vérification n'est pas arrivé.**
Vérifiez votre dossier spam. Si le problème persiste après 10 minutes, essayez de vous reconnecter — un nouveau lien peut être demandé depuis la page de connexion.

**J'ai atteint la limite de mon plan.**
Un message vous indique que vous avez atteint la limite. Rendez-vous sur la page **Plans** pour passer à un plan supérieur.

**Puis-je modifier un document après création ?**
Oui, tant que son statut est **En attente**. Un document **Payé** ou **Annulé** ne peut plus être modifié.

**Comment exporter tous mes documents ?**
Pour l'instant, chaque document peut être téléchargé individuellement en PDF. L'export groupé est prévu dans une prochaine version.

**La TVA est-elle obligatoire ?**
Non. Vous pouvez définir un taux de TVA à 0% pour les lignes ou documents non soumis à la TVA.

**Puis-je utiliser CFActure pour plusieurs entreprises ?**
Un compte utilisateur peut appartenir à plusieurs organisations. Il vous suffit d'être invité dans une autre organisation ou d'en créer une nouvelle.

**Comment contacter le support ?**
L'adresse email du support est affichée en bas de la page **Plans**. Vous pouvez aussi envoyer un message à l'adresse indiquée dans vos documents de bienvenue.

---

*CFActure — Application de facturation XOF — Zone UEMOA*
*Documentation version 1.0 — Mars 2026*
