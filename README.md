# Kalmy — l'atelier de couture dans votre poche 🇸🇳

SaaS de gestion pour les couturiers du Sénégal : mesures clients, commandes,
points de vente et équipes.

## Architecture

| Dossier | Techno | Rôle |
|---------|--------|------|
| `mobile/` | Flutter 3.41 (Dart 3.11) | App terrain du couturier : clients, fiches de mesures, commandes |
| `backend/` | Laravel + Sanctum + PostgreSQL + GraphQL (rebing/graphql-laravel) | API multi-tenant consommée par le mobile et le backoffice |
| `backoffice/` | Next.js 16 + Tailwind 4 | Administration plateforme + portail web couturier |

## API : GraphQL pour les lectures, contrôleurs CRUD pour les écritures

Architecture reprise du projet **fadco** :

- **Lectures** — `POST /graphql` (auth Bearer Sanctum). Queries : `clients`,
  `commandes`, `fichemesures`, `pointdeventes`, `organisations`, `dashboard`.
  Chaque query hérite de `App\GraphQL\Support\BaseQuery` (résolution
  automatique du modèle/type, filtres par arguments, `search`, isolation par
  organisation). Passer l'argument `page` bascule sur le type paginé
  `{ metadata { total per_page current_page last_page } data { ... } }`.
- **Écritures** — contrôleurs à hooks héritant de
  `App\Http\Controllers\CRUDController` (`getValidationRules`,
  `beforeValidateData`, `afterCRUDProcessing`…). `POST /api/{resource}/save`
  crée ou met à jour selon la présence de `id` ; `DELETE /api/{resource}/{id}`.

## Modèle métier

- Une **organisation** (atelier/entreprise) = un tenant, avec un **plan** SaaS
  (gratuit, pro, entreprise).
- Une organisation possède plusieurs **points de vente**.
- Les **clients** appartiennent à l'organisation : visibles par **tous** ses
  utilisateurs.
- Les **fiches de mesures** (champs libres en JSON : boubou, taille basse,
  costume…) sont liées au client, et optionnellement à une commande.
- Les **commandes** sont rattachées à un point de vente.
- Les **utilisateurs** ont un rôle (`superadmin`, `proprietaire`, `employe`)
  et un accès limité à certains points de vente pour les commandes.

## Démarrage rapide

### Backend (API)

Prérequis : PostgreSQL local avec une base `kalmy` (voir `backend/.env`).

```bash
createdb kalmy
cd backend
composer install
cp .env.example .env && php artisan key:generate   # puis DB_CONNECTION=pgsql, DB_DATABASE=kalmy
php artisan migrate:fresh --seed   # données de démo partagées par toutes les apps
php artisan serve                  # http://localhost:8000
```

Auth : `POST /api/auth/register`, `POST /api/auth/login` (Bearer Sanctum).
Lectures via `POST /graphql`, écritures via `POST /api/{resource}/save`.

**Comptes de démo** (mot de passe : `password`) :

- `admin@kalmy.sn` — superadmin plateforme (backoffice)
- `ousmane@ateliermedina.sn` — propriétaire de l'Atelier Médina (3 points de vente)
- `binta@ateliermedina.sn` — employée limitée à la Boutique Almadies

### App mobile

```bash
cd mobile
flutter pub get
flutter run
```

L'app consomme l'API réelle (login Sanctum + lectures GraphQL). Sur
émulateur Android, l'hôte `10.0.2.2` est utilisé automatiquement.

### Backoffice

```bash
cd backoffice
npm install
npm run dev   # http://localhost:3000
```

Login réel sur `/` (comptes de démo ci-dessus), dashboard alimenté par
GraphQL sur `/dashboard`. L'hôte API se configure via
`NEXT_PUBLIC_API_HOST` (défaut : `http://127.0.0.1:8000`).

### Stack Docker (API + PostgreSQL + backoffice)

```bash
# À la racine du monorepo — générer une clé APP_KEY pour docker-compose :
cd backend && php artisan key:generate --show
# Copier la valeur dans APP_KEY du docker-compose.yml ou en variable d'environnement

docker compose up --build
```

- API : http://localhost:8000
- Backoffice : http://localhost:3000
- PostgreSQL : port 5432 (user/pass/db : `kalmy`)

Le conteneur backend exécute `migrate`, `db:seed` et `kalmy:rappels-livraison`
au démarrage.

## Design system

Identité partagée mobile/web :

- **Couleurs** : indigo nuit `#17112E`, crème `#FAF6EF`, or `#D9A441`,
  terracotta `#C96F4A`, émeraude `#2E7D5B`.
- **Typos** : Fraunces (titres) + Plus Jakarta Sans (texte).

## Roadmap

- [x] Design system + écrans mobiles (splash, onboarding, login, dashboard, clients, mesures, commandes)
- [x] API Laravel : auth multi-tenant, clients, mesures, commandes, points de vente
- [x] PostgreSQL + seeders de démo partagés
- [x] GraphQL (queries & types façon fadco) + contrôleurs CRUD à hooks
- [x] Mobile et backoffice branchés sur l'API (login Sanctum + GraphQL)
- [x] Mobile : création/édition client, nouvelle commande, changement de statut + acompte, sélecteur de client pour les mesures
- [x] Mobile : session persistée (auto-login), inscription « Créer mon atelier », écran profil/déconnexion
- [x] Backoffice : portail couturier (dashboard atelier, clients + fiches de mesures)
- [x] Gestion des employés et affectation aux points de vente (API + page Équipe)
- [x] Limites des plans SaaS (gratuit : 1 PDV / 2 comptes, pro : 5 / 10, entreprise : illimité)
- [x] Tests feature Laravel (auth, isolation multi-tenant, CRUD, GraphQL)
- [x] Mode hors-ligne mobile (cache SQLite + file d'attente de sync)
- [x] Rappels de livraison (job planifié + affichage mobile/backoffice)
- [x] Structure abonnements (plans, limites, endpoints billing stub Wave)
- [x] Docker Compose pour déploiement local (PostgreSQL + API + backoffice)
- [ ] Paiement réel Wave / Orange Money
- [ ] SMS / WhatsApp aux clients
- [ ] Publication stores (App Store / Play Store)

> Détail des tâches restantes, priorités et pistes techniques : **[RESTE-A-FAIRE.md](./RESTE-A-FAIRE.md)**.
