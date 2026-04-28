import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameStore } from '../../services/game.store';
import { GameMode, Player, Team } from '../../models/game.models';
import { Router } from '@angular/router';
import { GameConfigComponent } from './game-config/game-config.component';
import { PlayerOrderingComponent } from './player-ordering/player-ordering.component';
import { DEFAULT_MIN_POINTS_PER_TURN, DEFAULT_TARGET_POINTS } from '../../constants/game.constants';
import { GameConfig } from '../../models/config.model';
import { DialogService } from '../../services/dialog.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-setup',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    GameConfigComponent,
    PlayerOrderingComponent
  ],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupComponent {
  private store = inject(GameStore);
  private router = inject(Router);
  private dialogService = inject(DialogService);

  isOrdering = signal(false);

  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);
  config = signal({
    gameMode: 'individual' as GameMode,
    targetPoints: DEFAULT_TARGET_POINTS,
    minPointsPerTurn: DEFAULT_MIN_POINTS_PER_TURN
  });

  onConfigComplete(data: {
    players: Player[];
    teams: Team[];
    config: GameConfig;
  }): void {
    this.players.set(data.players);
    this.teams.set(data.teams);
    this.config.set(data.config);
    this.isOrdering.set(true);
  }

  backToSetup(): void {
    this.isOrdering.set(false);
  }

  startGame(orderedPlayers: Player[]): void {
    this.store.setupGame({
      gameMode: this.config().gameMode,
      targetPoints: this.config().targetPoints,
      minPointsPerTurn: this.config().minPointsPerTurn,
      players: orderedPlayers,
      teams: this.teams()
    });
    void this.router.navigate(['/game']);
  }

  confirmReset(): void {
    const dialogRef = this.dialogService.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Reset Game',
          message: 'Are you sure you want to reset everything to the initial state? All current setup will be lost.',
          confirmText: 'Reset',
          cancelText: 'Cancel',
        },
      }
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.resetGame(false);
        this.isOrdering.set(false);
      }
    });
  }
}
