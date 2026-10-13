# WAT Framework

The workspace runs on Workflows, Agents, Tools. Full guide:
`projects/My linkedin contents/wat-architecture.md`.

The first WAT workflow lives in `projects/My linkedin contents/` (LinkedIn content).

## Operating Rules

- Read the relevant workflow in `workflows/` before acting on a task.
- Check `tools/` for an existing script first. Only create new scripts when nothing exists.
- Run tools in the correct sequence. Do not try to do every step yourself.
- Handle failures gracefully. Ask clarifying questions when stuck.
- On any error: read the trace, fix the tool, verify, then update the workflow. Ask before
  rerunning anything that burns paid credits.
- Do not create or overwrite workflows unless the user asked you to.
- Keep local files only for processing. Deliverables go to cloud services.
- Everything in `.tmp/` is disposable. Never store secrets there or anywhere but `.env`.