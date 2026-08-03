import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient()],
    }).compileComponents();
  });

  it('creates the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders both router outlets, primary and modal', () => {
    const fixture = TestBed.createComponent(App);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('router-outlet').length).toBe(2);
  });

  it('is header plus a focusable content track, with no footer', () => {
    const fixture = TestBed.createComponent(App);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('nv-site-header')).not.toBeNull();
    expect(compiled.querySelector('nv-site-footer')).toBeNull();

    const track = compiled.querySelector('main.nv-track');
    expect(track).not.toBeNull();
    expect(track?.getAttribute('tabindex')).toBe('0');
  });

  it('renders the mark in the header as the home link', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const logo = compiled.querySelector<HTMLAnchorElement>('.hdr__logo');
    expect(logo?.getAttribute('href')).toBe('/');
    expect(logo?.querySelector('svg')).not.toBeNull();
    expect(logo?.querySelector('img')).toBeNull();
    expect(compiled.querySelector('.brand__word')).toBeNull();
  });

  it('lays the header out one drum tall, starting at the second column', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.hdr__row')).not.toBeNull();
    expect(compiled.querySelector('.hdr__lang')).not.toBeNull();
  });
});
