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
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Player, Team, GameMode } from '../../../models/game.models';

@Component({
  selector: 'app-player-ordering',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    DragDropModule,
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

  constructor() {
    effect(() => {
      const mode = this.gameMode();
      const players = this.players();
      const teams = this.teams();

      switch(mode) {

        case 'individual': {
          this.orderedPlayers.set([...players]);
          break;
        }

        case 'team': {
          const initialOrder: Player[] = [];
          teams.forEach(team => {
            team.playerIds.forEach(playerId => {
              const player = this.players().find(x => x.id === playerId);
              if (player) initialOrder.push(player);
            });
          });

          this.orderedPlayers.set(initialOrder);
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
    this.orderConfirmed.emit(this.orderedPlayers());
  }
}
