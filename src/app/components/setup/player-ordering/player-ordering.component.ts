import {
  Component,
  signal,
  ChangeDetectionStrategy,
  WritableSignal,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { Player } from '../../../models/game.models';
import { GameStore } from '../../../services/game.store';

@Component({
  selector: 'dice-player-ordering',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    DragDropModule,
  ],
  templateUrl: './player-ordering.component.html',
  styleUrl: './player-ordering.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerOrderingComponent {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);

  readonly players = this.store.players;
  readonly teams = this.store.teams;
  readonly gameMode = this.store.gameMode;

  orderedPlayers: WritableSignal<Player[]> = signal<Player[]>([]);
  selectedStartingPlayerId: WritableSignal<string> = signal<string>('');

  constructor() {
    effect(() => {
      const mode = this.gameMode();
      const players = this.players();
      const teams = this.teams();

      // Read orderedPlayers without tracking it as a dependency to avoid infinite loops
      const currentOrderedLength = untracked(() => this.orderedPlayers().length);

      // Only initialize if we don't have an order yet or if the player count changed (from management)
      if (currentOrderedLength === 0 || currentOrderedLength !== players.length) {
        let initialOrder: Player[] = [];
        switch (mode) {
          case 'individual': {
            initialOrder = [...players];
            break;
          }

          case 'team': {
            if (players.length > 0 && players.every(p => teams.some(t => t.playerIds.includes(p.id)))) {
              initialOrder = [...players];
            } else {
              teams.forEach(team => {
                team.playerIds.forEach(playerId => {
                  const player = players.find(x => x.id === playerId);
                  if (player) initialOrder.push(player);
                });
              });
            }
            break;
          }
        }

        this.orderedPlayers.set(initialOrder);
        if (initialOrder.length > 0) {
          if (!initialOrder.some(p => p.id === untracked(() => this.selectedStartingPlayerId()))) {
            this.selectedStartingPlayerId.set(initialOrder[0].id);
          }
        } else {
          this.selectedStartingPlayerId.set('');
        }
      }
    });
  }

  dropOrderedPlayer(event: CdkDragDrop<Player[]>): void {
    const p = [...this.orderedPlayers()];
    moveItemInArray(p, event.previousIndex, event.currentIndex);
    this.orderedPlayers.set(p);
  }

  getTeamName(playerId: string): string {
    return this.teams().find(t => t.playerIds.includes(playerId))?.name || '';
  }

  onBackToSetup(): void {
    void this.router.navigate(['/setup']);
  }

  onConfirm(): void {
    const players = [...this.orderedPlayers()];
    const startingId = this.selectedStartingPlayerId();
    const startIndex = players.findIndex(p => p.id === startingId);

    const ordered = startIndex > 0
      ? [...players.slice(startIndex), ...players.slice(0, startIndex)]
      : players;

    this.store.setupGame({
      gameMode: this.gameMode(),
      targetPoints: this.store.targetPoints(),
      minPointsPerTurn: this.store.minPointsPerTurn(),
      players: ordered,
      teams: this.teams(),
    });

    void this.router.navigate(['/game']);
  }
}
