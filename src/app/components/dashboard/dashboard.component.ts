import { Component, inject, signal, computed, ViewChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameStore } from '../../services/game.store';
import { Router } from '@angular/router';

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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  store = inject(GameStore);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);

  state = this.store.state;
  players = this.store.players;
  teams = this.store.teams;
  gameMode = this.store.gameMode;
  isGameOver = this.store.isGameOver;
  currentPlayer = this.store.currentPlayer;
  currentTeam = this.store.currentTeam;
  minPointsPerTurn = computed(() => this.state().minPointsPerTurn);

  winnerName = computed(() => {
    const s = this.state();
    if (!s.winnerId) return '';
    if (s.winnerType === 'player') {
      return s.players.find(p => p.id === s.winnerId)?.name || '';
    } else {
      return s.teams.find(t => t.id === s.winnerId)?.name || '';
    }
  });

  submitPoints(input: HTMLInputElement) {
    const points = input.valueAsNumber;
    if (isNaN(points)) return;

    const prevScore = this.gameMode() === 'individual'
      ? this.currentPlayer()?.score
      : this.currentTeam()?.score;

    this.store.addPoints(points);
    input.value = '';
    input.focus();

    const newScore = this.gameMode() === 'individual'
      ? this.players().find(p => p.id === this.currentPlayer()?.id)?.score // This is actually the PREVIOUS player now
      : this.teams().find(t => t.id === this.currentTeam()?.id)?.score;

    // Check for penalty (this is a bit simplified as turn already changed)
    // In a real app we might want to track penalties in the state to show notifications
  }

  getPlayer(id: string) {
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
      this.router.navigate(['/setup']);
    }
  }
}
