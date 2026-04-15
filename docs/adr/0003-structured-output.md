# ADR-0003: Structured Output via Forced Tool Use

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

The model must return data the UI can render without parsing prose. Options for forcing structure in Claude:

1. Ask for JSON in the prompt and parse it.
2. Use Anthropic's **tool use** feature with a tool whose input schema is the desired output shape, and force the model to call it.
3. Use the **JSON mode / structured output** feature when available.

We also need to validate whatever we get — the model can still deviate — and we need a retry strategy.

## Decision

- Define a single tool `report_fonts` whose `input_schema` is the full output shape described in [`prompt-spec.md`](../prompt-spec.md).
- Set `tool_choice: { type: "tool", name: "report_fonts" }` to force the call.
- The system prompt reinforces "Do not reply with prose. Call the tool."
- Validate the tool-call input server-side with Zod.
- On schema validation failure, retry **exactly once** with a corrective user message appended ("Your last response did not match the required schema. Call the tool again."). A second failure returns `502 model_error` to the client.

## Alternatives considered

### A. Prompt-and-parse JSON

Works but leaks: models sometimes emit Markdown code fences, trailing prose, or truncate mid-object. Every production JSON parser of LLM output eventually grows a pile of regexes. Tool use avoids the whole category.

### B. Unlimited retries on schema failure

Rejected. Bounded cost is more important than squeezing out the last few percentage points of success rate. One retry is plenty in practice; repeated failures indicate a prompt-level problem we should see in logs.

### C. Let the model return free-form prose and have a second LLM call extract structure

Double the cost, double the latency, and introduces a second failure point. No.

## Consequences

- **Pro**: Extremely reliable structured output. Zod then acts as a typed boundary between the model and the rest of the code.
- **Pro**: The same Zod schema generates the TypeScript types used on the frontend — single source of truth.
- **Con**: Tool-use responses are slightly more tokens than equivalent JSON prompts (tool names, wrapping). Worth it.
- **Con**: If the model emits a "I can't do this" refusal instead of a tool call, we must handle that explicitly. The retry logic does.
