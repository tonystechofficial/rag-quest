import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GLOSSARY } from '../../content/glossary';
import { WORLDS } from '../../content/worlds';
import { ProgressService } from '../../core/progress.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-glossary-page',
  imports: [RouterLink, Icon],
  template: `
    <div class="container page stack">
      <header class="row row-between" style="align-items: flex-end">
        <div>
          <span class="eyebrow">{{ entries.length }} cards</span>
          <h1>Glossary</h1>
          <p style="margin: 0">The vocabulary of the three wings, in plain words.</p>
        </div>
        <input
          type="search"
          placeholder="Search a term…"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
          style="max-width: 320px"
          aria-label="Search the glossary"
        />
      </header>

      @for (world of worlds; track world.id) {
        @let items = entriesFor(world.id);
        @if (items.length) {
          <section class="stack-sm">
            <div class="row" style="gap: 10px">
              <span class="pill pill-{{ world.id }}"
                ><app-icon [name]="world.icon" /> {{ world.wing }}</span
              >
              <a class="small" [routerLink]="['/world', world.id]">open this drawer</a>
            </div>
            <div class="grid grid-2">
              @for (entry of items; track entry.term) {
                <div class="card-soft">
                  <strong class="label" style="color: var(--ink); font-size: 0.95rem">{{
                    entry.term
                  }}</strong>
                  <p class="small" style="margin: 4px 0 0">{{ entry.definition }}</p>
                </div>
              }
            </div>
          </section>
        }
      }
      @if (filtered().length === 0) {
        <p class="muted typed">No card matches “{{ query() }}”.</p>
      }
    </div>
  `,
})
export class GlossaryPage {
  protected readonly worlds = WORLDS;
  protected readonly entries = GLOSSARY;
  readonly query = signal('');

  private readonly progress = inject(ProgressService);

  readonly filtered = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (!needle) return this.entries;
    return this.entries.filter(
      (entry) =>
        entry.term.toLowerCase().includes(needle) ||
        entry.definition.toLowerCase().includes(needle),
    );
  });

  constructor() {
    this.progress.markGlossaryOpened();
  }

  entriesFor(worldId: string) {
    return this.filtered().filter((entry) => entry.world === worldId);
  }
}
