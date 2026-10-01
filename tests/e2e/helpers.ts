// Outils communs aux tests dans Chrome : ouverture de l'app, gestes, clavier, attentes.
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { SCREEN, type Browser, type Page, type Point } from '../../src/kit/node/chrome.ts';

/** Clé d'enregistrement des réglages (src/settings/store.ts). La carte, elle, n'est pas enregistrée. */
export const SETTINGS_KEY = 'pile-ou-face:settings:v1';

export const TEST_TIMEOUT = { timeout: 60_000 };

/** Dans la moitié du haut de l'écran : pile. */
export const HAUT: Point = { x: SCREEN.width / 2, y: SCREEN.height * .2 };
/** Dans la moitié du bas : face. */
export const BAS: Point = { x: SCREEN.width / 2, y: SCREEN.height * .8 };
/** Le centre de l'écran, sur la carte. */
export const CENTER: Point = { x: SCREEN.width / 2, y: SCREEN.height / 2 };

/** Langue du « téléphone » de test (voir setPhoneLang) : l'app la suit tant qu'aucune n'a été choisie. */
export const PHONE_LANG = 'fr-FR,fr';

/** Le temps que la carte finisse de se retourner : la transition de styles/_cartes.scss, et de la marge. */
export const ANIM_MS = 800;

/**
 * Règle la langue du navigateur de la page (navigator.languages), d'où l'app tire sa langue de
 * départ (logic/i18n.ts). Fixée ici plutôt qu'au lancement de Chrome : l'option `--lang` ne fait
 * rien sous Linux (la CI), où Chrome suit la locale du système.
 */
export async function setPhoneLang(page: Page, languages: string): Promise<void> {
	const agent = await page.evaluate<string>('navigator.userAgent');
	await page.send('Emulation.setUserAgentOverride', { userAgent: agent, acceptLanguage: languages });
}

/** La carte est construite, et la police manuscrite chargée : l'app est prête à jouer. */
export const PRETE = `Boolean(document.querySelector('#table .carte .dos > svg.dos-motif')) && document.fonts.check('600 38px Caveat')`;

/**
 * Ouvre l'app à `url` dans un nouvel onglet, téléphone en français (PHONE_LANG) et `storage` déjà
 * enregistré (clé → valeur brute, dans localStorage), attend la carte, lance `run`, puis vérifie
 * qu'aucune erreur JavaScript n'a eu lieu.
 */
export async function openApp(browser: Browser, url: string, storage: Record<string, string>, run: (page: Page) => Promise<void>): Promise<void> {
	const page = await browser.newPage();
	try {
		await setPhoneLang(page, PHONE_LANG);
		await page.goto(url);
		const setup = Object.entries(storage).map(([key, value]) => `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`).join('');
		await page.evaluate(`localStorage.clear(); sessionStorage.clear(); ${setup}`);
		await page.reload();
		await page.waitFor(PRETE, 'carte construite');
		await run(page);
		assert.deepEqual(page.errors, [], 'erreurs JavaScript dans la page');
	} finally {
		await page.close();
	}
}

/** La carte est-elle retournée ? */
export const retournee = `document.querySelector('#table .carte').classList.contains('retournee')`;
/** Le côté écrit au dos de la carte (« pile », « face »), ou null s'il n'y en a pas encore. */
export const coteEcrit = `document.querySelector('#table .carte').dataset.cote ?? null`;
/** La prédiction écrite, retours à la ligne compris (les `<br>` deviennent des « \n »). */
export const PREDICTION = `(() => { const p = document.querySelector('#table .prediction'); return p ? p.innerText.replace(/\\n+/g, '\\n').trim() : null; })()`;
/** Le côté de la pièce dessinée sous la prédiction. */
export const PIECE = `document.querySelector('#table .ecriture svg.piece')?.dataset.cote ?? null`;

export const isMenuOpen = `!document.querySelector('#menu').hidden`;

export const click = (page: Page, selector: string): Promise<unknown> => page.evaluate(`document.querySelector('${selector}').click()`);
export const text = (page: Page, selector: string): Promise<string> => page.evaluate(`document.querySelector('${selector}').textContent`);

/** Un toucher du doigt, puis le temps que la carte finisse son mouvement. */
export async function toucher(page: Page, point: Point): Promise<void> {
	await page.tap(point);
	await sleep(ANIM_MS);
}

/** Deux touchers rapprochés, sous le délai du double toucher (logic/gestures.ts). */
export async function doubleToucher(page: Page, point: Point = CENTER): Promise<void> {
	await page.doubleTap(point);
	await sleep(ANIM_MS);
}

/**
 * Appui long sur l'écran : ouvre le menu au bout de 3 s (GESTURE.holdMs). Rend la main une fois
 * passé le court instant pendant lequel le menu ignore les clics — le doigt qui se relève ne doit
 * pas « cliquer » sur le bouton apparu dessous (settings/panel.ts, CLICK_GUARD_MS).
 */
export async function appuiLong(page: Page, point: Point = CENTER): Promise<void> {
	await page.touchStart(point);
	await sleep(3400);
	await page.touchEnd();
	await sleep(500);
}

/** Touche du clavier (ou d'une télécommande), avec d'éventuels modificateurs (1 Alt, 2 Ctrl, 4 Cmd, 8 Maj). */
export async function pressKey(page: Page, key: string, modifiers = 0): Promise<void> {
	await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key, modifiers });
	await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, modifiers });
}

/** Téléphone tourné : vers la gauche (angle 90), vers la droite (angle 270), ou droit (0). */
export async function turnPhone(page: Page, angle: 0 | 90 | 270): Promise<void> {
	const landscape = angle !== 0;
	await page.send('Emulation.setDeviceMetricsOverride', {
		width: landscape ? SCREEN.height : SCREEN.width,
		height: landscape ? SCREEN.width : SCREEN.height,
		deviceScaleFactor: 3,
		mobile: true,
		screenOrientation: { type: angle === 0 ? 'portraitPrimary' : angle === 90 ? 'landscapePrimary' : 'landscapeSecondary', angle },
	});
	await page.waitFor(`document.querySelector('#app').dataset.rotation === '${angle === 0 ? 0 : angle === 90 ? -90 : 90}'`, `rotation pour l'angle ${angle}`, 3000);
}

/**
 * Le bloc écrit (prédiction, soulignement et pièce) sort-il de la carte ? Mesuré comme
 * l'ajustement le fait (stage/carte.ts). Renvoie null si tout tient.
 */
export const DEBORDEMENT = `(() => {
	const avant = document.querySelector('#table .avant');
	const ecriture = document.querySelector('#table .ecriture');
	const style = getComputedStyle(avant);
	const place = [
		avant.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
		avant.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
	];
	const pris = [ecriture.offsetWidth, ecriture.offsetHeight];
	return pris[0] > place[0] + 1 || pris[1] > place[1] + 1 ? { pris, place } : null;
})()`;
