// Tests de bout en bout : l'app compilée (dist/) dans un vrai Chrome sans interface,
// sur un écran de téléphone, pilotée par de vrais événements tactiles et clavier.
// Lancer : npm run build && npm run test:e2e
//
// Ce qui reste à vérifier sur un vrai téléphone : l'écran toujours allumé, le ressenti des gestes
// et l'installation sur l'écran d'accueil.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { Browser, SCREEN, type Page } from '../../src/kit/node/chrome.ts';
import { startStaticServer, type StaticServer } from '../../src/kit/node/static-server.ts';
import { PREDICTIONS } from '../../src/content/predictions.ts';
import { APP_VERSION } from '../../src/version.ts';
import {
	appuiLong, BAS, CENTER, click, coteEcrit, DEBORDEMENT, doubleToucher, HAUT, isMenuOpen, openApp, PIECE,
	PREDICTION, PRETE, pressKey, retournee, SETTINGS_KEY, TEST_TIMEOUT, text, toucher, turnPhone,
} from './helpers.ts';

let server: StaticServer;
let browser: Browser;

before(async () => {
	if (!existsSync('dist/index.html')) throw new Error('dist/ absent : lancez « npm run build » avant les tests dans Chrome.');
	server = await startStaticServer('dist', 0);
	browser = await Browser.launch();
});

after(async () => {
	await browser?.close();
	await server?.close();
});

const withApp = (storage: Record<string, string>, run: (page: Page) => Promise<void>, url = server.url): Promise<void> =>
	openApp(browser, url, storage, run);

/** Réglages enregistrés sur l'appareil ; les champs absents prennent leur valeur par défaut. */
const reglages = (valeurs: Record<string, unknown>): Record<string, string> => ({ [SETTINGS_KEY]: JSON.stringify(valeurs) });

/* ================= Démarrage ================= */

test('démarrage : une carte face cachée, rien d’écrit', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		assert.equal(await page.evaluate(`document.querySelectorAll('#table .carte').length`), 1);
		assert.equal(await page.evaluate(retournee), false, 'aucune prédiction visible à l’ouverture');
		assert.equal(await page.evaluate(coteEcrit), null, 'aucune prédiction écrite d’avance');
		assert.equal(await page.evaluate(isMenuOpen), false);
	});
});

/* ================= Pile ou face ================= */

test('toucher le haut : la carte se retourne sur « 0,20 euro pile » et la pièce côté pile', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, HAUT);
		assert.equal(await page.evaluate(retournee), true);
		assert.equal(await page.evaluate(PREDICTION), PREDICTIONS.pile);
		assert.equal(await page.evaluate(PIECE), 'pile');
		assert.equal(await page.evaluate(`[...document.querySelectorAll('#table svg.piece text')].some((t) => t.textContent === '20')`), true, 'le côté de la valeur');
	});
});

test('toucher le bas : la carte se retourne sur « 0,20 euro face » et la pièce côté face', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, BAS);
		assert.equal(await page.evaluate(retournee), true);
		assert.equal(await page.evaluate(PREDICTION), PREDICTIONS.face);
		assert.equal(await page.evaluate(PIECE), 'face');
		assert.equal(await page.evaluate(`[...document.querySelectorAll('#table svg.piece text')].some((t) => t.textContent === 'RF')`), true, 'le côté français');
	});
});

test('chaque prédiction tient sur deux lignes, soulignée de deux traits, au-dessus de la pièce', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		for (const [point, cote] of [[HAUT, 'pile'], [BAS, 'face']] as const) {
			await toucher(page, point);
			assert.equal(await page.evaluate(`document.querySelectorAll('#table .prediction br').length`), 1, `${cote} : deux lignes`);
			assert.equal(await page.evaluate(`document.querySelectorAll('#table .soulignement path').length`), 2, `${cote} : deux traits`);
			const ordre = await page.evaluate<string[]>(`[...document.querySelector('#table .ecriture').children].map((e) => e.getAttribute('class'))`);
			assert.deepEqual(ordre, ['prediction', 'soulignement', 'piece'], `${cote} : ordre du bloc écrit`);
			assert.equal(await page.evaluate(DEBORDEMENT), null, `${cote} : le bloc écrit déborde de la carte`);
			await doubleToucher(page);
		}
	});
});

test('pile et face sont écrits à la même taille, dès le premier tour', TEST_TIMEOUT, async () => {
	// La police manuscrite est chargée à l'ouverture : sans cela, le premier tour était mesuré avec
	// la police de secours et sortait plus petit que les suivants.
	const tailles: number[] = [];
	for (const point of [HAUT, BAS]) {
		await withApp({}, async (page) => {
			await toucher(page, point);
			tailles.push(await page.evaluate<number>(`Number(document.querySelector('#table .carte').style.getPropertyValue('--fit'))`));
		});
	}
	assert.ok(tailles[0]! > 1, `prédiction trop petite (${tailles[0]})`);
	assert.ok(Math.abs(tailles[0]! - tailles[1]!) / tailles[0]! < .03, `pile ${tailles[0]} et face ${tailles[1]} devraient être à la même taille`);
});

test('une fois la carte retournée, un autre toucher ne change rien', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, HAUT);
		await sleep(600);
		await toucher(page, BAS);
		assert.equal(await page.evaluate(coteEcrit), 'pile', 'la prédiction n’a pas changé');
		assert.equal(await page.evaluate(retournee), true);
	});
});

test('double toucher : la carte revient face cachée, prête pour un autre tour', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, HAUT);
		await sleep(600);
		await doubleToucher(page);
		assert.equal(await page.evaluate(retournee), false);
		await toucher(page, BAS);
		assert.equal(await page.evaluate(coteEcrit), 'face', 'le nouveau tour choisit à nouveau');
		assert.equal(await page.evaluate(retournee), true);
	});
});

test('deux touchers vifs pour armer ne remettent pas la carte face cachée', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await doubleToucher(page, BAS);
		assert.equal(await page.evaluate(retournee), true, 'la carte reste retournée');
		assert.equal(await page.evaluate(coteEcrit), 'face');
	});
});

test('chaque ouverture redonne la carte face cachée, même en plein tour', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, HAUT);
		await page.reload();
		await page.waitFor(PRETE, 'app rouverte');
		assert.equal(await page.evaluate(retournee), false);
		assert.equal(await page.evaluate(coteEcrit), null);
	});
});

/* ================= Délai ================= */

test('délai : la carte armée ne se retourne qu’au bout du délai', TEST_TIMEOUT, async () => {
	await withApp(reglages({ delai: 2 }), async (page) => {
		await toucher(page, BAS);
		assert.equal(await page.evaluate(retournee), false, 'rien de visible juste après le toucher');
		assert.equal(await page.evaluate(coteEcrit), 'face', 'la prédiction est déjà écrite, dos visible');
		// Pendant le délai, un toucher ne change pas le côté choisi.
		await page.tap(HAUT);
		await page.waitFor(retournee, 'carte retournée après le délai', 3000);
		assert.equal(await page.evaluate(PREDICTION), PREDICTIONS.face);
	});
});

test('délai : un double toucher pendant l’attente annule le tour', TEST_TIMEOUT, async () => {
	await withApp(reglages({ delai: 2 }), async (page) => {
		await page.tap(HAUT);
		await sleep(600);
		await doubleToucher(page);
		await sleep(2000);
		assert.equal(await page.evaluate(retournee), false, 'la carte ne se retourne plus');
	});
});

/* ================= Clavier et télécommande ================= */

test('clavier : Page précédente pile, ↓ face, R remet la carte, Échap ouvre et ferme le menu', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await pressKey(page, 'PageUp');
		await page.waitFor(retournee, 'carte retournée à Page précédente');
		assert.equal(await page.evaluate(coteEcrit), 'pile');

		await pressKey(page, 'r');
		await page.waitFor(`!(${retournee})`, 'carte remise par R');
		await pressKey(page, 'ArrowDown');
		await page.waitFor(retournee, 'carte retournée à ↓');
		assert.equal(await page.evaluate(coteEcrit), 'face');

		await pressKey(page, 'Escape');
		await page.waitFor(isMenuOpen, 'menu ouvert');
		await pressKey(page, 'Escape');
		await page.waitFor(`!(${isMenuOpen})`, 'menu fermé');
	});
});

/* ================= Menu ================= */

test('appui de 3 s : le menu s’ouvre par-dessus la carte, sans la retourner', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await appuiLong(page, HAUT);
		await page.waitFor(isMenuOpen, 'menu ouvert par l’appui long');
		assert.equal(await page.evaluate(retournee), false, 'l’appui long ne retourne pas la carte');
		assert.match(await text(page, '#menu-version'), new RegExp(APP_VERSION.replace(/\./g, '\\.')));
		const dansLeMenu = await page.evaluate<boolean>(
			`Boolean(document.elementFromPoint(${Math.round(CENTER.x)}, ${Math.round(CENTER.y)})?.closest('#menu'))`,
		);
		assert.ok(dansLeMenu, 'au centre de l’écran, c’est le menu qui est devant, pas la carte');
		await click(page, '#close-btn');
		await page.waitFor(`!(${isMenuOpen})`, 'menu fermé');
	});
});

test('menu : remettre la carte face cachée', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, BAS);
		await pressKey(page, 'm');
		await page.waitFor(isMenuOpen, 'menu ouvert');
		await click(page, '#reset-btn');
		await page.waitFor(`!(${isMenuOpen}) && !(${retournee})`, 'carte remise, menu fermé');
	});
});

test('menu : le délai se règle au curseur et reste enregistré', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await pressKey(page, 'm');
		await page.waitFor(isMenuOpen, 'menu ouvert');
		assert.equal(await text(page, '#delai-valeur'), '0 s');
		await page.evaluate(`(() => { const r = document.querySelector('#delai'); r.value = '2.5'; r.dispatchEvent(new Event('input', { bubbles: true })); })()`);
		assert.equal(await text(page, '#delai-valeur'), '2,5 s');
		assert.equal(await page.evaluate(`JSON.parse(localStorage.getItem('${SETTINGS_KEY}')).delai`), 2.5);
	});
});

test('menu : dos et couleur choisis en les regardant, appliqués à la carte', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		assert.equal(await page.evaluate(`document.querySelectorAll('#motif-choix button').length`), 6, 'les six dos des six prédictions');
		assert.equal(await page.evaluate(`document.querySelectorAll('#couleur-choix button').length`), 4, 'les quatre couleurs');
		assert.equal(
			await page.evaluate(`[...document.querySelectorAll('#motif-choix button')].every((b) => b.querySelector('.vignette svg') && b.textContent === '')`),
			true,
			'des vignettes, pas des noms',
		);

		await click(page, '#couleur-choix button[data-valeur="rouge"]');
		await page.waitFor(`document.querySelector('#table .carte').dataset.couleur === 'rouge'`, 'dos rouge');
		const traitsDeco = await page.evaluate<number>(`document.querySelectorAll('#table .dos path').length`);
		await click(page, '#motif-choix button[data-valeur="pixel"]');
		await page.waitFor(`document.querySelector('#table .dos').dataset.motif === 'pixel'`, 'dos pixel art');
		assert.notEqual(await page.evaluate<number>(`document.querySelectorAll('#table .dos path').length`), traitsDeco);

		await click(page, '#defaults-btn');
		await page.waitFor(
			`document.querySelector('#table .carte').dataset.couleur === 'noir' && document.querySelector('#table .dos').dataset.motif === 'deco'`,
			'réglages par défaut',
		);
	});
});

test('langue : l’interface passe en anglais, la prédiction reste la même', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		await toucher(page, HAUT);
		await pressKey(page, 'm');
		await page.waitFor(isMenuOpen, 'menu ouvert');
		await click(page, '#langue-seg button[data-valeur="en"]');
		await page.waitFor(`document.documentElement.lang === 'en'`, 'app en anglais');
		assert.equal(await text(page, '#reset-btn'), 'Reset the card');
		assert.equal(await page.evaluate(PREDICTION), PREDICTIONS.pile);
		assert.equal(await page.evaluate(DEBORDEMENT), null);
	});
});

/* ================= Téléphone tourné ================= */

test('téléphone tourné : le haut du téléphone fait toujours pile, et la carte tient', TEST_TIMEOUT, async () => {
	await withApp({}, async (page) => {
		for (const angle of [90, 270] as const) {
			await turnPhone(page, angle);
			await sleep(200);
			// Téléphone tourné, son haut est sur un côté de l'écran : à gauche pour 90°, à droite pour 270°.
			const haut = { x: angle === 90 ? SCREEN.height * .15 : SCREEN.height * .85, y: SCREEN.width / 2 };
			await toucher(page, haut);
			assert.equal(await page.evaluate(coteEcrit), 'pile', `pile à ${angle}°`);
			assert.equal(await page.evaluate(DEBORDEMENT), null, `débordement à ${angle}°`);
			await sleep(600);
			await doubleToucher(page, haut);
			assert.equal(await page.evaluate(retournee), false, `carte remise à ${angle}°`);
		}
		await turnPhone(page, 0);
	});
});

/* ================= Hors-ligne ================= */

test('hors-ligne : une fois ouverte, l’app redémarre serveur arrêté', TEST_TIMEOUT, async () => {
	const offlineServer = await startStaticServer('dist', 0);
	let closed = false;
	try {
		await withApp({}, async (page) => {
			await page.waitFor(`navigator.serviceWorker.controller`, 'service worker actif', 15_000);
			await offlineServer.close();
			closed = true;
			await page.reload();
			await page.waitFor(PRETE, 'app rechargée hors-ligne', 10_000);
			await toucher(page, BAS);
			assert.equal(await page.evaluate(PREDICTION), PREDICTIONS.face, 'le tour se joue sans réseau');
			assert.equal(await page.evaluate(PIECE), 'face');
		}, offlineServer.url);
	} finally {
		if (!closed) await offlineServer.close();
	}
});
