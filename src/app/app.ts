import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cursor } from './layout/cursor/cursor';
import { GridBackdrop } from './layout/grid-backdrop/grid-backdrop';
import { HorizontalScroll } from './layout/horizontal-scroll/horizontal-scroll';
import { MouseGlow } from './layout/mouse-glow/mouse-glow';
import { ScrollOverlay } from './layout/scroll-overlay/scroll-overlay';
import { SiteHeader } from './layout/site-header/site-header';

@Component({
  selector: 'nv-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SiteHeader,
    HorizontalScroll,
    GridBackdrop,
    MouseGlow,
    Cursor,
    ScrollOverlay,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
