Kayñiawlu — captures d’interfaces (2026-07-10)
============================================

Les captures attendent le chargement des données (pas de spinners).

## Regénérer
```bash
# Backend (8000) + landing dev (3001) + backoffice prod (3010)
cd backoffice && npm run build && PORT=3010 npm run start &
cd scripts && node capture-screenshots.mjs
chmod +x capture-mobile-final.sh && ./capture-mobile-final.sh
chmod +x capture-mobile-parcours.sh && ./capture-mobile-parcours.sh
node capture-backoffice-parcours.mjs
```

## Landing page (`landingpage/`)
- 01-accueil-hero.png
- 02-fonctionnalites.png
- 03-produit.png
- 04-tarifs.png (#offres + cartes pricing API)
- 05-cta-footer.png
- 06-accueil-complet.png (scroll complet + sections révélées)

## Backoffice (`backoffice/`)
- 01-login.png — formulaire auth visible
- 08-register.png — création atelier
- 02-dashboard.png — stats + données
- 03-ateliers.png — cartes ateliers
- 04-commandes.png — tableau commandes
- 05-clients.png — liste clients
- 06-monitoring.png — monitoring connexions
- 07-analyses.png — page analyses

## Mobile (`mobile/`)
- 01-onboarding.png
- 02-login.png
- 03-dashboard.png — avec stats / Salaam
- 04-clients.png — liste clients (+221…)
- 05-commandes.png — commandes avec statuts
- 06-profil.png
- 07-parametres.png

### Parcours mobile — nouvelle commande (`mobile/nouvelle-commande/`)
- 01-liste-commandes.png
- 02-formulaire-vide.png
- 03-selection-client.png
- 04-client-selectionne.png
- 05-vetements-montant.png
- 06-formulaire-complet.png

### Parcours mobile — fiche de mesure (`mobile/fiche-mesure/`)
- 01-dashboard-fab.png
- 02-formulaire-vide.png
- 03-selection-client.png
- 04-client-selectionne.png
- 05-type-vetement.png
- 06-saisie-mesures.png
- 07-formulaire-pret.png

## Backoffice — parcours (`backoffice/`)

### Changer le statut d'une commande (`changer-statut-commande/`)
- 01-liste-commandes.png
- 02-menu-actions.png
- 03-modal-statut.png
- 04-statut-selectionne.png
- 05-liste-apres-enregistrement.png
- 06-detail-timeline.png

### Désactiver un atelier (`desactiver-atelier/`)
- 01-liste-ateliers.png
- 02-menu-desactiver.png
- 03-confirmation-desactiver.png
- 04-apres-desactivation.png
- 05-detail-atelier-suspendu.png
