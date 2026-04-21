import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { GameStore } from '../../services/game.store';
import { GameMode, Player, Team } from '../../models/game.models';
import { Router } from '@angular/router';
import { form } from '@angular/forms/signals';
import { generateUniqueId } from '../../utils/uuid';

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
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupComponent {
  private store = inject(GameStore);
  private router = inject(Router);

  setupModel = signal({
    gameMode: 'individual' as GameMode,
    targetPoints: 10000,
    minPointsPerTurn: 350
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
        id: generateUniqueId(),
        name,
        score: 0,
        dashes: 0,
        history: []
      };
      this.players.update(p => [...p, newPlayer]);
    } else {
      const newTeam: Team = {
        id: generateUniqueId(),
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
      id: generateUniqueId(),
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
      minPointsPerTurn: this.setupForm.minPointsPerTurn().value(),
      players: orderedPlayers,
      teams: this.teams()
    });
    this.router.navigate(['/game']);
  }
}
