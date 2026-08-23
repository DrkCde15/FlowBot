from app.engine import get_next_block
from app.engine.flow import Block, Branch


def _flow() -> list[Block]:
    return [
        Block.model_validate(
            {
                "id": "start",
                "type": "text",
                "next": "ask",
                "content": "hi",
            }
        ),
        Block.model_validate(
            {
                "id": "ask",
                "type": "buttons",
                "variable": "plan",
                "branches": [
                    {"id": "b1", "label": "Pro", "operator": "equals", "value": "pro", "next": "pro_block"},
                    {"id": "b2", "label": "Free", "operator": "equals", "value": "free", "next": "free_block"},
                ],
                "next": "fallback",
            }
        ),
        Block.model_validate({"id": "pro_block", "type": "text", "next": None}),
        Block.model_validate({"id": "free_block", "type": "text", "next": None}),
        Block.model_validate({"id": "fallback", "type": "text", "next": None}),
    ]


def test_linear_next():
    flow = _flow()
    assert get_next_block(flow, flow[0]) is flow[1]


def test_branch_match():
    flow = _flow()
    nxt = get_next_block(flow, flow[1], "pro")
    assert nxt.id == "pro_block"


def test_default_next_when_no_branch():
    flow = _flow()
    nxt = get_next_block(flow, flow[1], "unknown")
    assert nxt.id == "fallback"


def test_no_next_completes():
    flow = _flow()
    assert get_next_block(flow, flow[2]) is None
