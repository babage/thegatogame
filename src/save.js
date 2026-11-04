import { mods } from './core.js';
// ---------- Save ----------
const SAVE_KEY = 'gato-save-v1';
const defaultSave = () => ({ bank: 0, owned: ['ginger', 'grey', 'none'], wear: [{ coat: 'ginger', hat: 'none' }, { coat: 'grey', hat: 'none' }], dreams: 0 });
let save = defaultSave();
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) save = Object.assign(defaultSave(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };

const COATS = [
  { id: 'ginger', name: 'Ginger', coat: '#e8955a', belly: '#fbe3c8', cost: 0 },
  { id: 'grey', name: 'Grey', coat: '#8b93a6', belly: '#e6e3ea', cost: 0 },
  { id: 'tuxedo', name: 'Tuxedo', coat: '#2f2a30', belly: '#f4efe8', cost: 4 },
  { id: 'calico', name: 'Calico', coat: '#d9a066', belly: '#fff6ea', cost: 6 },
  { id: 'siamese', name: 'Siamese', coat: '#efe2cc', belly: '#fff8ee', cost: 8 },
  { id: 'midnight', name: 'Midnight', coat: '#23263a', belly: '#454b6b', cost: 10 }
];
const HATS = [
  { id: 'none', name: 'No hat', cost: 0 },
  { id: 'party', name: 'Party hat', cost: 3 },
  { id: 'beanie', name: 'Beanie', cost: 5 },
  { id: 'flower', name: 'Flower crown', cost: 7 },
  { id: 'wizard', name: 'Wizard hat', cost: 9 },
  { id: 'crown', name: 'Little crown', cost: 12 }
];
const BLESSINGS = [
  { id: 'spring', name: 'Spring paws', text: 'Both cats jump a little higher.', apply: () => { mods.jump = 1.06; } },
  { id: 'zoomies', name: 'Zoomies', text: 'Both cats run a quarter faster.', apply: () => { mods.speed = 1.25; } },
  { id: 'magnet', name: 'Yarn magnet', text: 'Yarn rolls to you from three times as far away.', apply: () => { mods.magnet = 3; } },
  { id: 'lucky', name: 'Lucky whiskers', text: 'Every yarn ball counts double.', apply: () => { mods.yarnMul = 2; } }
];

export { SAVE_KEY, defaultSave, save, persist, COATS, HATS, BLESSINGS };
