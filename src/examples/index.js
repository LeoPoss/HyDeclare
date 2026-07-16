import coolingData from "./cooling.json";
import reactorData from "./reactor.json";

/** Return a deep-cloned copy so the caller can mutate freely. */
const clone = (o) => JSON.parse(JSON.stringify(o));

export function exCooling() {
  return clone(coolingData);
}

export function exReactor() {
  return clone(reactorData);
}

/** Lookup table by name (useful for menus). */
export const examples = {
  cooling: { label: "Cooling", load: exCooling },
  reactor: { label: "Reactor · 2 signals", load: exReactor },
};
