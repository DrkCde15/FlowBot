"""Execução de blocos de ação (integrações) no runtime do FlowBot.

Veja `execute.py` para a implementação dos handlers.
"""
from app.actions.execute import HANDLERS, run_action

__all__ = ["run_action", "HANDLERS"]
