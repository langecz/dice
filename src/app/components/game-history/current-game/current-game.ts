import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { GameStore } from '../../../services/game.store';
import { MatCard, MatCardHeader, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { DialogService } from '../../../services/dialog.service';
import { InputDialogComponent, InputDialogData } from '../../shared/input-dialog/input-dialog.component';
import { MatFabButton } from '@angular/material/button';

@Component({
  selector: 'current-game',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatList,
    MatListItem,
    MatIcon,
    MatFabButton
  ],
  templateUrl: './current-game.html',
  styleUrl: './current-game.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentGame {
  readonly store = inject(GameStore);
  private readonly dialog = inject(DialogService);

  // Enhanced computed to include metadata for UI
  readonly logData = computed(() => {
    const state = this.store.state();
    const teams = state.teams;

    const allTurns: any[] = [];
    state.currentGame.forEach(r => allTurns.push(...r.turns));
    allTurns.push(...state.currentRound);

    // Map to find last roll of each player
    const lastRollMap = new Map<string, any>();
    allTurns.forEach(t => lastRollMap.set(t.playerId, t));

    const result = [];

    // Current Round
    if (state.currentRound.length > 0) {
      result.push({
        header: 'Current Round',
        turns: state.currentRound.map(t => this.enrichTurn(t, lastRollMap, teams))
      });
    }

    // Previous Rounds
    const finishedRounds = [...state.currentGame].sort((a, b) => b.roundNumber - a.roundNumber);
    finishedRounds.forEach(r => {
      result.push({
        header: `Round #${r.roundNumber}`,
        turns: r.turns.map(t => this.enrichTurn(t, lastRollMap, teams))
      });
    });

    return result;
  });

  private enrichTurn(turn: any, lastRollMap: Map<string, any>, teams: any[]) {
    const team = teams.find(t => t.playerIds.includes(turn.playerId));
    return {
      ...turn,
      teamName: team ? team.name : '',
      isLast: lastRollMap.get(turn.playerId) === turn
    };
  }

  startEdit(turn: any) {
    const dialogRef = this.dialog.open<InputDialogComponent, InputDialogData, number | null>(
      InputDialogComponent,
      {
        data: {
          title: 'Edit Points',
          label: 'Points',
          value: turn.points,
          type: 'number',
          description: `Editing points for ${turn.playerName}`,
          confirmText: 'OK',
          required: true
        }
      }
    );

    dialogRef.afterClosed().subscribe(newPoints => {
      if (newPoints !== null && newPoints !== undefined) {
        this.store.updateLastRoll(turn.playerId, newPoints);
      }
    });
  }
}
