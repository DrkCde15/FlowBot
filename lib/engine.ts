import { Block, Branch } from "./flow";

export function getBlock(flow: Block[], id: string | null): Block | undefined {
  if (!id) return undefined;
  return flow.find((b) => b.id === id);
}

export function firstBlock(flow: Block[]): Block | undefined {
  return flow[0];
}

function branchMatches(branch: Branch, value: string | undefined): boolean {
  if (value === undefined) return false;
  const target = branch.value ?? "";
  switch (branch.operator) {
    case "equals":
      return value === target;
    case "notEquals":
      return value !== target;
    case "contains":
      return value.toLowerCase().includes(target.toLowerCase());
    case "greater":
      return Number(value) > Number(target);
    case "less":
      return Number(value) < Number(target);
    default:
      return false;
  }
}

/**
 * Given the current block and the just-submitted answer (variable -> value),
 * decide which block to show next.
 */
export function getNextBlock(
  flow: Block[],
  current: Block,
  answerValue?: string
): Block | null {
  if (current.branches && current.branches.length > 0) {
    for (const branch of current.branches) {
      if (branchMatches(branch, answerValue)) {
        const target = getBlock(flow, branch.next);
        if (target) return target;
      }
    }
  }
  return getBlock(flow, current.next) ?? null;
}
