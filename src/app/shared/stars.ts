import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stars',
  template: `
    <span class="stars" [attr.aria-label]="count() + ' out of 3 stars'">
      @for (i of [1, 2, 3]; track i) {
        <span [class.off]="i > count()">★</span>
      }
    </span>
  `,
})
export class Stars {
  readonly count = input.required<number>();
}
