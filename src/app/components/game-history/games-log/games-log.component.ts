import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameStore } from '../../../services/game.store';
import { GameLogExportService } from '../../../services/game-log-export';

@Component({
  selector: 'games-log',
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './games-log.component.html',
  styleUrl: './games-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesLogComponent {
  readonly #store = inject(GameStore);
  readonly #gameLogExportService = inject(GameLogExportService);

  gameHistory = this.#store.gameHistory;

  async saveGameLog(): Promise<void> {
    await this.#gameLogExportService.saveGameLog();
  }
}
