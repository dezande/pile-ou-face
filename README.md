# Pile ou face

Une carte à prédiction, face cachée sur le tapis vert. **Toucher le haut** de l'écran la retourne sur **« 0,20 euro pile »**, **toucher le bas** sur **« 0,20 euro face »** — avec, sous la prédiction, la pièce de 20 centimes dessinée à la main, du côté annoncé.

La carte est celle des [six prédictions](https://github.com/dezande/six-predictions) (dos, couleurs, écriture), le geste celui de la [boule de cristal](https://github.com/dezande/boule-de-cristal) (une zone de l'écran choisit la prédiction).
Une PWA mono-page, 100 % hors-ligne, pilotée au doigt, au clavier ou avec une télécommande de présentation : https://dezande.github.io/pile-ou-face/

## Utilisation

| Geste | Effet |
| --- | --- |
| **Toucher la moitié du haut**, carte face cachée | La carte se retourne sur « 0,20 euro / pile » (en anglais « 0.20 euro / tails ») et la pièce côté pile |
| **Toucher la moitié du bas**, carte face cachée | La carte se retourne sur « 0,20 euro / face » (en anglais « 0.20 euro / heads ») et la pièce côté face |
| **Deux touchers rapprochés**, carte armée ou retournée | La carte revient face cachée, prête pour un nouveau tour |
| **Appui de 3 s** n'importe où | Menu |

Le toucher compte partout dans sa moitié d'écran, pas seulement sur la carte : il n'y a pas de zone à viser en scène.

**Une fois la carte armée, un toucher ne change plus rien** : un doigt posé par mégarde ne fait pas passer la prédiction de pile à face sous les yeux du public. Le double toucher ne compte que si la carte était déjà armée à son premier toucher : deux touchers vifs pour armer la carte ne la remettent pas aussitôt face cachée.

Les gestes sont réglés pour un vrai doigt : un toucher peut durer jusqu'à 0,8 s et bouger de 40 px. Un doigt qui glisse ne fait rien, et un appui relâché entre 0,8 s et 3 s non plus — on peut abandonner un appui long sans armer la carte.

| Touche (clavier ou télécommande) | Effet |
| --- | --- |
| ↑ ou Page précédente | Pile |
| ↓ ou Page suivante | Face |
| R ou Début | Remettre la carte face cachée |
| Échap ou M | Menu |

### Délai

Le menu règle un **délai avant le retournement**, de 0 à 10 s, par demi-seconde. À **0 s** (par défaut), la carte se retourne au toucher. Avec un délai, on touche discrètement, et la carte se retourne seule plus tard — comme le nombre de la boule de cristal. Pendant l'attente, la prédiction est déjà écrite, dos visible : rien n'est calculé au moment où la carte tourne.

### La carte

**Les prédictions** sont dans **[`src/content/predictions.ts`](src/content/predictions.ts)** : une pour pile, une pour face, en français et en anglais, chacune sur deux lignes (le retour à la ligne `\n` décide où ça casse, et rien d'autre). Les tests vérifient qu'elles tiennent bien sur deux lignes. Elles sont écrites à la main, à l'encre bleu-noir sur un papier crème, dans la police **[Caveat](https://fonts.google.com/specimen/Caveat)**, embarquée avec l'app (`public/fonts/`, licence [SIL OFL 1.1](public/fonts/OFL.txt)) : l'écriture est la même sur tous les téléphones. Leur taille est calculée pour remplir la carte, et chacune est soulignée de deux traits.

**La pièce de 20 centimes** ([`src/stage/dessin-piece.ts`](src/stage/dessin-piece.ts)) est un croquis au stylo, de la même encre que la prédiction, et grandit avec elle :

- **pile**, le côté commun, celui de la valeur : un grand « 20 », « EURO CENT », la carte de l'Europe esquissée et les traits étoilés ;
- **face**, le côté français : la Semeuse dans le soleil levant, « RF » et les douze étoiles.

Le bord a les sept encoches de la vraie pièce, il est repassé deux fois sans retomber au même endroit, et un léger tremblé fait vibrer chaque trait comme une main qui dessine.

**Le dos** se choisit dans le menu, **en regardant les vignettes** : les six dessins des six prédictions (Art déco, Art nouveau, pixel art, minimaliste, pop art, futuriste) et quatre couleurs (noir, rouge, bleu, blanc).

### Le menu

Remettre la carte face cachée, le délai, la langue (`FR` / `EN`, pour le menu comme pour la prédiction : en anglais, pile se dit « tails » et face « heads »), le dos et sa couleur, et la jauge de l'appui long — à masquer avant de jouer si le public voit l'écran. Le numéro de version est sous le titre ; le bas du menu détaille ce qui est installé (build, commit, cache hors-ligne, stockage, état de l'écran allumé). Juste après l'ouverture par l'appui long, les touchers dans le menu sont ignorés un court instant : le doigt qui se relève ne clique pas sur le bouton placé dessous.

**L'app s'ouvre toujours sur la carte face cachée**, même après un tour laissé en plan. Les réglages, eux, sont enregistrés sur l'appareil et conservés d'une version à l'autre.

### Écran toujours allumé, toujours en portrait

Comme les autres accessoires de scène, via le kit : l'API Screen Wake Lock et une vidéo muette invisible en boucle, actives en même temps ; verrou de l'orientation sur Android, et sur iPhone l'app pivote tout son affichage pour rester dans l'axe du téléphone — **le haut du téléphone fait toujours pile**, même tourné.

## Installation

L'app doit être servie en HTTPS (GitHub Pages convient ; tous les chemins sont relatifs). Ouvrez la page une fois en ligne pour que le service worker mette tout en cache, puis :

- **iOS** : Safari → Partager → *Sur l'écran d'accueil*.
- **Android** : Chrome → menu → *Installer l'application*.

Sur iPhone, l'app installée a son propre stockage, séparé de Safari : **ouvrez-la une fois depuis l'écran d'accueil avec du réseau**. Ensuite elle démarre sans réseau.

### Vérifier sur le téléphone avant de jouer

1. **Hors-ligne** : ouvrir l'app installée avec du réseau, vérifier dans le menu que « Cache hors-ligne » affiche un nom `pile-ou-face-…`, fermer l'app, passer en mode avion, la rouvrir et jouer pile puis face.
2. **Écran allumé** : verrouillage automatique à 30 s, toucher l'écran une fois, puis attendre 2 minutes : l'écran ne doit pas s'éteindre.
3. **Les deux moitiés** : toucher franchement en haut, puis (après un double toucher) en bas ; vérifier que la prédiction et la pièce correspondent, et que l'écriture est bien celle de Caveat.
4. **Portrait** : tourner le téléphone ; l'affichage reste dans son axe, et son haut fait toujours pile.

## Publication

`main` est protégée, avec les mêmes règles que le kit — **aucun push direct, fusion en rebase, CI verte** : elles sont énoncées une seule fois, dans les [règles de la branche main](https://github.com/dezande/kit-scene#règles-de-la-branche-main) du kit. Ici, le contrôle qui doit passer est le job « Types, tests, build et tests dans Chrome ».

**Chaque fusion sur `main` met l'app à jour** sur GitHub Pages. Le nom du cache hors-ligne est une empreinte de tous les fichiers de `dist/`, numéro de version compris : les téléphones récupèrent la nouvelle version à la prochaine ouverture avec du réseau. L'app ne se recharge d'elle-même que si personne n'a touché l'écran, que le menu est fermé et qu'aucun tour n'est en cours — jamais avec une carte armée ou retournée.

```sh
npm run deploy              # vérifie en local, ouvre la pull request, suit GitHub Actions et contrôle le site
npm run deploy -- --dry-run # vérifications et build seulement, sans push
```

À la main : branche, commit (avec l'entrée sous « Non publié » dans le [journal des versions](CHANGELOG.md)), `git push -u origin ma-branche`, `gh pr create --fill`, `gh pr merge --auto --rebase`. **Rien ne change sans une ligne dans le journal** : `npm run check:changelog` le vérifie, en pull request comme sur `main`.

## Développement

Il faut Node 24 (version figée dans `.nvmrc` : `nvm use`). TypeScript et Sass servent uniquement au build : l'app publiée n'a aucune dépendance. Le code commun aux accessoires de scène vient du kit **[kit-scene](https://github.com/dezande/kit-scene)**, sous-module git monté dans `src/kit/`.

```sh
git submodule update --init   # après un clone : récupère le kit
npm install
npm run serve       # build puis serveur local sur http://localhost:8000
npm test            # tests unitaires (quelques secondes)
npm run test:e2e    # tests dans Chrome de l'app compilée (environ 45 s, après npm run build)
npm run typecheck   # vérification des types
npm run check:changelog # le journal des versions a-t-il été mis à jour ?
npm run build       # génère dist/
```

Organisation de `src/` : voir le commentaire en tête de [`src/app.ts`](src/app.ts).

### Tests

- **Tests unitaires** (`tests/logic/`) : la logique pure de `src/logic/` sous Node — le côté choisi selon la moitié touchée, l'état de la carte (armée une seule fois, double toucher, délai), les gestes, les touches, les réglages, les langues — et la forme de `src/content/predictions.ts` (deux lignes par prédiction).
- **Tests dans Chrome** (`tests/e2e/app.e2e.ts`) : l'app compilée dans Chrome sans interface, sur un écran de téléphone simulé, avec de vrais événements tactiles et clavier. Pile en haut et face en bas avec la bonne pièce, deux lignes et deux traits, la même taille dès le premier tour, le toucher qui ne change plus rien, le double toucher, le délai, le clavier, l'appui de 3 s et le menu (remettre la carte, délai, dos, couleur, langue), le téléphone tourné et le fonctionnement hors-ligne.

### Icônes

L'icône est dessinée dans [`src/icon/icon.svg`](src/icon/icon.svg) : la carte retournée, soulignée deux fois, avec la pièce de 20 centimes, devant une carte au dos rouge. Les deux PNG de `public/icons/` en sont rendus avec Chrome sans interface, à refaire après chaque modification du dessin (le 192 se fabrique en réduisant le 512) :

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
	--screenshot="public/icons/icon-512.png" --window-size=512,512 "file://$PWD/src/icon/icon.svg"
cp public/icons/icon-512.png public/icons/icon-192.png
sips -z 192 192 public/icons/icon-192.png
```
