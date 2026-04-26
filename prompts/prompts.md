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
