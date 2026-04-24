import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { GameStore } from '../../services/game.store';
import { GameMode, Player, Team } from '../../models/game.models';
import { Router } from '@angular/router';
import { GameConfigComponent } from './game-config/game-config.component';
import { PlayerOrderingComponent } from './player-ordering/player-ordering.component';
import { DEFAULT_MIN_POINTS_PER_TURN, DEFAULT_TARGET_POINTS } from '../../constants/game.constants';
import { GameConfig } from '../../models/config.model';

@Component({
  selector: 'app-setup',
  imports: [
    MatCardModule,
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
}
