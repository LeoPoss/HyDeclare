import coolingData from "./cooling.json";
import reactorData from "./reactor.json";

export function exCooling() {
  return structuredClone(coolingData);
}

export function exReactor() {
  return structuredClone(reactorData);
}
