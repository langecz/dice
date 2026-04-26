import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  InputSignal,
  OutputEmitterRef, WritableSignal, effect
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { Player, Team, GameMode } from '../../../models/game.models';

@Component({
  selector: 'app-player-ordering',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    DragDropModule,
    FormsModule,
  ],
  templateUrl: './player-ordering.component.html',
  styleUrl: './player-ordering.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerOrderingComponent {
  players: InputSignal<Player[]> = input.required<Player[]>();
  teams: InputSignal<Team[]> = input.required<Team[]>();
  gameMode: InputSignal<GameMode> = input.required<GameMode>();

  orderConfirmed: OutputEmitterRef<Player[]> = output<Player[]>();
  backToConfig: OutputEmitterRef<void> = output<void>();

  orderedPlayers: WritableSignal<Player[]> = signal<Player[]>([]);
  selectedStartingPlayerId: WritableSignal<string> = signal<string>('');

  constructor() {
    effect(() => {
      const mode = this.gameMode();
      const players = this.players();
      const teams = this.teams();

      // Only initialize if we don't have an order yet
      if (this.orderedPlayers().length === 0) {
        let initialOrder: Player[] = [];
        switch(mode) {
          case 'individual': {
            initialOrder = [...players];
            break;
          }

          case 'team': {
            // In team mode, if we already have players (e.g. from previous game), keep their order.
            // Otherwise, group them by teams as a starting point.
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
        if (initialOrder.length > 0 && !this.selectedStartingPlayerId()) {
          this.selectedStartingPlayerId.set(initialOrder[0].id);
        }
      }
    })
  }

  dropOrderedPlayer(event: CdkDragDrop<Player[]>): void {
    const p = [...this.orderedPlayers()];
    moveItemInArray(p, event.previousIndex, event.currentIndex);
    this.orderedPlayers.set(p);
  }

  getTeamName(playerId: string): string {
    return this.teams().find(t => t.playerIds.includes(playerId))?.name || '';
  }

  onBack(): void {
    this.backToConfig.emit();
  }

  onConfirm(): void {
    const players = [...this.orderedPlayers()];
    const startingId = this.selectedStartingPlayerId();
    const startIndex = players.findIndex(p => p.id === startingId);

    if (startIndex !== -1 && startIndex !== 0) {
      const rearranged = [
        ...players.slice(startIndex),
        ...players.slice(0, startIndex)
      ];
      this.orderConfirmed.emit(rearranged);
    } else {
      this.orderConfirmed.emit(players);
    }
  }
}
