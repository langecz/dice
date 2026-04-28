separate components so the templates and styles are in the own folders

---

material icons are not shown correctly

---

In the beginning, allow setting minimum points per turn; the default value is 350.

---

Do not use crypto.randomUUID. Find out how to generate unique IDs in TypeScript.
Separate the function to the file.

---

Players don't have to sit according to their teams, so before the game starts, there is needed to have the possibility to set the order of players around the table.
The first player on the list starts the game.
This should be done as a list of all players (regardless of their team) with drag and drop functionality to reorder players.

---

separate setting of the teams and players ordering to two separate components.

---

There are warnings in the `ng build` command. Fix them. 

---

Implement the following rule: in case that a player reaches 1000 points, the rest players of the round can finish their turns.

---

When the game finishes, except the winner, show also the list of the rest players/teams with their points; ordered by points. 

---

find out all constants (10000, 350, 500) and move them to the constant’s file.

---

Add a button to set zero points for the current player.
Disable the "RECORD" button if the "pointsInput" input is less than minPointsPerTurn.

---

In case that game mode is "teams", do not show dashes of the current player. Show team dashes instead; just next to the team name.

---

/*select add-player-form in the game-config.component.html*/ - 
fix the aligning of the selection so both input and button are in the same height and are aligned

---

Move "Target points" and "Minimum points per turn" to the expansion panel. Panel is collapsed by default.

---

Disable the RECORD button when points are less than minPointsPerTurn. Set focus the button when zero is set. Move the enabling logic to signal variable.

---

Do not count dashes for an individual player in case that game mode is "teams". It is enough to count just the points of the team.

---

/*edit button added manually*/
Implement edit team name functionality. There is prepared an edit button for that; with no logic yet.

---

Add a confirmation dialog for the delete team or player functionality.

---

/*open dashboard component template; select mat-dialog-actions section*/
On the selected code - Show buttons on two lines. The first line will contain "New Players" and "Keep Players" and the second line will contain "Cancel". 
All buttons will be aligned to the right.   

---

There is a bug. When player A reaches `TARGET_POINTS` points, the last round starts. Then player B reaches also `TARGET_POINTS` points. 
As the winner is marked player B, even though player A is the winner (reaches `TARGET_POINTS` points at first). 
But in case that player B reaches `TARGET_POINTS`+n points, player B is the winner even though player A was the first to reach `TARGET_POINTS`.

---

Create tests for the `game.store.ts` file. Focus on the point calculation logic. Consider corner cases.
Create comments for each test with a proper description.

---

There is also an option: when the game ends and 'Keep Players' is selected,
it must be possible to either offer to change the player order (player-ordering view)
or select the player who will start. In this case the player ordering remains unchanged, it is simply shifted, so the chosen player is in the first place.
(e.g., the current player order is A - B - C - D - E, then D is selected as the player who will start, so the new order is D - E - A - B - C)

---

Let’s change the ordering component. Allow the user to drag and drop players to reorder them as it is now.
Add a radio-button before the player name; the player with a marked radio-button will start the game.
By default, the first player in the list will be marked as a starting player.
Add a description text related to radio buttons.
The description text should explain that the radio button allows the user to select the starting player for the next game.

---

Change the behavior of the ordering component in case that the game mode is "teams":
When the order of the player is changed in the ordering list, change the order inside the team list also.
E.g., team A has defined players A1, A2, A3; team B has defined players B1, B2, B3.
On the ordering list is shown:
A1, A2, A3, B1, B2, B3. The order is changed: B3; A3, B2, A2, B1, A1. 
So in the team list is now shown:
team A: A3, A2, A1; 
team B: B3, B2, B1.
But the order how players play is still as is defined: B3; A3, B2, A2, B1, A1

---

In 'team' game mode; when there already exists a list of players in the store (`players` array), 
the ordering in the ordering list component will keep this, because this is a valid order of the players around the table.

---

There is a bug in the player order set. The list of players is set: A, B, C, D.
Then players are reordered by their seating order around the table: D, C, B, A.
As a player who starts is selected B.
The order of the turns must be: B starts, then plays A, then D, then C. 

---

Implement changed rules for the finishing of the game in case of team mode:
In the case of team play, the game finishes when the same count of players as in winner teams finishes his round.
Example: Team A (with players A1, A2, A3), team B (with players B1, B2, B3).
Player A2 reaches `TARGET_POINTS` (so only two players from team A played in the last round).
A3 does not play in the last round, because team A already reaches `TARGET_POINTS`. 
The game ends when B1 and B2 players finish their turns (also only two players from team B can play in the last round).
It means that player B3 do not play in the last round. 

---

Propose a solution to support three main screen resolutions
- mobile phone (mainly Samsung A56)
- tablet
- laptop 

--> implement suggested solution 

---

implement the restriction that player names and team names cannot be empty and must be unique.

---

