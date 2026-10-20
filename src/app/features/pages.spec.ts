import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { LEVELS, WORLDS, levelsForWorld } from '../content/worlds';
import { ProgressService } from '../core/progress.service';
import { GlossaryPage } from './glossary/glossary-page';
import { HomePage } from './home/home-page';
import { PlayPage } from './play/play-page';
import { WorldPage } from './world/world-page';

describe('pages', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    TestBed.inject(ProgressService).reset();
  });

  it('home shows the three worlds and invites to start', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.world-card')).toHaveLength(WORLDS.length);
    expect(el.textContent).toContain('Start playing');
    expect(el.textContent).toContain(LEVELS[0].title);
  });

  it('home offers to continue with the first unfinished level', async () => {
    TestBed.inject(ProgressService).record(LEVELS[0].id, 95, 100);
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Continue');
    expect(el.textContent).toContain(LEVELS[1].title);
    expect(el.textContent).toContain('100 /');
  });

  it('world page lists the levels of the world with their stars', async () => {
    TestBed.inject(ProgressService).record('pipeline-builder', 70, 100);
    const fixture = TestBed.createComponent(WorldPage);
    fixture.componentRef.setInput('worldId', 'rag');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.level')).toHaveLength(levelsForWorld('rag').length);
    expect(el.textContent).toContain('Replay');
    expect(el.textContent).toContain('best 70%');
  });

  it('play page mounts the engine matching the level and records the result', async () => {
    const fixture = TestBed.createComponent(PlayPage);
    fixture.componentRef.setInput('levelId', 'token-counter');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-estimate-engine')).not.toBeNull();
    expect(el.textContent).toContain('Token Counter');

    fixture.componentInstance.onCompleted({ scorePct: 92, summary: 'test run' });
    await fixture.whenStable();
    expect(el.querySelector('app-result-panel')).not.toBeNull();
    expect(el.textContent).toContain('92%');
    expect(el.textContent).toContain('+100 XP');
    expect(TestBed.inject(ProgressService).resultFor('token-counter')?.stars).toBe(3);

    fixture.componentInstance.retry();
    await fixture.whenStable();
    expect(el.querySelector('app-estimate-engine')).not.toBeNull();
  });

  it('play page explains an unknown level', async () => {
    const fixture = TestBed.createComponent(PlayPage);
    fixture.componentRef.setInput('levelId', 'does-not-exist');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unknown challenge');
  });

  it('glossary filters entries by text', async () => {
    const fixture = TestBed.createComponent(GlossaryPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const before = el.querySelectorAll('.card-soft').length;
    fixture.componentInstance.query.set('cosine');
    await fixture.whenStable();
    const after = el.querySelectorAll('.card-soft').length;
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });
});
