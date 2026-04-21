Hi, I need to write a web application to keep score for a dice game.
At the start, users can either create teams and assign players to each team, or create a list of players who play individually.
Next, users can specify how many points need to be rolled; the default value is 10,000 points.
Then, the starting player is determined.
Each player rolls the dice, and the number of points rolled must be recorded.
If a player rolls 0 points in a given round, 0 is recorded and a mark is made for the player.
If a player rolls 0 points three times in a row (has three marks), 500 points are deducted.
In team play, 500 points are deducted if three players in a row on the same team roll 0 points.

The game ends when a player or team reaches the required number of points.

The game must track and display which player is up next and how many dashes they have.
In the case of a team game, the team’s score must be displayed.

The application will be written in Angular, latest version.
The application will be optimized for mobile phones.
After entering players/teams, the information is saved to the application store.
The game state is also saved to the store so that it can be loaded from the store after the page is reloaded.
When the "New Game" button is clicked, the user can either keep the existing list of players or create a new one. The game state is then cleared from the store, and the game starts over.

In the case of a team game, it would be helpful to display the number of points for each team and the number of dashes.

In the beginning, allow setting minimum points per turn; the default value is 350.

