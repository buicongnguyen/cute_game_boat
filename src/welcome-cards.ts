/**
 * The welcome cards (FIX-PLAN 4.6): three short cards before a brand-new save's first steps: who you are, what the game
 * is, what to do now. Only on an untouched save (first-run.ts welcomeCardsDue: never on older saves, never on an online
 * account that already played). Skip on every card; skipping, finishing or closing the dialog saves 'cards' as seen
 * (the firstRunSeen action, so the server and other devices agree) and they never show again.
 * Drawn in the game's own dialog shell (openDialog) with the cute look of the other cards; at most two lines of body
 * text each on a phone.
 */
import { t } from './i18n.ts';

export interface WelcomeCard { icon: string; art: string; title: string; body: string; places?: {kind:string;label:string}[]; params?: Record<string, string | number> }
/** The three cards. `touch`: a phone or tablet ("Tap"), else a mouse ("Click"); `planets`: how many planets the starship reaches. */
export function welcomeCards(touch: boolean, planets: number): WelcomeCard[] {
  return [
    { icon: '🏡', art: '🌷🏡🌳', title: "You're the new keeper of Clover Village", body: 'Your cabin is below the hatch. The wooden deck, garden and starship are yours. Welcome aboard!' },
    { icon: '🌍', art: '🥕🐾🚀', title: 'A little world to grow', body: 'Grow food, explore the wilds, befriend pets and fly to {n} planets.', params: { n: planets } },
    { icon: '🧺', art: '🧺⚓🛍️', title: 'Buy and sell on the deck', body: 'Sell your harvest at the market. Visit the outfitters for seeds, clothes and equipment.', places: [{kind:'sell',label:'Market'},{kind:'shop',label:'Outfitters'}] },
    { icon: '🏡', art: '🔨🍳💎', title: 'Your stations are inside the cabin', body: 'Go down through the hatch. Craft at the workbench, cook at the stove, and make wishes at the glowing cabinet.', places: [{kind:'craft',label:'Cabin workbench'},{kind:'cook',label:'Cabin kitchen'},{kind:'upgrade',label:'Wishing cabinet'},{kind:'chest',label:'Storage chest'}] },
    { icon: '🐾', art: '🌿🐄📚', title: 'A garden and friends downstairs', body: 'The kitchen doorway leads to the animal garden. Track missing friends at the trophy wall. Set the Colossus at the study bookshelf.', places: [{kind:'pen',label:'Animal pen'},{kind:'trophies',label:'Trophy wall'},{kind:'books',label:'Bookshelf'}] },
    { icon: '🥕', art: '🌱⏱️🥕', title: 'First, plant a carrot', body: touch ? 'Tap a garden bed to plant. Your first crops grow in 20 seconds!' : 'Click a garden bed to plant. Your first crops grow in 20 seconds!' },
  ];
}

export interface WelcomeCardsHost {
  openDialog(type: string, title: string, body: string, kicker?: string, icon?: string): void;
  closeDialog(): void;
  go?(kind: string): void;
  modal(): string | null;
  /** Saves 'cards' as seen (the firstRunSeen action). */
  seen(): void;
  touch(): boolean;
  planets(): number;
  tone(kind: string): void;
  esc(text: string): string;
}
export const CARDS_DIALOG = 'welcome-cards';

export function initWelcomeCards(h: WelcomeCardsHost) {
  let step = 0, saved = false;
  function render() {
    const cards = welcomeCards(h.touch(), h.planets()), c = cards[step], last = step === cards.length - 1, e = h.esc;
    const dots = cards.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('');
    const body = `<div class="wc-card wc-${step + 1}">
      <div class="wc-art" aria-hidden="true">${c.art}</div>
      <p class="wc-text">${e(t(c.body, c.params))}</p>
      ${c.places ? '<p class="fineprint">'+e(t('Show me'))+'</p><div class="button-row">'+c.places.map(p=>'<button class="soft-button" data-wc="place" data-place="'+p.kind+'">'+e(t(p.label))+'</button>').join('')+'</div>' : ''}
      <div class="wc-dots" role="img" aria-label="${e(t('Card {n} of {total}', { n: step + 1, total: cards.length }))}">${dots}</div>
      <div class="button-row wc-actions"><button class="soft-button wc-skip" data-wc="skip">${e(t('Skip'))}</button><button class="primary wc-next" data-wc="${last ? 'done' : 'next'}">${e(t(last ? "Let's grow!" : 'Next'))}</button></div>
    </div>`;
    h.openDialog(CARDS_DIALOG, c.title, body, t('WELCOME · {n} / {total}', { n: step + 1, total: cards.length }), c.icon);
    if (last) h.tone('quest');
  }
  function save() { if (saved) return; saved = true; h.seen(); }
  document.addEventListener('click', event => {
    const what = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-wc]')?.dataset.wc; if (!what || h.modal() !== CARDS_DIALOG) return;
    event.stopPropagation();
    if (what === 'place') { const kind=(event.target as HTMLElement).closest<HTMLElement>('[data-place]')?.dataset.place; h.closeDialog(); if(kind)h.go?.(kind); return; }
    if (what === 'next') { step = Math.min(step + 1, welcomeCards(h.touch(), h.planets()).length - 1); h.tone('click'); render(); } else h.closeDialog(); // skip and done: closing saves (closed())
  }, true);
  return {
    show() { step = 0; saved = false; render(); },
    /** main.ts closeDialog calls this when the cards' dialog closes, by Skip, the last card, × or Escape. */
    closed() { save(); },
    get open() { return h.modal() === CARDS_DIALOG; },
  };
}
