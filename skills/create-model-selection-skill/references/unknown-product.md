# A product pstack has no adapter for

Work read-only. Do not log in, install, or write that product's config.

1. Run `<command> --help`. Find how to start it with a prompt and no interaction, how to choose a model, and any command that lists models.
2. Find where it keeps its model list (a cache or config file under its home folder). Read it. Record each model and its efforts.
3. Show the user what you found and ask them to confirm the model ids and the non-interactive start command. Do not guess.
4. Start one read-only job with a trivial brief. Record the model it reports.
5. Write its section in `inventory.md`. Its first line is `No adapter: pstack has no adapter for this product.` Its "Start from here" holds the start command the user confirmed, because no adapter holds it. Write nothing under `select-model/references/`.
6. Offer once to draft an adapter for it from the contract's template, `../resolve-capability/references/adapter-template.md`, filled with what you learned. An adapter ships with pstack, so it lands as a change to pstack, not in the installed copy. On yes, write the draft to a `mktemp -d` folder and give the user its path. On no, move on.

If it cannot start without interaction, record it as `installed, not startable from here`.

## Skill folder

Do not guess a folder for a product with no adapter. Ask the user where it lists skills from. If they do not know, make no link.
