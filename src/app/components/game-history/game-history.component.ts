import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { GamesLogComponent } from './games-log/games-log.component';

@Component({
  selector: 'game-history',
  imports: [
    MatTabGroup,
    MatTab,
    GamesLogComponent,
  ],
  templateUrl: './game-history.component.html',
  styleUrl: './game-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameHistoryComponent {
}
