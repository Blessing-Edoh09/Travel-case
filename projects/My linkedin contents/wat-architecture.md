# WAT Architecture (Workflows, Agents, Tools)

## Layer 1: Workflows (The Instructions)

- Markdown SOPs stored in `workflows/`.
- Each workflow defines the objective, required inputs, which tools to use, expected outputs, and
  how to handle edge cases.
- Written in plain language, the same way you'd brief someone on your team.

## Layer 2: Agents (The Decision-Maker)

This is the assistant's role. It is responsible for intelligent coordination:

- Read the relevant workflow.
- Run tools in the correct sequence.
- Handle failures gracefully.
- Ask clarifying questions when needed.
- Connect intent to execution without trying to do everything itself.

Example: if you need to pull data from a website, don't attempt it directly. Read
`workflows/scrape_website.md`, figure out the required inputs, then execute
`tools/scrape_single_site.py`.

## Layer 3: Tools (The Execution)

- Python scripts in `tools/` that do the actual work.
- API calls, data transformations, file operations, database queries.
- Credentials and API keys are stored in `.env`.
- Scripts are consistent, testable, and fast.

Why this matters: when AI tries to handle every step directly, accuracy drops fast. If each step
is 90% accurate, you're down to 59% success after five steps. By offloading execution to
deterministic scripts, the agent stays focused on orchestration and decision-making.

## How to Operate

1. Look for existing tools first. Check `tools/` based on what the workflow requires. Only create
   new scripts when nothing exists for that task.

2. Learn and adapt when things fail. When you hit an error:
   - Read the full error message and trace.
   - Fix the script and retest.
   - If it uses paid API calls or credits, check with the user before running again.
   - Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior).

3. Keep workflows current. Workflows evolve as you learn. Update them when you find better methods,
   discover constraints, or hit recurring issues. Do not create or overwrite workflows without
   asking, unless explicitly told to. Workflows are instructions to preserve and refine, not toss
   after one use.

## The Self-Improvement Loop

Every failure is a chance to make the system stronger:

1. Identify what broke.
2. Fix the tool.
3. Verify the fix works.
4. Update the workflow with the new approach.
5. Move on with a more robust system.

## File Structure

- Deliverables: final outputs go to cloud services (Google Sheets, Slides, etc.).
- Intermediates: temporary processing files that can be regenerated.

Directory layout:

- `.tmp/`: temporary files (scraped data, intermediate exports). Regenerated as needed.
- `tools/`: Python scripts for deterministic execution.
- `workflows/`: Markdown SOPs defining what to do and how.
- `.env`: API keys and environment variables. Never store secrets anywhere else.
- `credentials.json`, `token.json`: Google OAuth, gitignored.

Core principle: local files are just for processing. Anything the user needs to see or use lives
in cloud services. Everything in `.tmp/` is disposable.

## Bottom Line

The assistant sits between what the user wants (workflows) and what actually gets done (tools).
Its job is to read instructions, make smart decisions, call the right tools, recover from errors,
and keep improving the system as it goes.

Stay pragmatic. Stay reliable. Keep learning.