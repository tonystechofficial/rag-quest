import { Component, computed, input } from '@angular/core';
import { Token, tokenize } from '../core/domain/tokenizer';

@Component({
  selector: 'app-token-chips',
  template: `
    <div class="row" style="gap: 6px">
      @for (token of tokens(); track $index) {
        <span class="token token-{{ token.kind }}" [title]="token.kind">
          {{ display(token) }}
          @if (token.cost > 1) {
            <span class="cost">×{{ token.cost }}</span>
          }
        </span>
      }
    </div>
    <div class="row small faint" style="gap: 10px; margin-top: 10px">
      <span><span class="swatch token-word"></span> word</span>
      <span><span class="swatch token-subword"></span> sub-word piece</span>
      <span><span class="swatch token-number"></span> digits</span>
      <span><span class="swatch token-symbol"></span> symbol / emoji</span>
      <span>␣ = leading space glued to the token</span>
    </div>
  `,
  styles: `
    .swatch {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 3px;
      border: 1px solid;
      vertical-align: middle;
      margin-right: 2px;
    }
  `,
})
export class TokenChips {
  readonly text = input.required<string>();
  readonly tokens = computed(() => tokenize(this.text()));

  display(token: Token): string {
    if (token.kind === 'space') {
      return token.text.replace(/\n/g, '⏎').replace(/ /g, '⎵').replace(/\t/g, '⇥');
    }
    return token.text.startsWith(' ') ? '␣' + token.text.slice(1) : token.text;
  }
}
