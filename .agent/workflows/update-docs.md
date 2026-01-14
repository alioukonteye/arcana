---
description: Met à jour la documentation après des changements majeurs sur le projet
---

# Workflow: Mise à Jour de la Documentation

Ce workflow analyse les changements récents du projet Arcana et met à jour la documentation en conséquence.

## Déclenchement

Exécuter ce workflow après:
- Ajout/modification d'endpoints API
- Modification du schéma Prisma
- Ajout de nouvelles fonctionnalités
- Changements architecturaux

## Étapes

### 1. Analyser les fichiers sources

Examiner les fichiers suivants pour détecter les changements:

```
apps/api/src/index.ts          → Routes API
apps/api/prisma/schema.prisma  → Modèle de données
apps/api/src/services/         → Services métier
apps/web/src/components/       → Composants UI
apps/web/src/pages/            → Pages
USER_STORIES.md                → User stories
ARCHITECTURE.md                → Architecture de base
```

### 2. Mettre à jour docs/API.md

Pour chaque route dans `apps/api/src/index.ts`:
- Vérifier que l'endpoint est documenté dans `docs/API.md`
- Ajouter les nouveaux endpoints avec leur documentation complète
- Mettre à jour les paramètres/réponses si modifiés

Chercher la section entre:
```markdown
<!-- AUTO-GEN:API-ROUTES START -->
...
<!-- AUTO-GEN:API-ROUTES END -->
```

### 3. Mettre à jour docs/TECHNICAL.md

Pour les changements dans `schema.prisma`:
- Mettre à jour la section schéma Prisma
- Mettre à jour le diagramme ER si de nouveaux modèles sont ajoutés

Chercher la section entre:
```markdown
<!-- AUTO-GEN:PRISMA-SCHEMA START -->
...
<!-- AUTO-GEN:PRISMA-SCHEMA END -->
```

### 4. Mettre à jour docs/FUNCTIONAL.md

Pour les changements dans `USER_STORIES.md`:
- Synchroniser les user stories
- Mettre à jour les statuts (✅, 🚧, 📋)

### 5. Mettre à jour README.md

- Vérifier que la table des features est à jour
- Mettre à jour les badges si nécessaire

### 6. Vérification finale

- S'assurer que tous les liens internes fonctionnent
- Vérifier la cohérence entre les documents
- Proposer un commit avec un message descriptif

## Exemple de sortie

Après exécution, le workflow doit produire un résumé:

```
📝 Documentation mise à jour:

✅ docs/API.md
   - Ajouté: POST /books/:id/loan
   - Modifié: GET /books (nouveau paramètre ?status=)

✅ docs/TECHNICAL.md
   - Ajouté: Model Loan dans le schéma

✅ docs/FUNCTIONAL.md
   - US3: Suivi des Prêts → status 🚧

Fichiers à committer:
- docs/API.md
- docs/TECHNICAL.md
- docs/FUNCTIONAL.md
```

## Notes

- Ce workflow est conçu pour être exécuté manuellement via `/update-docs`
- Les sections marquées `<!-- AUTO-GEN:... -->` sont prioritaires pour la mise à jour automatique
- Les sections narratives peuvent être enrichies intelligemment
