# calculateur-impot-vaud · Calculateur IGI Vaud

Calculateur web de l'**impôt sur le gain immobilier** du Canton de Vaud, porté
1:1 depuis le classeur Excel `IGI Vaud Calculateur v2.xlsx` (barème art. 72 LI
en vigueur au 01.01.2026).

🌐 **Site en ligne** : voir GitHub Pages (Settings → Pages)

## Contenu

| Fichier        | Rôle                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| `index.html`   | Structure HTML — 4 onglets (Calculateur · Exemple · Barème · Guide)     |
| `styles.css`   | Design éditorial (palette navy + or, serif Cormorant, responsive)       |
| `app.js`       | Logique de calcul (formules Excel portées en JS) + rendu                |
| `serve.ps1`    | Petit serveur HTTP PowerShell pour développement local (port 5173)      |

## Calculs implémentés

- Durée de possession réelle (`ROUNDDOWN((venteDate − achatDate) / 365.25)`)
- Droits de mutation **3,3 %** (art. 10-11 LMSD Vaud)
- Frais notaire + Registre foncier **0,7 %**
- Travaux de plus-value (impenses art. 70 LI)
- Durée fiscale pondérée — **les années de résidence principale comptent
  double** (art. 72 al. 4 LI)
- Éligibilité de l'option « estimation fiscale officielle » (art. 67 al. 2 LI)
- Barème de taux art. 72 LI (`VLOOKUP` approximatif)
- Franchise légale **CHF 5 000** (art. 62 let. b LI)
- Taux plancher **7 %** dès 24 ans pondérés
- Alerte « économie si vente différée d'1 an »

Vérifié contre l'exemple chiffré du classeur : **IGI = 13 636 CHF**.

## Lancement local

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Puis ouvrir <http://localhost:5173>.

## Disclaimer

Outil d'estimation à usage pédagogique — ne constitue pas un avis juridique
ou fiscal. Pour tout calcul définitif, consulter un notaire vaudois ou l'ACI
(<https://www.vd.ch>).
