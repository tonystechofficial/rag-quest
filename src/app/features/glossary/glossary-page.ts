import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GLOSSARY } from '../../content/glossary';
import { WORLDS } from '../../content/worlds';

@Component({
  selector: 'app-glossary-page',
  imports: [RouterLink],
  template: `
    <div class="container page stack">
      <header class="row row-between" style="align-items: flex-end">
        <div>
          <span class="eyebrow">{{ entries.length }} terms</span>
          <h1>Glossary</h1>
          <p class="muted" style="margin: 0">The vocabulary of the three worlds, in plain words.</p>
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
              <span class="pill pill-{{ world.id }}">{{ world.icon }} {{ world.name }}</span>
              <a class="small" [routerLink]="['/world', world.id]">play this world →</a>
            </div>
            <div class="grid grid-2">
              @for (entry of items; track entry.term) {
                <div class="card-soft">
                  <strong>{{ entry.term }}</strong>
                  <p class="small muted" style="margin: 4px 0 0">{{ entry.definition }}</p>
                </div>
              }
            </div>
          </section>
        }
      }
      @if (filtered().length === 0) {
        <p class="muted">No term matches “{{ query() }}”.</p>
      }
    </div>
  `,
})
export class GlossaryPage {
  protected readonly worlds = WORLDS;
  protected readonly entries = GLOSSARY;
  readonly query = signal('');

  readonly filtered = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (!needle) return this.entries;
    return this.entries.filter(
      (entry) =>
        entry.term.toLowerCase().includes(needle) ||
        entry.definition.toLowerCase().includes(needle),
    );
  });

  entriesFor(worldId: string) {
    return this.filtered().filter((entry) => entry.world === worldId);
  }
}
