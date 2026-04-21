import { Component, input, output, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Player, Team, GameMode } from '../../../models/game.models';

@Component({
  selector: 'app-player-ordering',
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    DragDropModule,
  ],
  templateUrl: './player-ordering.component.html',
  styleUrl: './player-ordering.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerOrderingComponent implements OnInit {
  players = input.required<Player[]>();
  teams = input.required<Team[]>();
  gameMode = input.required<GameMode>();

  orderConfirmed = output<Player[]>();
  backToConfig = output<void>();

  orderedPlayers = signal<Player[]>([]);

  ngOnInit(): void {
    if (this.gameMode() === 'individual') {
      this.orderedPlayers.set([...this.players()]);
    } else {
      const initialOrder: Player[] = [];
      this.teams().forEach(team => {
        team.playerIds.forEach(pid => {
          const p = this.players().find(x => x.id === pid);
          if (p) initialOrder.push(p);
        });
      });
      this.orderedPlayers.set(initialOrder);
    }
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
