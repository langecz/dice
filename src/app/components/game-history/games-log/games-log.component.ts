import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { GameStore } from '../../../services/game.store';

@Component({
  selector: 'games-log',
  imports: [CommonModule, MatExpansionModule, MatListModule, MatCard, MatCardHeader, MatCardContent, MatCardTitle],
  templateUrl: './games-log.component.html',
  styleUrl: './games-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesLogComponent {
  store = inject(GameStore);
  gameHistory = this.store.gameHistory;
}
