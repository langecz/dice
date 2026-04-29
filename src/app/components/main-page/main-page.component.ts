import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { GameStore } from '../../services/game.store';
import { DialogService } from '../../services/dialog.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/confirm-dialog/confirm-dialog.component';

interface PhaseConfig {
  title: string;
  buttonLabel: string;
  buttonAction: 'reset' | 'new-game' | 'manage-players';
  buttonClass?: string;
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  setup: { title: 'Game Setup', buttonLabel: 'Reset', buttonAction: 'reset',  buttonClass: 'btn-warn'},
  ordering: { title: 'Player Ordering', buttonLabel: 'Manage Players', buttonAction: 'manage-players' },
  management: { title: 'Player Management', buttonLabel: 'Reset', buttonAction: 'reset', buttonClass: 'btn-warn' },
  game: { title: 'Dice Game', buttonLabel: 'New Game', buttonAction: 'new-game', buttonClass: 'btn-primary' },
};

const DEFAULT_PHASE: PhaseConfig = PHASE_CONFIG['setup'];

@Component({
  selector: 'app-main-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterOutlet],
  templateUrl: './main-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private readonly router = inject(Router);
  private readonly store = inject(GameStore);
  private readonly dialogService = inject(DialogService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly phase = computed<PhaseConfig>(() => {
    const url = this.currentUrl() ?? '';
    const segment = url.split('?')[0].split('/').filter(Boolean)[0];
    return PHASE_CONFIG[segment] ?? DEFAULT_PHASE;
  });

  onAction(): void {

    switch(this.phase().buttonAction) {
      case 'reset': {
        this.confirmReset();
        break;
      }
      case 'new-game': {
        this.confirmNewGame();
        break;
      }
      case 'manage-players': {
        void this.router.navigate(['/management']);
        break;
      }
    }
  }

  private confirmReset(): void {
    const dialogRef = this.dialogService.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: 'Reset Game',
        message:
          'Are you sure you want to reset everything to the initial state? All current setup will be lost.',
        confirmText: 'Reset',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.resetGame(false);
        void this.router.navigate(['/setup']);
      }
    });
  }

  private confirmNewGame(): void {
    const dialogRef = this.dialogService.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: 'New Game',
        message:
          'Start a new game? You can keep the current players or start completely fresh from setup.',
        confirmText: 'New Game',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.resetGame(true);
        void this.router.navigate(['/ordering']);
      }
    });
  }
}
