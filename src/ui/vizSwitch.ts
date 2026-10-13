import { t } from '../i18n/i18n';
import type { Settings } from '../state/settings';
import type { Store } from '../state/store';
import { byId } from './dom';

type VizTab = 'circular' | 'linear' | 'poly';

/** The three top-right tabs. Circle and Line choose how the standard beat is drawn; Poly is the
 *  polyrhythm mode (the same switch as the Signature dialog's), which only has a circular view. */
export function mountVizSwitch({ store }: { store: Store<Settings> }): void {
  const stage = byId('stage');
  const selector = document.querySelector<HTMLElement>('.seg');
  if (!selector) throw new Error('Missing visualizer selector.');
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.seg-btn[data-viz]'));

  const select = (tab: VizTab) => {
    const polyrhythm = store.get().polyrhythm;
    if (tab === 'poly') {
      store.set({ polyrhythm: { ...polyrhythm, enabled: true } });
    } else {
      // Leaving polyrhythm for a view also sets that view, so Line is reachable in one tap.
      store.set({ visualizer: tab, polyrhythm: { ...polyrhythm, enabled: false } });
    }
  };
  for (const button of buttons) {
    button.addEventListener('click', () => select(button.dataset.viz as VizTab));
  }

  const render = (s: Settings) => {
    const poly = s.polyrhythm.enabled;
    // Polyrhythm only has a circular view. The saved Circle/Line choice is left alone, so
    // turning polyrhythm off brings Line back if it was picked.
    stage.dataset.viz = poly ? 'circular' : s.visualizer;
    const current: VizTab = poly ? 'poly' : s.visualizer;
    selector.classList.toggle('is-polyrhythm', poly);
    selector.setAttribute('aria-label', t('viz.ariaLabel'));
    for (const button of buttons) {
      button.setAttribute('aria-checked', String(button.dataset.viz === current));
    }
  };
  render(store.get());
  store.subscribe(render);
}
