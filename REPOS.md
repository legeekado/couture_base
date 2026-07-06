# Dépôts Kalmy

Ce dossier (`couture_base`) contient la **racine du monorepo** : documentation,
orchestration Docker, notes et assets partagés.

Chaque application a son propre dépôt Git :

| Dossier local | Dépôt GitHub |
|---------------|--------------|
| `backend/` | [couture_backend](https://github.com/legeekado/couture_backend) |
| `backoffice/` | [couture_backoffice](https://github.com/legeekado/couture_backoffice) |
| `mobile/` | [couture_mobile](https://github.com/legeekado/couture_mobile) |
| `landingpage/` | [couture_landingpage](https://github.com/legeekado/couture_landingpage) |

## Cloner l'écosystème complet

```bash
git clone git@github.com:legeekado/couture_base.git Kalmy
cd Kalmy
git clone git@github.com:legeekado/couture_backend.git backend
git clone git@github.com:legeekado/couture_backoffice.git backoffice
git clone git@github.com:legeekado/couture_mobile.git mobile
git clone git@github.com:legeekado/couture_landingpage.git landingpage
```
