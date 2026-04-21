import { Component, inject, signal, computed, ChangeDetectionStrategy, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { form } from '@angular/forms/signals';
import { generateUniqueId } from '../../../utils/uuid';
import { GameMode, Player, Team } from '../../../models/game.models';

@Component({
  selector: 'app-game-config',
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
  templateUrl: './game-config.component.html',
  styleUrl: './game-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameConfigComponent {
  initialPlayers = input<Player[]>([]);
  initialTeams = input<Team[]>([]);
  initialConfig = input<{ gameMode: GameMode; targetPoints: number; minPointsPerTurn: number }>({
    gameMode: 'individual',
    targetPoints: 10000,
    minPointsPerTurn: 350
  });

  configComplete = output<{
    players: Player[];
    teams: Team[];
    config: { gameMode: GameMode; targetPoints: number; minPointsPerTurn: number };
  }>();

  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);

  setupModel = signal({
    gameMode: 'individual' as GameMode,
    targetPoints: 10000,
    minPointsPerTurn: 350
  });

  setupForm = form(this.setupModel);

  constructor() {
    // Initialize signals from inputs
    // Using an effect or ngOnInit to sync might be better but for simplicity in this pass:
  }

  ngOnInit() {
    if (this.initialPlayers().length > 0) this.players.set(this.initialPlayers());
    if (this.initialTeams().length > 0) this.teams.set(this.initialTeams());
    this.setupModel.set(this.initialConfig());
  }

  canNext = computed(() => {
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

  onNext() {
    if (this.canNext()) {
      this.configComplete.emit({
        players: this.players(),
        teams: this.teams(),
        config: {
          gameMode: this.setupForm.gameMode().value(),
          targetPoints: this.setupForm.targetPoints().value(),
          minPointsPerTurn: this.setupForm.minPointsPerTurn().value()
        }
      });
    }
  }
}
