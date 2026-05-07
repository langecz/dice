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
import {
  ResetGameConfirmDialogComponent,
  ResetGameConfirmDialogData, ResetGameConfirmDialogResult
} from '../shared/reset-game-confirm-dialog/reset-game-confirm-dialog.component';

type buttonAction = 'reset' | 'new-game' | 'manage-players' | 'view-log' | 'game' | 'ordering';

interface ButtonConfig {
  label: string;
  action: buttonAction;
  class?: string;
}

interface PhaseConfig {
  title: string;
  actionButtons?: ButtonConfig[];
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  setup: { title: 'Game Setup', actionButtons: [{ label: 'Reset', action: 'reset',  class: 'btn-warn'}]},
  ordering: { title: 'Player Ordering', actionButtons: [{ label: 'Manage Players', action: 'manage-players' }] },
  management: { title: 'Player Management' , actionButtons: [{ label: 'Back', action: 'ordering', class: 'btn-warn' }] },
  game: { title: 'Dice Game', actionButtons: [{ label: 'Log', action: 'view-log' }, { label: 'New Game', action: 'new-game', class: 'btn-warn' }] },
  history: { title: 'Game History', actionButtons: [{ label: 'Back', action: 'game' }]}
};

const DEFAULT_PHASE: PhaseConfig = PHASE_CONFIG['setup'];

@Component({
  selector: 'dice-main-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterOutlet],
  templateUrl: './main-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private readonly router = inject(Router);
  private readonly store = inject(GameStore);
  private readonly dialogService = inject(DialogService);

  // private readonly currentPage = signal<PAGE>('setup');

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

  onAction(action: buttonAction): void {

    switch(action) {
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
      case 'view-log': {
        void this.router.navigate(['/history']);
        break;
      }
      case 'game': {
        void this.router.navigate(['/game']);
        break;
      }
      case 'ordering': {
        void this.router.navigate(['/ordering']);
        break;
      }
    }
  }

  private confirmReset(): void {
    const dialogRef = this.dialogService.open<
      ResetGameConfirmDialogComponent,
      ResetGameConfirmDialogData,
      ResetGameConfirmDialogResult
    >(ResetGameConfirmDialogComponent, {
      data: {
        hasGameHistory: this.store.gameHistory().length > 0,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      void this.handleResetDialogResult(result);
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

  private async handleResetDialogResult(
    result: ResetGameConfirmDialogResult | undefined,
  ): Promise<void> {
    if (result === 'reset') {
      this.store.resetGame(false);
      void this.router.navigate(['/setup']);
    }
  }
}
