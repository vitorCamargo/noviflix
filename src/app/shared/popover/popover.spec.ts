import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Popover } from './popover';

@Component({
  imports: [Popover],
  template: `
    <nv-popover label="About">
      <p class="content">Panel body</p>
    </nv-popover>
  `,
})
class Host {}

describe('Popover', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      trigger: (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      ) as HTMLButtonElement,
    };
  }

  it('starts closed', async () => {
    const { el, trigger } = await setup();
    expect(el.querySelector('.content')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on trigger click and exposes it to assistive tech', async () => {
    const { fixture, el, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();

    expect(el.querySelector('.content')?.textContent).toBe('Panel body');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const panel = el.querySelector('[role="dialog"]');
    expect(panel?.getAttribute('aria-label')).toBe('About');
  });

  it('closes again on a second click', async () => {
    const { fixture, el, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();
    trigger.click();
    await fixture.whenStable();

    expect(el.querySelector('.content')).toBeNull();
  });

  it('closes when the document is clicked outside it', async () => {
    const { fixture, el, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();

    document.body.click();
    await fixture.whenStable();

    expect(el.querySelector('.content')).toBeNull();
  });

  it('closes on Escape', async () => {
    const { fixture, el, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(el.querySelector('.content')).toBeNull();
  });
});
