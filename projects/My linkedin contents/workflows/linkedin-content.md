# LinkedIn Content Workflow

Objective: draft and publish LinkedIn content that positions Livnot Lab and gets clients. Support
the goal of 50 clients by the end of 2026.

## Required Inputs

- A topic, theme, or client offering to feature.
- Target audience (default: business owners who need design, websites, or AI automation).
- Any source material (notes, articles, past posts). If none, the agent drafts from experience and
  flags that facts need checking.

## Before You Post

1. Confirm the post text with Ochuko before publishing. Only publish without asking when Ochuko
   said otherwise.
2. Check the rules in `.claude/rules/linkedin-content.md` and `.claude/rules/communication-style.md`.
3. Check the post reads humanlike. No emojis, no em-dashes, simple language, short sentences.
4. Verify all facts. Never hallucinate clients, numbers, or results.

## Publishing Steps

1. Write or load the post text.
2. Run `tools/linkedin.py` with the post text and the target URN from `.env`.
3. Confirm the API response shows a success status.
4. Report the post URL back to Ochuko.

## Engagement After Posting

1. Check for new reactions and comments.
2. Reply to comments with the same voice rules as the post.
3. Note promising leads in Notion for tracking.

## Edge Cases

- Token expired or 401: tell Ochuko, refresh the token in `.env`, retry once.
- Rate limited: wait, retry once, then report the limit and note it here.
- Post rejected: save the error, adjust the post, ask Ochuko before retrying.
- No URL returned but status success says low, treat as failure and report.

## Learning Notes

Append what you learn here: rate limits, timing quirks, unexpected behavior. Do not rewrite the
steps above without asking Ochuko.