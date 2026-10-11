# Contributing

Thanks for looking. Three kinds of contribution help most. Each has a short rule so the result stays usable by the model.

## 1. A trace

The most welcome pull request is one new trace. One is enough.

A trace is a mark someone or something carries, plus the causes that could have left it. The library lives in `src/traces/*.ts` and is the single source for both the skill (`skills/holmes/references/*.md` are generated from it) and the web version.

```ts
// src/traces/person.ts
{
  id: 'hands.string-callus',
  domain: 'hands',
  zh: '一只手四个指尖有硬茧，另一只手没有',
  en: 'Hard calluses on four fingertips of one hand only',
  causes: [
    { zh: '弹弦乐器：吉他、贝斯、尤克里里、二胡', en: 'Plays a string instrument: guitar, bass, ukulele, erhu', weight: 'strong' },
  ],
  source: 'common',
}
```

Rules:

- **At least one cause.** More are better when they genuinely compete.
- **Honest weights.** `strong` means you would bet on it; if you are unsure, use `weak`.
- **Marks from what people did, never how they were born.** Faces, body shape, age, ethnicity and health do not go in. A guard in `pnpm test` rejects entries that cross the line.
- **Both languages.** Write `zh` and `en`. If you only speak one of them, write that one well and say so in the pull request; a maintainer will fill in the other.
- **`region` only when the base rate is local.** Leave it out when the trace holds anywhere. The allowed values are in `src/traces/types.ts`.
- **`source`** is `common`, or the story or episode a canonical trace comes from.

Then regenerate the skill's reference files and run the checks:

```bash
pnpm install
pnpm build:skill   # src/traces/*.ts → skills/holmes/references/*.md
pnpm test          # schema, the safety guard, and whether the generated files are in sync
```

## 2. A reading that went wrong

Open an issue with the case file the skill produced, your grades, and the first line that went wrong. Say which kind it was:

- **an observation that is not in the photo.** This is the serious kind: every conclusion that cites it is void.
- **a conclusion that went further than its marks.** The observations were right and the reasoning overreached. The time-scope rule in `SKILL.md` came from exactly this.

Post the photo only if it is yours and you are happy for it to be public. A description of it works too.

## 3. A rule change

Changes to `skills/holmes/SKILL.md` or to the web prompts in `src/pipeline/prompts.ts` should come with the case that motivated them: the case file, the grade, and why the current rule let it through. Keep the two in step; a rule added to one belongs in the other.

## House rules

- Never add anything that identifies a real person or a private home.
- Run the skill on photos you took yourself, or on photos of people who agreed.
- Keep `SKILL.md` short and move long material into `references/`.

## Translations

`README.md` is the source of truth. When you change it, `README.zh-CN.md` should keep the same structure, the same images and the same numbers. A translation that only updates one section is still welcome.
