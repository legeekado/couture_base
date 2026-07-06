# Kalmy — comptes de démo et accès

Mot de passe commun pour **tous** les comptes ci-dessous : `password`

Données générées par `php artisan migrate:fresh --seed` dans le backend.

---

## Rôles et règles générales

| Rôle | Code API | Périmètre |
|------|----------|-----------|
| **Superadmin** | `superadmin` | Plateforme entière (toutes les organisations) |
| **Propriétaire** | `proprietaire` | Son atelier : tous les clients, tous les points de vente, toutes les commandes de l'organisation |
| **Employé** | `employe` | Clients de **tout** l'atelier ; commandes **uniquement** sur les points de vente qui lui sont assignés |

### Détail des accès API

- **Clients & fiches de mesures** : visibles par tous les utilisateurs de l'organisation (propriétaire et employés).
- **Commandes** : filtrées par point de vente pour les employés sans `acces_tous_points_de_vente`.
- **Points de vente** : création/modification réservée au propriétaire ou superadmin.
- **Équipe (utilisateurs)** : gestion (`POST /api/users/save`) réservée au propriétaire ou superadmin.
- **Organisations** : le superadmin voit toutes les organisations ; les autres ne voient que la leur.

### Backoffice web (`http://localhost:3000`)

| Rôle | Menu disponible |
|------|-----------------|
| **Superadmin** | Vue d'ensemble · Ateliers · Commandes · Utilisateurs |
| **Propriétaire** | Mon atelier · Clients · Commandes · Équipe |
| **Employé** | Mon atelier · Clients · Commandes |

### App mobile

Prévue pour le terrain (propriétaire / employé). Le superadmin peut se connecter mais n'a pas d'atelier associé.

---

## Comptes principaux (Atelier Médina)

Organisation : **Atelier Médina** — plan **pro** (5 PDV max, 10 utilisateurs max)

Points de vente :
- Atelier Médina (Dakar)
- Boutique Almadies (Dakar)
- Atelier Touba (Touba)

### `admin@kalmy.sn` — Admin Kalmy

| | |
|---|---|
| **Rôle** | Superadmin |
| **Organisation** | Aucune |
| **Backoffice** | Vue plateforme : tous les ateliers, toutes les commandes, tous les utilisateurs |
| **Mobile** | Connexion possible, pas de contexte atelier |
| **Écritures API** | Non limité par les plans SaaS |

### `ousmane@ateliermedina.sn` — Ousmane Sarr

| | |
|---|---|
| **Rôle** | Propriétaire |
| **Organisation** | Atelier Médina |
| **Points de vente** | Tous (acces_tous_points_de_vente = oui) |
| **Backoffice** | Dashboard atelier, clients, commandes, gestion équipe |
| **Mobile** | Accès complet atelier |
| **Peut** | Créer/modifier clients, mesures, commandes, PDV, employés |

### `binta@ateliermedina.sn` — Binta Kane

| | |
|---|---|
| **Rôle** | Employée |
| **Organisation** | Atelier Médina |
| **Points de vente assignés** | **Boutique Almadies uniquement** |
| **Backoffice** | Mon atelier, clients, commandes (filtrées) |
| **Mobile** | Idem — commandes limitées aux PDV assignés |
| **Clients visibles** | Tous les clients de l'atelier (Awa, Moussa, Fatou, etc.) |
| **Commandes visibles** | Uniquement celles du PDV Almadies (ex. KLM-0237, KLM-0240 en seed) |
| **Ne peut pas** | Gérer l'équipe, créer des PDV |

---

## Autres ateliers (backoffice superadmin)

Comptes propriétaires créés pour peupler la vue « Ateliers ». Mot de passe : `password`.

| Atelier | Plan | PDV | Email propriétaire |
|---------|------|-----|-------------------|
| Couture Élégance (Thiès) | pro | 2 | `adama.diallo@coutureelegance.sn` |
| Ndeye Fashion (Saint-Louis) | gratuit | 1 | `ndeye.fall@ndeyefashion.sn` |
| Tailor's House (Dakar) | entreprise | 6 | `mamadou.sy@tailorshouse.sn` |
| Baobab Couture (Touba) | gratuit | 1 | `fatou.mbaye@baobabcouture.sn` |

Ces comptes ont les mêmes accès qu'un **propriétaire** sur leur propre organisation.

---

## Limites des plans SaaS

| Plan | Points de vente | Utilisateurs |
|------|-----------------|--------------|
| **gratuit** | 1 | 2 |
| **pro** | 5 | 10 |
| **entreprise** | illimité | illimité |

Appliquées à la **création** de PDV ou d'utilisateurs (message 422 si dépassement). Le superadmin n'est pas soumis à ces limites.

---

## Inscription (nouveau compte)

Via mobile ou API `POST /api/auth/register` : crée une organisation (plan **gratuit** par défaut), un premier point de vente et un compte **propriétaire**.
