# Academy Control Room production runbook

Updated: 2026-07-16

This runbook produces the `control-room-en-us-v1` pack with ElevenLabs at build
time. The shipping application remains offline and never calls ElevenLabs.
Provider credentials and raw provider artifacts must never enter Git.

## Fixed production scope

- 102 exact `en-US` caption cues, 1,546 words, about 10 minutes at 155 wpm.
- Three blind Voice Design directions: target Control Room, intentionally
  theatrical, and intentionally generic assistant.
- `eleven_multilingual_v2` TTS with deterministic best-effort cue seeds.
- Processed shipping assets: AAC-LC `.m4a`, mono, 48 kHz, 80 kbps, about
  -18 LUFS and at or below -1 dBTP.
- Captions stay the source of truth. Spoken `Flightglass` and `rpm` are expanded
  to `Flight glass` and `R P M` only in the provider request.

## Completed production candidate - 2026-07-16

- Blind R5-A won against the anonymous R3-D control and is selected at speed
  `0.8`.
- All 102 local masters are generated, hashed and bound into the runtime.
- Full-pack transcription QA and technical audio inspection pass; see
  `ACADEMY-VOICE-QA.md`.
- The generated full manifest is promoted to
  `config/academy-voice-pack.json`; stress-only runs never promote a partial
  manifest.
- Commercial-use evidence is recorded from the owner-confirmed Creator plan and
  current ElevenLabs terms.
- Strict release verification remains fail-closed on the five-minute fatigue,
  physical-device/audio-route and iOS VoiceOver gates.

## Credential setup — owner action

1. Create a paid ElevenLabs Creator subscription and a restricted API key with
   only the Voice Design and Text to Speech access needed for this production.
2. In the repository root, open the ignored local file with `notepad .env.local`.
3. Add one line locally: `ELEVENLABS_API_KEY=your-key-here`.
4. Never paste the key into chat, a document, a terminal transcript or Git.

Both `.env.local` and `.voice-production/` are ignored. The script reports only
whether a key exists and never prints its value.

## Safe command sequence

These commands make no paid call:

```powershell
npm run voice:inventory
npm run voice:preflight
npm run voice:audition
npm run voice:explore
npm run voice:refine -- --finalists B,E
npm run voice:pace-refine -- --candidate R3-D
npm run voice:pace-preview -- --candidate R3-D --speed 0.8
npm run voice:british-audition -- --speed 0.8
npm run voice:generate
```

The last two are dry runs unless both safety flags are present. Create the blind
auditions only after reviewing the dry-run count:

```powershell
npm run voice:audition -- --execute --confirm-paid-api
```

Listen only to `.voice-production/control-room-en-us-v1/blind/A.mp3` and the
other lettered files. Record a winner for clarity, trust and low fatigue before
opening `private/provenance-map.json`.

If two finalists cannot be separated, record their labels and run one
refinement round. This creates two temporary base voices and makes two paid
Remix calls; it does not overwrite round one:

```powershell
npm run voice:refine -- --finalists B,E
npm run voice:refine -- --finalists B,E --execute --confirm-paid-api
```

Listen only to the six files under
`.voice-production/control-room-en-us-v1/refinement-round-2/blind/`, then record
one `R2-*` winner before opening the private round-two provenance. Round two is
resume-safe and returns the existing candidates when rerun.

If the original concept still feels too generic, run the separate brand-voice
exploration. It compares Nordic Lab Lead, Flight Director and Performance
Scientist on identical copy, producing nine blinded `R3-*` candidates without
overwriting either earlier round:

```powershell
npm run voice:explore
npm run voice:explore -- --execute --confirm-paid-api
```

Listen only under
`.voice-production/control-room-en-us-v1/alternative-round-3/blind/` and record
one winner before opening its private provenance map. Rerunning the command
returns the existing candidates and makes no additional paid calls.

If one round-three identity is right but its prosody needs another design pass,
preserve it through a separate refinement. This creates one temporary base
voice and makes one paid Remix call for three blinded `R4-*` candidates:

```powershell
npm run voice:pace-refine -- --candidate R3-D
npm run voice:pace-refine -- --candidate R3-D --execute --confirm-paid-api
```

Listen only under
`.voice-production/control-room-en-us-v1/pace-refinement-round-4/blind/`.
Judge preserved identity, natural pauses, technical trust and low fatigue. The
round is resume-safe and never overwrites R3. Voice Design descriptions do not
guarantee an exact pace, so measure every output before accepting it. Record one
`R4-*` winner before opening its private provenance map.

For exact production pacing, audition the chosen identity through the same TTS
speed control used by full-pack generation. `0.8` is the current R3-D test
setting and still requires listening approval:

```powershell
npm run voice:pace-preview -- --candidate R3-D --speed 0.8
npm run voice:pace-preview -- --candidate R3-D --speed 0.8 --execute --confirm-paid-api
```

This makes one paid TTS call on the shared audition copy and writes an ignored
MP3 under `pace-refinement-round-4/speed-previews/`. It neither selects the
voice nor generates the full pack.

To challenge R3-D with a British direction, use the British Systems Engineer
round. One Voice Design call creates three identities; three TTS calls render
them at the same `0.8` speed as R3-D. All four files then pass through the same
shipping normalization before being shuffled together:

```powershell
npm run voice:british-audition -- --speed 0.8
npm run voice:british-audition -- --speed 0.8 --execute --confirm-paid-api
```

The dry run reports four paid calls and 1,356 characters. Listen only under
`.voice-production/control-room-en-us-v1/british-systems-engineer-round-5/blind/`.
Judge technical clarity, authority without distance, low fatigue and absence of
posh/BBC/assistant affect. One anonymous file is the R3-D control. Record one
`R5-*` winner before opening the private provenance map.

Create the selected designed voice from any round. If an approved pace preview
used a non-default speed, pass that same value to selection so full generation
records and reuses it:

```powershell
npm run voice:select -- --candidate A --execute --confirm-paid-api
npm run voice:select -- --candidate R2-A --execute --confirm-paid-api
npm run voice:select -- --candidate R3-A --speed 0.8 --execute --confirm-paid-api
npm run voice:select -- --candidate R4-A --speed 0.8 --execute --confirm-paid-api
npm run voice:select -- --candidate R5-A --speed 0.8 --execute --confirm-paid-api
```

Run only one of those commands and replace the example with the recorded blind
winner. Keep the two temporary finalist voices until the final voice is created;
then remove the temporary voices from the ElevenLabs account after recording
their IDs in the private provenance. Generate the complete resumable pack only
after final selection:

```powershell
npm run voice:generate -- --execute --confirm-paid-api
```

Raw MP3 files stay ignored under `.voice-production/`. Processed assets are
written under `assets/audio/academy/control-room-en-us-v1/`. A complete run
also promotes the generated manifest to `config/academy-voice-pack.json`;
stress-only or limited runs never replace the canonical config.

## Acceptance and rights evidence

Generation is not release acceptance. Before approving a release candidate:

1. retain the paid-plan account/invoice record privately;
2. record the ElevenLabs commercial-use terms URL and retrieval date;
3. record voice ID, model ID, generation dates and file hashes;
4. preserve the blind listening verdict and provenance reveal;
5. listen for every technical term, fatigue, clipping and artifacts;
6. confirm every duration/loudness/silence measurement;
7. run `npm run voice:verify:release`, `npm run copy-web` and the full Academy
   gates.

`rightsStatus` may be approved when paid-plan generation and current provider
terms are evidenced. Human fatigue, device playback and VoiceOver retain their
own fail-closed statuses and must never be inferred from automated audio QA.
