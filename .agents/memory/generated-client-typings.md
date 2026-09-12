---
name: Generated client typings
description: TypeScript library requirements for generated browser API clients.
---

Generated API clients can use iterable browser APIs such as `Headers.entries()`. Keep `dom.iterable` enabled anywhere the generated browser client is compiled.

**Why:** The generated client compiled successfully only after the shared client package included the iterable DOM library; the OpenAPI codegen itself does not add that compiler setting.

**How to apply:** When codegen introduces `Headers.entries()` or similar DOM iterable errors, update the client package's `lib` list rather than editing generated output.