# Decision Log
Append-only. When a meaningful decision is made, log it here.
Format: [YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...
---
[2026-10-13] DECISION: Adopted the WAT architecture (workflows, agents, tools) for the workspace and installed it with LinkedIn content as the first workflow. | REASONING: deterministic scripts keep execution accurate while the agent handles orchestration and decisions. | CONTEXT: requested by Ochuko; LinkedIn posting/content is a top recurring task.
[2026-10-13] DECISION: Moved the WAT framework install into projects/My linkedin contents. | REASONING: Ochuko specified that location for the LinkedIn content framework and could not find it at the workspace root. | CONTEXT: first install was placed at the root; moved workflows, tools, .env, .tmp, and the architecture doc into the project folder.