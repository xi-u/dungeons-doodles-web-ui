export const STAT_NAMES = ["Strength", "Agility", "Vitality", "Spirit", "Intelligence"];

// Find the stat with the given name in the given option, or undefined if not found
function findStat(option, name) {
  return option?.stats?.find(stat => stat.name === name);
}

// Return an array of stat objects for the given class and race, combining their values and icons.
// If a stat is missing from either the class or race, treat its value as 0.
// The icon is taken from the class if present, otherwise from the race, otherwise from any option that has it.
export function characterStats(selectedClass, selectedRace, catalog) {
  const allOptions = [...catalog.classes, ...catalog.races];
  return STAT_NAMES.filter(name => allOptions.some(option => findStat(option, name))).map(name => {
    const base = findStat(selectedClass, name);
    const bonus = findStat(selectedRace, name);
    const icon = base?.icon || bonus?.icon || allOptions.map(option => findStat(option, name)?.icon).find(Boolean);
    const value = Math.max(0, base?.value ?? 0) + (bonus?.value ?? 0);
    return { name, icon, value };
  });
}
