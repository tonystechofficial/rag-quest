import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** A small stroke icon set drawn inline, so the catalogue never falls back to emoji. */
const PATHS: Record<string, string> = {
  archive:
    '<rect x="3" y="4" width="18" height="4" rx="0.5"/><path d="M5 8v11.5a0.5 0.5 0 0 0 0.5 0.5h13a0.5 0.5 0 0 0 0.5-0.5V8"/><path d="M10 12h4"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  crown: '<path d="M3 18h18L19 7l-5 4-2-6-2 6-5-4z"/><line x1="4" y1="21" x2="20" y2="21"/>',
  flame:
    '<path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.1-1.8-5-3.1-6.9-.9 1.5-1.9 2.4-2.9 2.6.1-3.1-1-5.9-3.2-8.1C8.9 6.9 5 9.1 5 15.4 5 19.1 7.6 22 12 22z"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 2h12l-2.5 7.5"/>',
  check: '<polyline points="4 12 10 18 20 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  star: '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/>',
  map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
  drawer:
    '<rect x="3" y="4" width="18" height="16" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="10" y1="16" x2="14" y2="16"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="1"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="6" y1="13" x2="18" y2="13"/><line x1="6" y1="16" x2="14" y2="16"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
};

@Component({
  selector: 'app-icon',
  template: `
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [innerHTML]="svg()"
    ></svg>
  `,
})
export class Icon {
  readonly name = input.required<string>();
  private readonly sanitizer = inject(DomSanitizer);
  /** The markup is a compile-time constant of this file, never user input, so bypassing sanitization is safe. */
  readonly svg = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(PATHS[this.name()] ?? PATHS['card']),
  );
}

export const ICON_NAMES = Object.keys(PATHS);
