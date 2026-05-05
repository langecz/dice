import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
  Signal,
  viewChild,
  signal,
  ElementRef,
  WritableSignal,
  afterNextRender,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { GameStore } from '../../services/game.store';
import { Player } from '../../models/game.models';
import { toSignalMap } from '../../utils/signal-map';

interface Winner {
  name: string;
  score: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  store = inject(GameStore);

  state = this.store.state;
  players = this.store.players;
  teams = this.store.teams;
  gameMode = this.store.gameMode;
  isGameOver = this.store.isGameOver;
  currentPlayer = this.store.currentPlayer;
  currentTeam = this.store.currentTeam;
  minPointsPerTurn = computed(() => this.state().minPointsPerTurn);
  lastRoundStarted = computed(() => this.state().lastRoundStarted);

  // inputPointsElement: Signal<ElementRef<HTMLInputElement>> = viewChild.required<ElementRef<HTMLInputElement>>('inputPointsElement');
  inputPointsElement: Signal<ElementRef<HTMLInputElement> | undefined> = viewChild<ElementRef<HTMLInputElement>>('inputPointsElement');
  inputPoints: WritableSignal<number | null> = signal<number | null>(null);

  canRecord: Signal<boolean> = computed(() => {
    const points = this.inputPoints();
    if (points === null || isNaN(points)) return false;
    if (points === 0) return true;
    return points >= this.minPointsPerTurn();
  });

  winner: Signal<Winner | null> = computed(() => {
    const gameState = this.state();
    if (!gameState.winnerId) return null;
    if (gameState.winnerType === 'player') {
      const w = gameState.players.find(p => p.id === gameState.winnerId);
      return w ? this.getWinnerInfo(w) : null;
    } else {
      const w = gameState.teams.find(p => p.id === gameState.winnerId);
      return w ? this.getWinnerInfo(w) : null;
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

  winsRanking = computed(() => {
    const s = this.state();
    if (!s.isGameOver) return [];

    if (s.gameMode === 'individual') {
      return [...s.players].sort((a, b) => b.wins - a.wins);
    } else {
      return [...s.teams].sort((a, b) => b.wins - a.wins);
    }
  });

  playerMap: Signal<Map<string, Player>> = toSignalMap(this.players, player => player.id);

  constructor() {

    afterNextRender(() => {
      const input = this.inputPointsElement();
      if (input) {
        input.nativeElement.focus();
      }
    });
  }

  setZeroPoints(): void {
    this.store.addPoints(0);
    this.clearInputPoints();
  }

  submitPoints(): void {
    if (!this.canRecord()) return;
    const points = this.inputPoints();
    if (points == null) return;

    this.store.addPoints(points);
    this.clearInputPoints();
  }

  onPointsInput(value: number | null | undefined): void {
    const points = Number(value);
    this.inputPoints.set(Number.isNaN(points) ? null : points);
  }

  private getWinnerInfo(winner: { name: string; score: number }): Winner {
    return { name: winner.name, score: winner.score };
  }

  private clearInputPoints(): void {
    const element = this.inputPointsElement()?.nativeElement;
    this.inputPoints.set(null);
    if (element) {
      element.focus();
    }
  }
}

