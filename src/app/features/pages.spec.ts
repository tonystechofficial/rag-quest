import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { findLevel, LEVELS, levelsForWorld, WORLDS } from '../content/worlds';
import { ProgressService } from '../core/progress.service';
import { BadgesPage } from './badges/badges-page';
import { GlossaryPage } from './glossary/glossary-page';
import { HomePage } from './home/home-page';
import { PlayPage } from './play/play-page';
import { WorldPage } from './world/world-page';

function clear(progress: ProgressService, levelId: string, score = 95): void {
  progress.record(findLevel(levelId)!, { scorePct: score, summary: 'test' }, false);
}

describe('pages', () => {
  let progress: ProgressService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    progress = TestBed.inject(ProgressService);
    progress.reset();
  });

  it('home shows the three wings, the mentor and invites to start the first quest', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.world-card')).toHaveLength(WORLDS.length);
    expect(el.querySelectorAll('.world-card.lock')).toHaveLength(WORLDS.length - 1);
    expect(el.textContent).toContain('Start playing');
    expect(el.textContent).toContain(LEVELS[0].title);
    expect(el.textContent).toContain('Ada');
  });

  it('home offers to continue with the next reachable quest', async () => {
    clear(progress, LEVELS[0].id);
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Continue');
    expect(el.textContent).toContain(LEVELS[1].title);
    expect(el.textContent).toContain('110 /'); // 100 XP + 10 first-try bonus
  });

  it('wing page shows the path with locks, the boss and played quests', async () => {
    const fixture = TestBed.createComponent(WorldPage);
    fixture.componentRef.setInput('worldId', 'data');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const wing = levelsForWorld('data');
    expect(el.querySelectorAll('.level')).toHaveLength(wing.length);
    expect(el.querySelectorAll('.level.lock')).toHaveLength(wing.length - 1);
    expect(el.querySelectorAll('.level.boss')).toHaveLength(1);
    expect(el.textContent).toContain('earn a star in');

    clear(progress, wing[0].id, 70);
    await fixture.whenStable();
    expect(el.querySelectorAll('.level.lock')).toHaveLength(wing.length - 2);
    expect(el.textContent).toContain('Replay');
    expect(el.textContent).toContain('best 70%');
  });

  it('a locked wing explains which boss to beat', async () => {
    const fixture = TestBed.createComponent(WorldPage);
    fixture.componentRef.setInput('worldId', 'nlp');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const dataBoss = levelsForWorld('data').at(-1)!;
    expect(el.textContent).toContain(`Beat ${dataBoss.title}`);
    expect(el.querySelectorAll('.level.lock')).toHaveLength(levelsForWorld('nlp').length);
  });

  it('play page blocks a locked quest and points to the previous one', async () => {
    const fixture = TestBed.createComponent(PlayPage);
    fixture.componentRef.setInput('levelId', LEVELS[1].id);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('One shelf at a time');
    expect(el.textContent).toContain(`Go to ${LEVELS[0].title}`);
    expect(el.querySelector('.card app-mcq-engine, .card app-bucket-sort-engine')).toBeNull();
  });

  it('play page mounts the engine, offers a hint and records the result with bonuses', async () => {
    progress.setFreePlay(true);
    const fixture = TestBed.createComponent(PlayPage);
    fixture.componentRef.setInput('levelId', 'token-counter');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-estimate-engine')).not.toBeNull();
    expect(el.textContent).toContain('Token Counter');
    expect(el.textContent).toContain('Ask Ada');

    fixture.componentInstance.askAda();
    await fixture.whenStable();
    expect(el.textContent).toContain(findLevel('token-counter')!.hint);

    fixture.componentInstance.onCompleted({ scorePct: 92, summary: 'test run', flawless: true });
    await fixture.whenStable();
    expect(el.querySelector('app-result-panel')).not.toBeNull();
    expect(el.textContent).toContain('92%');
    expect(el.textContent).toContain('+110 XP'); // 100 + first try; flawless forfeited by the hint
    expect(el.textContent).toContain('flawless, but hinted');
    expect(el.textContent).toContain('Badge unlocked');
    expect(progress.resultFor('token-counter')?.stars).toBe(3);

    fixture.componentInstance.retry();
    await fixture.whenStable();
    expect(el.querySelector('app-estimate-engine')).not.toBeNull();
  });

  it('beating a boss opens the next wing on the result screen', async () => {
    const wing = levelsForWorld('data');
    for (const level of wing.slice(0, -1)) {
      clear(progress, level.id);
    }
    const fixture = TestBed.createComponent(PlayPage);
    fixture.componentRef.setInput('levelId', wing.at(-1)!.id);
    await fixture.whenStable();
    fixture.componentInstance.onCompleted({ scorePct: 75, summary: 'boss' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Wing opened');
    expect(el.textContent).toContain('The Language Hall');
    expect(progress.isWingOpen('nlp')).toBe(true);
  });

  it('play page explains an unknown quest', async () => {
    const fixture = TestBed.createComponent(PlayPage);
    fixture.componentRef.setInput('levelId', 'does-not-exist');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unknown quest');
  });

  it('badges page lists every badge and locks the certificate until the Oracle is restored', async () => {
    const fixture = TestBed.createComponent(BadgesPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.badge').length).toBeGreaterThan(10);
    expect(el.textContent).toContain('Restore the Oracle');

    progress.setFreePlay(true);
    for (const level of LEVELS) {
      clear(progress, level.id, 60);
    }
    await fixture.whenStable();
    expect(progress.hasBadge('oracle-restored')).toBe(true);
    expect(el.textContent).toContain('speaks true again');
    expect(el.querySelectorAll('.badge.earned').length).toBeGreaterThanOrEqual(2);
  });

  it('glossary filters entries and earns the Bookworm badge', async () => {
    const fixture = TestBed.createComponent(GlossaryPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(progress.hasBadge('bookworm')).toBe(true);
    const before = el.querySelectorAll('.card-soft').length;
    fixture.componentInstance.query.set('cosine');
    await fixture.whenStable();
    const after = el.querySelectorAll('.card-soft').length;
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });
});
