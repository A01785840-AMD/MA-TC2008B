from typing_extensions import override

from ..api import BaseModel, BaseAgent


class MockAgent(BaseAgent):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__('main', *args, **kwargs)

        self.pos = (0, 0)

    @override
    def snapshot(self) -> BaseAgent.Serialization:
        return {
            "id": self.unique_id,
            "agent_type": self.type,
            "position": self.pos,
            # "state": self.state,
        }


class MockModel(BaseModel):
    def __init__(self, *args, **kwargs) -> None:
        # super().__init__(*args, **kwargs)
        super().__init__()

        self.agent_1 = MockAgent(self)
        self.agent_2 = MockAgent(self)
        self.agent_3 = MockAgent(self)

    @override
    def step(self) -> None:
        self.perform_clean_ups()

        self.created_agents.append(self.agent_1.snapshot())
        self.updated_agents.append(self.agent_1.snapshot())
