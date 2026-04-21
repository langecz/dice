import {
  Component,
  inject,
  computed,
  ViewChild,
  TemplateRef,
  ChangeDetectionStrategy,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameStore } from '../../services/game.store';
import { Router } from '@angular/router';
import { Player, Winner } from '../../models/game.models';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  store = inject(GameStore);
  router = inject(Router);
  dialog = inject(MatDialog);

  state = this.store.state;
  players = this.store.players;
  teams = this.store.teams;
  gameMode = this.store.gameMode;
  isGameOver = this.store.isGameOver;
  currentPlayer = this.store.currentPlayer;
  currentTeam = this.store.currentTeam;
  minPointsPerTurn = computed(() => this.state().minPointsPerTurn);
  lastRoundStarted = computed(() => this.state().lastRoundStarted);

  winner: Signal<Winner | null> = computed(() => {
    const s = this.state();
    if (!s.winnerId) return null;
    if (s.winnerType === 'player') {
      const winner = s.players.find(p => p.id === s.winnerId);
      return winner ? this.getWinnerInfo(winner) : null;
    } else {
      const winner = s.teams.find(p => p.id === s.winnerId);
      return winner ? this.getWinnerInfo(winner) : null;
    }
  });

  rankedResults = computed(() => {
    const s = this.state();
    if (!s.isGameOver) return [];

    if (s.gameMode === 'individual') {
      return [...s.players]
        .filter(p => p.id !== s.winnerId)
        .sort((a, b) => b.score - a.score);
    } else {
      return [...s.teams]
        .filter(t => t.id !== s.winnerId)
        .sort((a, b) => b.score - a.score);
    }
  });

  submitPoints(input: HTMLInputElement) {
    const points = input.valueAsNumber;
    if (isNaN(points)) return;

    const gameState = this.state();
    if (points < gameState.minPointsPerTurn) return;

    this.store.addPoints(points);
    input.value = '';
    input.focus();
  }

  setZeroPoints(input: HTMLInputElement) {
    this.store.addPoints(0);
    input.value = '';
    input.focus();
  }

  getPlayer(id: string): Player | undefined {
    return this.players().find(p => p.id === id);
  }

  @ViewChild('newGameDialog') newGameDialogTemplate!: TemplateRef<any>;

  onNewGame() {
    this.dialog.open(this.newGameDialogTemplate);
  }

  resetGame(keepPlayers: boolean) {
    this.store.resetGame(keepPlayers);
    this.dialog.closeAll();
    if (!keepPlayers) {
      void this.router.navigate(['/setup']);
    }
  }

  private getWinnerInfo(winner: {name: string, score: number}): Winner {
    return { name: winner.name, score: winner.score };
  }
}
