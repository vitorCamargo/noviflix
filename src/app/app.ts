import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BootScreen } from './layout/boot/boot';
import { Cursor } from './layout/cursor/cursor';
import { HorizontalScroll } from './layout/horizontal-scroll/horizontal-scroll';
import { MouseGlow } from './layout/mouse-glow/mouse-glow';
import { ScrollHint } from './layout/scroll-hint/scroll-hint';
import { ScrollTop } from './layout/scroll-top/scroll-top';
import { CollectionDialog } from './features/collections/collection-dialog/collection-dialog';
import { CollectionPicker } from './features/collections/collection-picker/collection-picker';
import { CollectionCreateDialog } from './features/collections/collection-create-dialog/collection-create-dialog';
import { ToastStack } from './shared/toast/toast';
import { SelectionBar } from './features/collections/selection-bar/selection-bar';
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
    BootScreen,
    ScrollOverlay,
    ScrollHint,
    ScrollTop,
    CollectionDialog,
    CollectionPicker,
    CollectionCreateDialog,
    ToastStack,
    SelectionBar,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
