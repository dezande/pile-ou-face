// Le contenu de src/content/predictions.ts : deux prédictions, chacune sur deux lignes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PREDICTIONS } from '../../src/content/predictions.ts';
import { isTexte, LANGS, t } from '../../src/logic/i18n.ts';
import { COTES } from '../../src/logic/piece.ts';

test('une prédiction pour pile, une pour face, et rien d’autre', () => {
	assert.deepEqual(Object.keys(PREDICTIONS).sort(), [...COTES].sort());
});

test('chaque prédiction tient sur deux lignes, sans ligne vide, dans les deux langues', () => {
	for (const cote of COTES) {
		assert.equal(isTexte(PREDICTIONS[cote]), true, `${cote} : texte incomplet`);
		for (const lang of LANGS) {
			const lignes = t(PREDICTIONS[cote], lang)!.split('\n');
			assert.equal(lignes.length, 2, `${cote} en ${lang} : ${lignes.length} lignes`);
			for (const ligne of lignes) assert.notEqual(ligne.trim(), '', `${cote} en ${lang} : ligne vide`);
		}
	}
});

test('les deux prédictions disent bien pile et face', () => {
	assert.equal(PREDICTIONS.pile, '0,20 euro\npile');
	assert.equal(PREDICTIONS.face, '0,20 euro\nface');
});
