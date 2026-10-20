import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
    title: 'RAG Quest — learn Data, NLP & RAG by playing',
  },
  {
    path: 'world/:worldId',
    loadComponent: () => import('./features/world/world-page').then((m) => m.WorldPage),
    title: 'Wing · RAG Quest',
  },
  {
    path: 'play/:levelId',
    loadComponent: () => import('./features/play/play-page').then((m) => m.PlayPage),
    title: 'Quest · RAG Quest',
  },
  {
    path: 'badges',
    loadComponent: () => import('./features/badges/badges-page').then((m) => m.BadgesPage),
    title: 'Badges · RAG Quest',
  },
  {
    path: 'glossary',
    loadComponent: () => import('./features/glossary/glossary-page').then((m) => m.GlossaryPage),
    title: 'Glossary · RAG Quest',
  },
  { path: '**', redirectTo: '' },
];
