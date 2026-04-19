import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { GameStore } from '../services/game.store';
import { GameMode, Player, Team } from '../models/game.models';
import { Router } from '@angular/router';
import { form } from '@angular/forms/signals';

@Component({
  selector: 'app-setup',
  imports: [
    CommonModule,
    MatCardModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    DragDropModule,
  ],
  template: `
    <div class="setup-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Game Setup</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="setup-section">
            <h3>Game Mode</h3>
            <mat-radio-group [value]="setupForm.gameMode().value()" (change)="setupForm.gameMode().value.set($event.value)">
              <mat-radio-button value="individual">Individual</mat-radio-button>
              <mat-radio-button value="team">Team</mat-radio-button>
            </mat-radio-group>
          </div>

          <div class="setup-section">
            <h3>Target Points</h3>
            <mat-form-field appearance="outline">
              <mat-label>Points to win</mat-label>
              <input matInput type="number" [value]="setupForm.targetPoints().value()" (input)="setupForm.targetPoints().value.set($any($event.target).value)" aria-label="Target points to win">
            </mat-form-field>
          </div>

          <div class="setup-section">
            <h3>{{ setupForm.gameMode().value() === 'individual' ? 'Players' : 'Teams & Players' }}</h3>

            <div class="add-player-form">
               <mat-form-field appearance="outline">
                <mat-label>{{ setupForm.gameMode().value() === 'individual' ? 'Player Name' : 'Team Name' }}</mat-label>
                <input matInput #nameInput (keyup.enter)="addItem(nameInput.value); nameInput.value = ''" [aria-label]="setupForm.gameMode().value() === 'individual' ? 'Enter Player Name' : 'Enter Team Name'">
              </mat-form-field>
              <button mat-mini-fab color="primary" (click)="addItem(nameInput.value); nameInput.value = ''" [aria-label]="setupForm.gameMode().value() === 'individual' ? 'Add Player' : 'Add Team'">
                <mat-icon>add</mat-icon>
              </button>
            </div>

            @if (setupForm.gameMode().value() === 'individual') {
              <mat-list cdkDropList (cdkDropListDropped)="dropPlayer($event)">
                @for (player of players(); track player.id) {
                  <mat-list-item cdkDrag>
                    <mat-icon matListItemIcon cdkDragHandle>drag_handle</mat-icon>
                    <span matListItemTitle>{{ player.name }}</span>
                    <button mat-icon-button (click)="removeItem(player.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </mat-list-item>
                }
              </mat-list>
            } @else {
              @for (team of teams(); track team.id) {
                <mat-card class="team-card">
                   <mat-card-header>
                    <mat-card-title>{{ team.name }}</mat-card-title>
                    <button mat-icon-button (click)="removeItem(team.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="add-player-to-team">
                      <mat-form-field appearance="outline" compact>
                        <mat-label>Player Name</mat-label>
                        <input matInput #pInput (keyup.enter)="addPlayerToTeam(team.id, pInput.value); pInput.value = ''">
                      </mat-form-field>
                      <button mat-button (click)="addPlayerToTeam(team.id, pInput.value); pInput.value = ''">Add</button>
                    </div>
                    <mat-list cdkDropList (cdkDropListDropped)="dropPlayerInTeam(team.id, $event)">
                      @for (pid of team.playerIds; track pid) {
                        <mat-list-item cdkDrag>
                           <mat-icon matListItemIcon cdkDragHandle>drag_handle</mat-icon>
                           <span>{{ getPlayer(pid)?.name }}</span>
                           <button mat-icon-button (click)="removePlayerFromTeam(team.id, pid)">
                             <mat-icon>close</mat-icon>
                           </button>
                        </mat-list-item>
                      }
                    </mat-list>
                  </mat-card-content>
                </mat-card>
              }
            }
          </div>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" [disabled]="!canStart()" (click)="startGame()">
            START GAME
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .setup-container {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
    }
    .setup-section {
      margin-bottom: 24px;
    }
    .add-player-form {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .team-card {
      margin-bottom: 16px;
      border: 1px solid #eee;
    }
    .add-player-to-team {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }
    .cdk-drag-placeholder {
      opacity: 0;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .mat-list-base .mat-list-item {
      cursor: move;
    }
  `]
})
export class SetupComponent {
  private store = inject(GameStore);
  private router = inject(Router);

  setupModel = signal({
    gameMode: 'individual' as GameMode,
    targetPoints: 10000
  });

  setupForm = form(this.setupModel);

  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);

  canStart = computed(() => {
    if (this.setupForm.gameMode().value() === 'individual') {
      return this.players().length >= 2;
    } else {
      return this.teams().length >= 2 && this.teams().every(t => t.playerIds.length >= 1);
    }
  });

  addItem(name: string) {
    if (!name) return;
    if (this.setupForm.gameMode().value() === 'individual') {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        score: 0,
        dashes: 0,
        history: []
      };
      this.players.update(p => [...p, newPlayer]);
    } else {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name,
        playerIds: [],
        score: 0,
        dashes: 0,
        history: []
      };
      this.teams.update(t => [...t, newTeam]);
    }
  }

  removeItem(id: string) {
    if (this.setupForm.gameMode().value() === 'individual') {
      this.players.update(p => p.filter(x => x.id !== id));
    } else {
      const team = this.teams().find(t => t.id === id);
      if (team) {
        const pids = team.playerIds;
        this.teams.update(t => t.filter(x => x.id !== id));
        this.players.update(p => p.filter(x => !pids.includes(x.id)));
      }
    }
  }

  addPlayerToTeam(teamId: string, playerName: string) {
    if (!playerName) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: playerName,
      score: 0,
      dashes: 0,
      history: []
    };
    this.players.update(p => [...p, newPlayer]);
    this.teams.update(teams => teams.map(t =>
      t.id === teamId ? { ...t, playerIds: [...t.playerIds, newPlayer.id] } : t
    ));
  }

  removePlayerFromTeam(teamId: string, playerId: string) {
    this.teams.update(teams => teams.map(t =>
      t.id === teamId ? { ...t, playerIds: t.playerIds.filter(pid => pid !== playerId) } : t
    ));
    this.players.update(p => p.filter(x => x.id !== playerId));
  }

  getPlayer(id: string) {
    return this.players().find(p => p.id === id);
  }

  dropPlayer(event: CdkDragDrop<Player[]>) {
    const p = [...this.players()];
    moveItemInArray(p, event.previousIndex, event.currentIndex);
    this.players.set(p);
  }

  dropPlayerInTeam(teamId: string, event: CdkDragDrop<string[]>) {
    this.teams.update(teams => teams.map(t => {
      if (t.id === teamId) {
        const pids = [...t.playerIds];
        moveItemInArray(pids, event.previousIndex, event.currentIndex);
        return { ...t, playerIds: pids };
      }
      return t;
    }));
  }

  startGame() {
    // If team mode, we should ensure the overall player list is ordered according to teams
    let orderedPlayers: Player[] = [];
    if (this.setupForm.gameMode().value() === 'individual') {
      orderedPlayers = this.players();
    } else {
      this.teams().forEach(team => {
        team.playerIds.forEach(pid => {
          const p = this.players().find(x => x.id === pid);
          if (p) orderedPlayers.push(p);
        });
      });
    }

    this.store.setupGame({
      gameMode: this.setupForm.gameMode().value(),
      targetPoints: this.setupForm.targetPoints().value(),
      players: orderedPlayers,
      teams: this.teams()
    });
    this.router.navigate(['/game']);
  }
}
