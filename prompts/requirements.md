Hi, I need to write a web application to keep score for a dice game.
At the start, users can either create teams and assign players to each team or create a list of players who play individually.
Next, users can specify how many points need to be rolled; the default value is 10,000 points.
Then, the starting player is determined.
Each player rolls the dice, and the number of points rolled must be recorded.
If a player rolls 0 points in a given round, 0 is recorded and a mark is made for the player.
If a player rolls 0 points three times in a row (has three marks), 500 points are deducted.
In team play, 500 points are deducted if three players in a row on the same team roll 0 points.

The game ends when a player or team reaches the required number of points.
There is also a rule that in case that a player reaches `TARGET_POINTS` points, the rest players of the round can finish their turns.
In the case of individual play, the game finishes when all players in the last round finish their turns.
In the case of team play, the game finishes when the same count of players as in winner teams finishes his round.
Example: Team A (with players A1, A2, A3), team B (with players B1, B2, B3).
Player A2 reaches `TARGET_POINTS` (so only two players from team A played in the last round).
A3 does not play in the last round, because team A already reaches `TARGET_POINTS`.
The game ends when B1 and B2 players finish their turns (also only two players from team B can play in the last round).
It means that player B3 do not play in the last round.


The game must track and display which player is up next and how many dashes they have.
In the case of a team game, the team’s score must be displayed.

The application will be written in Angular, the latest version.
The application will be optimized for mobile phones.
After entering players/teams, the information is saved to the application store.
The game state is also saved to the store so that it can be loaded from the store after the page is reloaded.
When the "New Game" button is clicked, the user can either keep the existing list of players or create a new one. The game state is then cleared from the store, and the game starts over.

In the case of a team game, it would be helpful to display the number of points for each team and the number of dashes.

In the beginning, allow setting minimum points per turn; the default value is 350.

Players don't have to sit according to their teams, so before the game starts, there is needed to have the possibility to set the order of players around the table.
The first player on the list starts the game.
This should be done as a list of all players (regardless of their team) with drag and drop functionality to reorder players.

There is also an option: when the game ends and 'Keep Players' is selected, 
it must be possible to either offer to change the player order (player-ordering view)
or select the player who will start. In this case the player ordering remains unchanged, it is simply shifted, so the chosen player is in the first place.
(e.g., the current player order is A - B - C - D - E, then D is selected as the player who will start, so the new order is D - E - A - B - C)
