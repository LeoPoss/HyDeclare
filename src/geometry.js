import { NODE_H, PORT_GAP } from "./constants";

export function sigHeight(n) {
  return Math.max(NODE_H, (n - 1) * PORT_GAP + 58);
}
