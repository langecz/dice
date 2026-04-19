import { Component, inject, signal, computed, ViewChild, TemplateRef } from '@angular/core';
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
import { GameStore } from '../services/game.store';
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
  template: `
    <mat-toolbar color="primary">
      <span>Dice Game</span>
      <span class="spacer"></span>
      <button mat-button (click)="onNewGame()">New Game</button>
    </mat-toolbar>

    <div class="dashboard-container">
      @if (isGameOver()) {
        <mat-card class="winner-card">
          <mat-card-header>
            <mat-card-title>Game Over!</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>Winner: {{ winnerName() }}</h2>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="onNewGame()">PLAY AGAIN</button>
          </mat-card-actions>
        </mat-card>
      } @else {
        <mat-card class="current-turn-card">
          <mat-card-header>
            <mat-card-title>Current Turn</mat-card-title>
            <mat-card-subtitle>
              @if (gameMode() === 'team') {
                Team: {{ currentTeam()?.name }}
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="player-info">
              <h2>{{ currentPlayer()?.name }}</h2>
              <div class="dashes">
                @for (i of [1,2,3]; track i) {
                  <mat-icon [color]="(currentPlayer()?.dashes || 0) >= i ? 'warn' : ''">
                    {{ (currentPlayer()?.dashes || 0) >= i ? 'remove_circle' : 'remove_circle_outline' }}
                  </mat-icon>
                }
              </div>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Points rolled</mat-label>
              <input matInput type="number" #pointsInput (keyup.enter)="submitPoints(pointsInput)" aria-label="Enter points rolled">
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="submitPoints(pointsInput)">RECORD</button>
          </mat-card-actions>
        </mat-card>
      }

      <div class="scores-section">
        <h3>Scores (Target: {{ state().targetPoints }})</h3>

        @if (gameMode() === 'individual') {
          <mat-list>
            @for (player of players(); track player.id) {
              <mat-list-item [class.current]="player.id === currentPlayer()?.id">
                <span matListItemTitle>{{ player.name }}</span>
                <span matListItemLine>Points: {{ player.score }} | Dashes: {{ player.dashes }}</span>
              </mat-list-item>
            }
          </mat-list>
        } @else {
          @for (team of teams(); track team.id) {
            <mat-card class="team-score-card" [class.current]="team.id === currentTeam()?.id">
              <mat-card-header>
                <mat-card-title>{{ team.name }}: {{ team.score }} pts</mat-card-title>
                <mat-card-subtitle>Team Dashes: {{ team.dashes }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <mat-list>
                  @for (pid of team.playerIds; track pid) {
                    <mat-list-item [class.current]="getPlayer(pid)?.id === currentPlayer()?.id">
                      <span matListItemTitle>{{ getPlayer(pid)?.name }}</span>
                      <span matListItemLine>Dashes: {{ getPlayer(pid)?.dashes }}</span>
                    </mat-list-item>
                  }
                </mat-list>
              </mat-card-content>
            </mat-card>
          }
        }
      </div>
    </div>

    <ng-template #newGameDialog let-dialogRef>
      <h2 mat-dialog-title>Start New Game?</h2>
      <mat-dialog-content>
        Would you like to keep the current players or start fresh?
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialog.closeAll()">Cancel</button>
        <button mat-button color="warn" (click)="resetGame(false)">New Players</button>
        <button mat-raised-button color="primary" (click)="resetGame(true)">Keep Players</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    .dashboard-container {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .player-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .dashes { display: flex; gap: 4px; }
    .current { border-left: 4px solid #3f51b5; background: #f5f5f5; }
    .team-score-card { margin-bottom: 8px; }
    .winner-card { text-align: center; border: 2px solid #4caf50; }
  `]
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
