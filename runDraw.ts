// Simple runner to execute a full draw and print results.
import { simulateFullDraw } from "./draw";
import teams from "./teams";

const formatGroup = () => {
  const state = simulateFullDraw(teams);
  console.log("Draw complete. Draw order:");
  state.drawOrder.forEach((team, index) =>
    console.log(`${index + 1}. ${team.name} (Pot ${team.pot})`)
  );

  console.log("\nGroups:");
  Object.values(state.groups)
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((group) => {
      console.log(`Group ${group.id}:`);
      group.slots
        .sort((a, b) => a.position - b.position)
        .forEach((slot) => {
          const name = slot.team ? `${slot.team.name} (Pot ${slot.team.pot})` : "-";
          console.log(`  ${slot.position}: ${name}`);
        });
    });
};

formatGroup();
