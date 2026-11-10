# Template for an adapter

An adapter holds everything pstack knows about one product. Copy the block below into `adapters/<id>/adapter.md`, where `<id>` is the product's agent id in the `skills` CLI when it has one. An environment also gets `adapters/<id>/detect.sh`, which exits 0 when the environment is here. Long procedures go in `adapters/<id>/references/` and are read on first use.

Fill every `<slot>`. Drop a section that does not apply to this kind of adapter, and keep the order of the rest. Mark each mechanism with what was seen: the date and the product version when it ran, or `(unverified)` when it did not. Never write a flag, a path, or a model that nothing on a real computer showed.

An adapter names its own product and no other, and no file outside it names its product. The repository's ownership check enforces both with the tokens in `owns`. The one exception is an environment's Launching harnesses section, which names the harnesses it starts.

````markdown
---
kind: <harness | environment>
owns: [<each name, tool, path, or variable that only this adapter may contain>]
---

# <Product>

<An environment: the version the facts were checked on, and what it adds to the harnesses it runs.>

## Detect

<A harness: what in a session's own tool list and instructions shows that it runs in this product. An environment: the shell check that detect.sh runs, written out.>

## Capabilities

### `<a capability from the index in ../../SKILL.md>`

<The mechanism and its verified state. In an environment the body starts with `Overrides.` or `Adds to.` and says when the harness's own mechanism still applies. Leave out a capability this product does not do: the index's fallback covers it.>

## Start me from outside

<A harness only. The headless command another session runs to start this product as a worker, its model and effort flags, its read-only mode, any input it needs, where the answer lands, and where its session record is.>

## Launching harnesses

<An environment only. How it starts a worker, an id map for each harness whose id here differs from its adapter id, and the quirks seen in runs, keyed by this environment's id.>

## Surfaces

<A harness only. Each desktop app or other surface, and what it adds.>

## For users

<The `skills` CLI id, how a user types a skill, whether the product loads a skill from its description, the skills documentation, and its plan mode.>

## Survey

<What the generator of `select-model` reads for this product. A harness: how to tell it is installed, where its models and efforts are listed, its skill folder or that it needs none, where a model is pinned, and what it is suited to, without ranking other products. An environment: what it adds to the survey, and each question the generator asks when it is here, with the options.>

## Exact steps

<Only a step that differs in this product. Each heading matches a heading in ../../references/exact-steps.md, or starts with `New.`>

## Limits

<What the product cannot do or report: remaining usage, a permission prompt, a setting it may ignore.>
````
