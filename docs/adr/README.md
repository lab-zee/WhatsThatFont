# Architecture Decision Records

Each ADR captures one decision, the context that forced it, and the alternatives we rejected. New ADRs are numbered sequentially. Superseded ADRs are not deleted — they're marked `Status: Superseded by NNNN`.

| #    | Title                                                     | Status   |
|------|-----------------------------------------------------------|----------|
| 0001 | [Stack selection](./0001-stack-selection.md)              | Accepted |
| 0002 | [Model choice](./0002-model-choice.md)                    | Accepted |
| 0003 | [Structured output via forced tool use](./0003-structured-output.md) | Accepted |
| 0004 | [Rate limiting approach](./0004-rate-limiting.md)         | Accepted |
| 0005 | [Font acquisition strategy](./0005-font-acquisition-strategy.md) | Accepted |
| 0006 | [Deployment target](./0006-deployment-target.md)          | Accepted |
| 0007 | [No image persistence](./0007-no-image-persistence.md)    | Accepted |
| 0008 | [Testing strategy](./0008-testing-strategy.md)            | Accepted |

## Writing a new ADR

Copy an existing file, bump the number, fill in Context / Decision / Alternatives / Consequences. Keep it short — one screen if possible. If you need more, a linked spec in `docs/` is usually the right home for the detail.
