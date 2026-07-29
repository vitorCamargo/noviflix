import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayPanel } from './overlay-panel';

@Component({
  imports: [OverlayPanel],
  template: `
    <nv-overlay-panel
      ariaLabel="Top movies"
      closeLabel="Close"
      (closed)="closes.set(closes() + 1)"
    >
      <div nvPanelToolbar class="toolbar">Toolbar</div>
      <div nvPanelFilters class="filters">Filters</div>
      <div nvPanelAside class="aside">Aside</div>
      <div nvPanelBody class="body">Body</div>
    </nv-overlay-panel>
  `,
})
class Host {
  readonly closes = signal(0);
}

describe('OverlayPanel', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => {
    document.body.classList.remove('nv-modal-open');
  });

  it('projects all four slots', async () => {
    const { el } = await setup();
    expect(el.querySelector('.panel__bar-start .toolbar')).not.toBeNull();
    expect(el.querySelector('.panel__bar-end .filters')).not.toBeNull();
    expect(el.querySelector('.panel__aside .aside')).not.toBeNull();
    expect(el.querySelector('.panel__body .body')).not.toBeNull();
  });

  it('is announced as a modal dialog', async () => {
    const { el } = await setup();
    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBe('Top movies');
  });

  it('locks page scroll while open and releases it on destroy', async () => {
    const { fixture } = await setup();
    expect(document.body.classList.contains('nv-modal-open')).toBe(true);

    fixture.destroy();
    expect(document.body.classList.contains('nv-modal-open')).toBe(false);
  });

  it('emits closed from the close button, the scrim and Escape', async () => {
    const { fixture, el } = await setup();
    const host = fixture.componentInstance;

    el.querySelector<HTMLButtonElement>('.panel__close')!.click();
    await fixture.whenStable();
    expect(host.closes()).toBe(1);

    el.querySelector<HTMLElement>('.scrim')!.click();
    await fixture.whenStable();
    expect(host.closes()).toBe(2);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(host.closes()).toBe(3);
  });
});
