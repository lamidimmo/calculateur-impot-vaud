# Déploiement — Mémo

Tout ce qu'il faut savoir pour retrouver, redéployer ou cloner ce projet.

## URLs

| | |
|---|---|
| **Site live** | <https://kyorguen.github.io/calculateur-impot-vaud/> |
| **Repo GitHub** | <https://github.com/Kyorguen/calculateur-impot-vaud> |
| **Compte GitHub** | `Kyorguen` |
| **Branche** | `main` |
| **Pages source** | `main` / `/` (root) |
| **HTTPS** | forcé |

## Origine

Site web extrait du classeur Excel `IGI Vaud Calculateur v2.xlsx` (4 feuilles :
Barème, Calculateur, Exemple chiffré, Guide travaux) — porté en HTML / CSS / JS
vanille, sans framework.

Source vérifiée contre l'exemple chiffré du classeur :
**IGI = 13 636,00 CHF** (gain net 194 800 CHF × 7 % à 24 ans pondérés).

## Structure du repo

```
.
├── index.html        ← structure des 4 onglets
├── styles.css        ← design (palette navy + or, serif Cormorant + Inter)
├── app.js            ← formules portées 1:1 depuis l'Excel + tabs + chart SVG
├── serve.ps1         ← serveur HTTP PowerShell local (port 5173)
├── README.md         ← description publique
├── DEPLOYMENT.md     ← ce fichier
├── .gitignore        ← exclut igi_dump/ et .claude/settings.local.json
└── .claude/
    └── launch.json   ← config Launch preview de Claude Code
```

## Lancement local

Via Claude Code (bouton Launch) ou directement :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
# → http://localhost:5173
```

## Outils utilisés

| | |
|---|---|
| **Git** | 2.54.0 (Windows) — identité locale `Kev <kev@local>` (à ajuster si besoin) |
| **GitHub CLI** | 2.92.0 — installé via `winget install GitHub.cli` |
| **Auth gh** | scopes `repo`, `read:org`, `gist` — token dans le keyring Windows |

## Comment ce déploiement a été monté (pour rejouer)

```powershell
# 1. Installation gh
winget install --id GitHub.cli --silent --accept-source-agreements --accept-package-agreements

# 2. Auth (flux web — code à coller sur https://github.com/login/device)
gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key

# 3. Création du repo + premier push
gh repo create mon-budget --public --source . --remote origin `
  --description "Calculateur IGI Canton de Vaud — porté depuis Excel" --push

# 4. Renommage (optionnel — fait dans cette session)
gh repo rename calculateur-impot-vaud --repo Kyorguen/mon-budget --yes
git remote set-url origin https://github.com/Kyorguen/calculateur-impot-vaud.git

# 5. Activation de GitHub Pages depuis main / root
gh api -X POST repos/Kyorguen/calculateur-impot-vaud/pages `
  -f "source[branch]=main" -f "source[path]=/"

# 6. Vérification du build
gh api repos/Kyorguen/calculateur-impot-vaud/pages/builds/latest `
  --jq '{status, error: .error.message}'
```

## Mise à jour du site

Simplement `git push` sur `main` — GitHub Pages reconstruit automatiquement
(durée habituelle : ~30 s à 2 min).

```bash
git add .
git commit -m "Description du changement"
git push
```

## Règles fiscales codées (à mettre à jour si la loi change)

| Règle | Valeur | Source | Fichier |
|---|---|---|---|
| Droits de mutation | 3,3 % du prix d'achat | art. 10-11 LMSD Vaud | `app.js` constante `0.033` |
| Frais notaire + RF | 0,7 % (par défaut) | usage | `app.js` constante `0.007` |
| Bonus résidence principale | × 2 (années comptent double) | art. 72 al. 4 LI | `compute()` : `realYears + ansPrincipale` |
| Franchise légale | CHF 5 000 | art. 62 let. b LI | `app.js` const `FRANCHISE` |
| Taux plancher | 7 % dès 24 ans | art. 72 LI | `app.js` const `FLOOR_YEARS` |
| Barème complet | 0 → 30 %, 24 ans → 7 % | art. 72 LI | `app.js` const `BAREME` |
| Option estimation fiscale | ≥ 10 ans en vigueur + postérieure à l'achat | art. 67 al. 2 LI | `compute()` éligibilité |

Au 01.01.2026.

## Historique des commits

```
4b48306 Update README title to match renamed repo (calculateur-impot-vaud)
38673e3 Restructure for GitHub Pages: move site to repo root + add README
522c89b Add IGI Vaud web calculator extracted from Excel workbook
```

## Disclaimer

Outil d'estimation à usage pédagogique — ne constitue pas un avis juridique ou
fiscal. Pour tout calcul définitif, consulter un notaire vaudois ou l'ACI
(<https://www.vd.ch>).
