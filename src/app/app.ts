import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cursor } from './layout/cursor/cursor';
import { HorizontalScroll } from './layout/horizontal-scroll/horizontal-scroll';
import { MouseGlow } from './layout/mouse-glow/mouse-glow';
import { ScrollHint } from './layout/scroll-hint/scroll-hint';
import { ScrollOverlay } from './layout/scroll-overlay/scroll-overlay';
import { SiteHeader } from './layout/site-header/site-header';

@Component({
  selector: 'nv-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SiteHeader,
    HorizontalScroll,
    MouseGlow,
    Cursor,
    ScrollOverlay,
    ScrollHint,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
