/** A compact welcome on an untouched save, with the boat's longer cabin guide available on request. */
import { t } from './i18n.ts';

export interface WelcomeCard { icon: string; art: string; title: string; body: string; places?: {kind:string;label:string}[]; params?: Record<string, string | number> }
/** The first action, using the input device's verb. The planets argument keeps the host API stable. */
export function welcomeCards(touch: boolean, planets: number): WelcomeCard[] {
  return [
    { icon: '🏡', art: '🌱🏡🥕', title: 'Welcome home!', body: touch ? 'Tap a garden bed to plant your first carrot.' : 'Click a garden bed to plant your first carrot.' },
  ];
}
/** The optional boat tour keeps the cabin station locations and their walking shortcuts. */
export function cabinGuideCards(touch: boolean, planets: number): WelcomeCard[] {
  return [
    { icon: '🏡', art: '🌷🏡🌳', title: "You're the new keeper of Clover Village", body: 'Your cabin is below the hatch. The wooden deck, garden and starship are yours. Welcome aboard!' },
    { icon: '🌍', art: '🥕🐾🚀', title: 'A little world to grow', body: 'Grow food, explore the wilds, befriend pets and fly to {n} planets.', params: { n: planets } },
    { icon: '🧺', art: '🧺⚓🛍️', title: 'Buy and sell inside the cabin', body: 'Sell your harvest at the Exchange box beside the exit. Visit the Magic Mirror in the bedroom for equipment, seeds and new looks.', places: [{kind:'sell',label:'Exchange box'},{kind:'shop',label:'Magic Mirror'}] },
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
  let step = 0, saved = false, cabin = false;
  function render() {
    const cards = cabin ? cabinGuideCards(h.touch(), h.planets()) : welcomeCards(h.touch(), h.planets()), c = cards[step], last = step === cards.length - 1, e = h.esc;
    const dots = cards.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('');
    const body = `<div class="wc-card wc-${step + 1}">
      <div class="wc-art" aria-hidden="true">${c.art}</div>
      <p class="wc-text">${e(t(c.body, c.params))}</p>
      ${c.places ? '<p class="fineprint">'+e(t('Show me'))+'</p><div class="button-row">'+c.places.map(p=>'<button class="soft-button" data-wc="place" data-place="'+p.kind+'">'+e(t(p.label))+'</button>').join('')+'</div>' : ''}
      ${cabin ? `<div class="wc-dots" role="img" aria-label="${e(t('Card {n} of {total}', { n: step + 1, total: cards.length }))}">${dots}</div>` : ''}
      <div class="button-row wc-actions"><button class="soft-button wc-skip" data-wc="skip">${e(t('Skip'))}</button><button class="primary wc-next" data-wc="${last ? 'done' : 'next'}">${e(t(cabin ? last ? "Let's grow!" : 'Next' : 'Play'))}</button></div>
    </div>`;
    h.openDialog(CARDS_DIALOG, c.title, body, cabin ? t('WELCOME · {n} / {total}', { n: step + 1, total: cards.length }) : '', c.icon);
    if (cabin && last) h.tone('quest');
  }
  function save() { if (saved) return; saved = true; h.seen(); }
  document.addEventListener('click', event => {
    const what = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-wc]')?.dataset.wc; if (!what || h.modal() !== CARDS_DIALOG) return;
    event.stopPropagation();
    if (what === 'place') { const kind=(event.target as HTMLElement).closest<HTMLElement>('[data-place]')?.dataset.place; h.closeDialog(); if(kind)h.go?.(kind); return; }
    if (what === 'next' && cabin) { step = Math.min(step + 1, cabinGuideCards(h.touch(), h.planets()).length - 1); h.tone('click'); render(); } else h.closeDialog(); // Play, Skip, × and Escape all save dismissal.
  }, true);
  return {
    show() { step = 0; saved = false; cabin = false; render(); },
    showCabinGuide() { step = 0; saved = false; cabin = true; render(); },
    /** main.ts closeDialog calls this when the cards' dialog closes, by Skip, the last card, × or Escape. */
    closed() { save(); },
    get open() { return h.modal() === CARDS_DIALOG; },
  };
}
