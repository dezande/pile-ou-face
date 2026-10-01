/*
 * LES DEUX PRÉDICTIONS : tout le texte de la carte est ici, et nulle part ailleurs.
 *
 *   pile  écrite quand on touche la moitié du haut de l'écran ;
 *   face  écrite quand on touche la moitié du bas.
 *
 * Chaque prédiction tient sur deux lignes : c'est le retour à la ligne (`\n`) qui décide où ça
 * casse, et nulle part ailleurs. Elle **remplit la carte** : sa taille est calculée pour occuper
 * toute la place, et un texte sur plusieurs lignes reste toujours d'aplomb.
 *
 * Un texte peut s'écrire une seule fois, en chaîne (le même dans les deux langues), ou
 * `{ fr: '…', en: '…' }`. Les tests (tests/logic/predictions.test.ts) vérifient la forme de ce
 * fichier : deux lignes par prédiction, et rien de vide.
 */

import type { Texte } from '../logic/i18n.ts';
import type { Cote } from '../logic/piece.ts';

export const PREDICTIONS: Readonly<Record<Cote, Texte>> = {
	pile: '0,20 euro\npile',
	face: '0,20 euro\nface',
};
