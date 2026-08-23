from app.engine.flow import Block, Branch


def get_block(flow: list[Block], block_id: str | None) -> Block | None:
    if not block_id:
        return None
    return next((b for b in flow if b.id == block_id), None)


def first_block(flow: list[Block]) -> Block | None:
    return flow[0] if flow else None


def _branch_matches(branch: Branch, value: str | None) -> bool:
    if value is None:
        return False
    target = branch.value or ""
    op = branch.operator
    if op == "equals":
        return value == target
    if op == "notEquals":
        return value != target
    if op == "contains":
        return target.lower() in value.lower()
    if op == "greater":
        return float(value) > float(target)
    if op == "less":
        return float(value) < float(target)
    return False


def get_next_block(flow: list[Block], current: Block, answer_value: str | None = None) -> Block | None:
    if current.branches:
        for branch in current.branches:
            if _branch_matches(branch, answer_value):
                target = get_block(flow, branch.next)
                if target:
                    return target
    return get_block(flow, current.next)


__all__ = ["get_block", "first_block", "get_next_block"]
