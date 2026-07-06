# Kayñiawlu — ce qui reste à faire

> Dernière mise à jour : 6 juillet 2026.  
> Tout le cœur V1 est en place (API, mobile, backoffice, offline, équipe, rappels).  
> Ce fichier recense ce qui **n'est pas encore fait** ou **volontairement laissé en stub**.

---

## Configuration à finaliser (avant prod)

### Web Push — rappels livraison backoffice

**État actuel :** infra en place (table `web_push_subscriptions`, API subscribe/unsubscribe, service worker `backoffice/public/sw.js`, notifications desktop par polling). Les clés VAPID sont dans `backend/.env` en local.

**À faire :**
- [x] Installer le package PHP : `composer require minishlink/web-push` (fait en local — v8.0.0).
- [ ] Copier les variables VAPID en production (`WEBPUSH_VAPID_PUBLIC_KEY`, `WEBPUSH_VAPID_PRIVATE_KEY`, `WEBPUSH_VAPID_SUBJECT`) — **ne pas réutiliser les clés de dev**.
- [ ] Générer une nouvelle paire prod : `npx web-push generate-vapid-keys`.
- [ ] Backoffice en **HTTPS** obligatoire (service worker + permission navigateur).
- [ ] Activer les préférences dans **Mon compte** (notifications desktop / Web Push).
- [ ] Lancer `php artisan queue:work` (ou worker supervisé) pour que le job `kalmy:rappels-livraison` envoie les push à la création des rappels.

**Fichiers :** `backend/config/webpush.php`, `backend/.env.example`, `backend/app/Services/WebPushNotificationService.php`, `backoffice/src/components/RappelNotificationManager.tsx`.

---

## Priorité haute — pour commercialiser

### Paiement des abonnements (Wave / Orange Money)

**État actuel :** structure prête (`subscription_status`, `subscription_ends_at` sur `Organisation`, endpoints stub dans `BillingController`).

**À faire :**
- [ ] Intégrer l'API Wave (ou Orange Money) : checkout, callback, renouvellement.
- [ ] Webhook sécurisé (`POST /api/billing/webhook/wave`) avec vérification de signature.
- [ ] Mettre à jour `subscription_status` et `plan` après paiement confirmé.
- [ ] UI backoffice : page « Mon abonnement » (plan actuel, upgrade, historique).
- [ ] Bloquer ou avertir quand `subscription_status` = `past_due` / `cancelled`.

**Fichiers de départ :** `backend/app/Http/Controllers/BillingController.php`, `backend/app/Models/Organisation.php`.

---

### Notifications clients (SMS / WhatsApp)

**État actuel :** rappels **internes** à l'atelier (table `rappels`, job `kalmy:rappels-livraison`, affichage mobile + backoffice + push desktop/Web Push côté backoffice). Aucun envoi au client final.

**À faire :**
- [ ] Choisir un fournisseur (Twilio, Meta WhatsApp Business API, service local Sénégal).
- [ ] Modèle de message : rappel livraison, essayage, commande prête.
- [ ] Opt-in du client (consentement téléphone) + respect des horaires.
- [ ] Job ou queue Laravel pour envoi asynchrone + logs d'échec.

---

### Publication en production

**État actuel :** `docker-compose.yml` pour stack **locale** (dev/démo). Pas de déploiement cloud ni stores.

**À faire :**
- [ ] Hébergement API (VPS, Railway, Forge, etc.) + PostgreSQL managé.
- [ ] HTTPS, domaine (`api.kayniawlu.sn` ou équivalent), variables d'environnement prod (dont VAPID, mail SMTP).
- [ ] Backoffice déployé (Vercel ou conteneur) avec `NEXT_PUBLIC_API_HOST` prod.
- [ ] **App Store** (iOS) : compte Apple Developer, certificats, fiche store, captures.
- [ ] **Play Store** (Android) : compte Google Play, AAB signé, fiche store.
- [ ] CI/CD (GitHub Actions) : tests Laravel + build Flutter + build Next.js à chaque PR.

---

## Priorité moyenne — confort produit

### Mobile

- [ ] Mot de passe oublié (écran + endpoint Laravel `password reset`).
- [ ] Édition de client/commande depuis listes (au-delà des écrans déjà branchés).
- [ ] Push notifications **Firebase (FCM)** pour rappels de livraison (le backoffice a déjà desktop + Web Push ; le mobile n'a que le bandeau in-app).
- [x] Filtres recherche + panneau sur **Clients** (genre, pattern `ListFilterShell`).
- [ ] Admin atelier mobile : assignation employés ↔ PDV (comme le modal Équipe du backoffice).
- [ ] Tests widget / intégration plus poussés (hors-ligne, sync queue).
- [ ] Icône et splash stores (assets distincts des écrans in-app).

### Backoffice

- [x] CRUD **clients** et **commandes** côté web atelier (création, édition, suppression, changement de statut).
- [ ] CRUD **mesures** côté web (aujourd'hui lecture seule ; création via mobile).
- [ ] Page « Mon abonnement » (voir paiement ci-dessus).
- [ ] Superadmin : création/suspension d'atelier au-delà du modal « Nouvel atelier ».
- [ ] Export CSV des commandes ou clients.

### Backend

- [ ] Tests E2E GraphQL plus larges (rappels, billing, pagination).
- [ ] Rate limiting API / GraphQL en production.
- [ ] Logs structurés + monitoring (Sentry, etc.).
- [ ] File d'attente Laravel (`queue:work`) documentée et supervisée en prod (rappels, futurs envois SMS, Web Push).

---

## Priorité basse — évolutions V2

- [ ] Espace client (le client final consulte sa commande / ses mesures).
- [x] Reçus PDF commande + ticket de caisse (backoffice + mobile + partage).
- [ ] Factures PDF / reçus d'acompte dédiés (V2).
- [ ] Statistiques avancées (CA par PDV, par période, export comptable).
- [ ] Multi-langue (wolof en plus du français).
- [ ] Mode sombre (mobile + backoffice).
- [ ] Application iPad / tablette optimisée.

---

## Déjà fait (ne pas refaire)

Référence rapide — détail dans `README.md` § Roadmap :

- Auth Sanctum, multi-tenant, GraphQL lectures + CRUD REST écritures.
- Mobile : clients, mesures, commandes, statuts, offline SQLite + sync.
- Mobile : édition des types atelier pendant la saisie des mesures ; snapshot immuable des fiches (`champs` + `valeurs`).
- Mobile : profil connecté (nom, email, téléphone, mot de passe).
- Mobile : admin atelier propriétaire (équipe + PDV CRUD).
- Mobile : filtres commandes et **clients** (recherche + panneau filtres, pattern backoffice).
- Mobile : genre client (masculin, féminin, autre) sur fiche et filtres.
- Backoffice : portail couturier, équipe, superadmin ateliers/utilisateurs.
- Backoffice : CRUD types de vêtement (upload / recherche Openverse), page Mon compte, notifications rappels (desktop + Web Push côté client).
- Plans SaaS (limites PDV / utilisateurs), seeders démo, **42 tests** feature Laravel.
- Rappels livraison internes, Docker Compose local.
- Images types de vêtement (`image_path`, import URL, recherche Openverse).

---

## Ordre recommandé

1. **Finaliser Web Push** (`composer require minishlink/web-push`, clés prod, HTTPS, queue worker).
2. **Déploiement prod** (API + backoffice HTTPS) — pour tester avec de vrais couturiers.
3. **Paiement Wave** — monétiser les plans pro / entreprise.
4. **Stores mobile** — distribution au Sénégal.
5. **SMS / WhatsApp** — valeur ajoutée client final.
6. **Confort** (mot de passe oublié, CRUD web complet, push mobile FCM).

---

*Pour mettre à jour ce fichier : cocher les cases au fur et à mesure et ajuster la date en tête de document.*
