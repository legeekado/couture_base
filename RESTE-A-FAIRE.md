# Kalmy — ce qui reste à faire

> Dernière mise à jour : juillet 2026.  
> Tout le cœur V1 est en place (API, mobile, backoffice, offline, équipe, rappels).  
> Ce fichier recense ce qui **n'est pas encore fait** ou **volontairement laissé en stub**.

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

**État actuel :** rappels **internes** à l'atelier (table `rappels`, job `kalmy:rappels-livraison`, affichage mobile + backoffice). Aucun envoi au client final.

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
- [ ] HTTPS, domaine (`api.kalmy.sn`), variables d'environnement prod.
- [ ] Backoffice déployé (Vercel ou conteneur) avec `NEXT_PUBLIC_API_HOST` prod.
- [ ] **App Store** (iOS) : compte Apple Developer, certificats, fiche store, captures.
- [ ] **Play Store** (Android) : compte Google Play, AAB signé, fiche store.
- [ ] CI/CD (GitHub Actions) : tests Laravel + build Flutter + build Next.js à chaque PR.

---

## Priorité moyenne — confort produit

### Mobile

- [ ] Mot de passe oublié (écran + endpoint Laravel `password reset`).
- [ ] Édition de client/commande depuis listes (au-delà des écrans déjà branchés).
- [ ] Push notifications (Firebase) pour rappels de livraison à la place du seul bandeau in-app.
- [ ] Tests widget / intégration plus poussés (hors-ligne, sync queue).
- [ ] Icône et splash stores (assets distincts des écrans in-app).

### Backoffice

- [ ] CRUD clients / commandes / mesures côté web (aujourd'hui surtout lecture + équipe).
- [ ] Page « Mon abonnement » (voir paiement ci-dessus).
- [ ] Superadmin : création/suspension d'atelier au-delà du modal « Nouvel atelier ».
- [ ] Export CSV des commandes ou clients.

### Backend

- [ ] Tests E2E GraphQL plus larges (rappels, billing, pagination).
- [ ] Rate limiting API / GraphQL en production.
- [ ] Logs structurés + monitoring (Sentry, etc.).
- [ ] File d'attente Laravel (`queue:work`) pour rappels et futurs envois SMS.

---

## Priorité basse — évolutions V2

- [ ] Espace client (le client final consulte sa commande / ses mesures).
- [ ] Factures PDF / reçus d'acompte.
- [ ] Statistiques avancées (CA par PDV, par période, export comptable).
- [ ] Multi-langue (wolof en plus du français).
- [ ] Mode sombre (mobile + backoffice).
- [ ] Application iPad / tablette optimisée.

---

## Déjà fait (ne pas refaire)

Référence rapide — détail dans `README.md` § Roadmap :

- Auth Sanctum, multi-tenant, GraphQL lectures + CRUD REST écritures.
- Mobile : clients, mesures, commandes, statuts, offline SQLite + sync.
- Backoffice : portail couturier, équipe, superadmin ateliers/utilisateurs.
- Plans SaaS (limites PDV / utilisateurs), seeders démo, 21 tests feature Laravel.
- Rappels livraison internes, Docker Compose local.

---

## Ordre recommandé

1. **Déploiement prod** (API + backoffice HTTPS) — pour tester avec de vrais couturiers.
2. **Paiement Wave** — monétiser les plans pro / entreprise.
3. **Stores mobile** — distribution au Sénégal.
4. **SMS / WhatsApp** — valeur ajoutée client final.
5. **Confort** (mot de passe oublié, CRUD web, push).

---

*Pour mettre à jour ce fichier : cocher les cases au fur et à mesure et ajuster la date en tête de document.*
