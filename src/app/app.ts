import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HorizontalScroll } from './layout/horizontal-scroll/horizontal-scroll';
import { SiteHeader } from './layout/site-header/site-header';

@Component({
  selector: 'nv-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, HorizontalScroll],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
