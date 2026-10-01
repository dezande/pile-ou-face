# Journal des versions

Toutes les versions de Pile ou face, de la plus récente à la plus ancienne.

Les numéros suivent [semver](https://semver.org/lang/fr/) : `MAJEUR.MINEUR.CORRECTIF`. Chaque version correspond à un tag git et à une [Release GitHub](https://github.com/dezande/pile-ou-face/releases). Les versions `0.x` sont l'histoire du développement, avant que l'app soit éprouvée en scène.

**Chaque changement s'écrit ici**, sous « Non publié », dans le même commit que le changement lui-même : la vérification du kit (`npm run check:changelog`) contrôle la forme du journal et refuse un changement qui ne s'explique pas, en pull request comme sur `main`. Publier une version, c'est renommer « Non publié » en numéro de version et poser le tag.

À ne pas confondre avec le **numéro affiché dans le menu de l'app** : celui-là est le nombre de commits, calculé au build, qui identifie précisément la version installée sur un téléphone. Le tableau ci-dessous donne la correspondance.

| Version | Commits | Date | En une phrase |
| --- | --- | --- | --- |
| [0.1.0] | 1 | 2026-10-01 | Première version : une carte, pile en haut, face en bas, et la pièce dessinée à la main |

---

## [0.1.0] — 2026-10-01

1 commit

Première version : la carte des six prédictions, seule sur le tapis, avec le système de la boule de cristal.

- **Une carte, face cachée.** Toucher la **moitié du haut** de l'écran la retourne sur **« 0,20 euro / pile »**, la **moitié du bas** sur **« 0,20 euro / face »**. Chaque prédiction tient sur deux lignes, remplit la carte et est soulignée de deux traits.
- **La pièce de 20 centimes, dessinée à la main** sous la prédiction, du côté annoncé : pile, le côté de la valeur (« 20 », « EURO CENT », la carte de l'Europe et les traits étoilés) ; face, le côté français (la Semeuse dans le soleil levant, « RF » et les douze étoiles). Un croquis au stylo, à l'encre de la carte, avec les sept encoches du vrai bord.
- **Le système de la boule de cristal** : une fois la carte armée, un autre toucher ne change plus rien ; un **double toucher** la remet face cachée ; un **appui de 3 s** ouvre le menu. Deux touchers vifs pour armer ne remettent pas aussitôt la carte face cachée.
- **Délai avant le retournement**, de 0 à 10 s : à 0 s (par défaut) la carte se retourne au toucher ; avec un délai, elle se retourne seule plus tard, et la prédiction est déjà écrite, dos visible.
- **Tout ce que les six prédictions avaient fait pour les cartes** : les six dos (Art déco, Art nouveau, pixel art, minimaliste, pop art, futuriste) et les quatre couleurs, choisis en regardant les vignettes ; l'écriture Caveat embarquée ; le tapis vert ; l'interface en français ou en anglais.
- La police manuscrite est chargée dès l'ouverture : le premier tour est écrit à la même taille que les suivants.
- Télécommande et clavier : ↑ ou Page précédente pour pile, ↓ ou Page suivante pour face, R pour remettre la carte, Échap ou M pour le menu.
- PWA 100 % hors-ligne, toujours en portrait, écran toujours allumé, mises à jour automatiques hors des tours : le kit commun [kit-scene](https://github.com/dezande/kit-scene) v1.3.0.
- Tests unitaires de la logique (côté touché, état de la carte, touches, réglages, contenu) et 19 tests dans Chrome de l'app compilée.

---

### Publier une nouvelle version

À chaque changement, décrivez-le sous **« Non publié »**, dans le commit qui le porte. `npm run check:changelog` (la vérification du kit) contrôle la forme du journal et, en pull request comme sur `main`, refuse un changement qui ne s'explique pas. Un commit qui ne touche vraiment à rien (espaces, renommage sans effet) peut porter `[sans journal]` dans son message pour en être dispensé.

Le déploiement, lui, reste automatique : **chaque fusion sur `main` met l'app à jour** (voir le README). Le tag et la Release sont un geste à part, quand le contenu de « Non publié » mérite d'être nommé. La version se prépare dans une pull request comme le reste ; le tag se pose ensuite sur `main`, où la protection ne s'applique pas aux tags.

```sh
git switch -c version-0.2.0
# dans CHANGELOG.md : renommer « ## [Non publié] » en « ## [0.2.0] — 2026-10-15 »,
# ajouter la ligne au tableau du haut (nombre de commits : git rev-list --count HEAD,
# le commit de version compris) et le lien « [0.2.0]: …/releases/tag/v0.2.0 » en bas
# du fichier, mettre src/version.ts au même numéro, puis :
git commit -am "Version 0.2.0"
git push -u origin version-0.2.0 && gh pr create --fill
gh pr merge --auto --rebase   # part dès que la CI est verte

git switch main && git pull
git tag -a v0.2.0 -m "Titre de la version"
git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0 — Titre" --notes-file notes.md
```

- **Correctif** (`1.0.x`) : corrections, tests, rien de visible dans le déroulé.
- **Mineur** (`1.x.0`) : nouvelle prédiction, nouveau réglage, nouveau geste, sans rien casser.
- **Majeur** (`x.0.0`) : le déroulé ou les gestes changent au point de devoir réapprendre la routine.



[0.1.0]: https://github.com/dezande/pile-ou-face/releases/tag/v0.1.0
