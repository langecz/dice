import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { GameStore } from '../../services/game.store';
import { GameMode, Player, Team } from '../../models/game.models';
import { Router } from '@angular/router';
import { GameConfigComponent } from './game-config/game-config.component';
import { PlayerOrderingComponent } from './player-ordering/player-ordering.component';

@Component({
  selector: 'app-setup',
  imports: [
    CommonModule,
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
    targetPoints: 10000,
    minPointsPerTurn: 350
  });

  onConfigComplete(data: {
    players: Player[];
    teams: Team[];
    config: { gameMode: GameMode; targetPoints: number; minPointsPerTurn: number };
  }) {
    this.players.set(data.players);
    this.teams.set(data.teams);
    this.config.set(data.config);
    this.isOrdering.set(true);
  }

  backToSetup() {
    this.isOrdering.set(false);
  }

  startGame(orderedPlayers: Player[]) {
    this.store.setupGame({
      gameMode: this.config().gameMode,
      targetPoints: this.config().targetPoints,
      minPointsPerTurn: this.config().minPointsPerTurn,
      players: orderedPlayers,
      teams: this.teams()
    });
    this.router.navigate(['/game']);
  }
}
