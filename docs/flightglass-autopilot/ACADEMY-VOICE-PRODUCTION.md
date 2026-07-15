# Academy Control Room production runbook

Updated: 2026-07-15

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
- Captions stay the source of truth. Spoken `rpm` is expanded to `R P M` only
  in the provider request.

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
npm run voice:generate
```

The last two are dry runs unless both safety flags are present. Create the blind
auditions only after reviewing the dry-run count:

```powershell
npm run voice:audition -- --execute --confirm-paid-api
```

Listen only to `.voice-production/control-room-en-us-v1/blind/A.mp3` and the
other lettered files. Record a winner for clarity, trust and low fatigue before
opening `private/provenance-map.json`. Then create the selected designed voice:

```powershell
npm run voice:select -- --candidate A --execute --confirm-paid-api
```

Replace `A` with the recorded blind winner. Generate the complete resumable
pack only after that selection:

```powershell
npm run voice:generate -- --execute --confirm-paid-api
```

Raw MP3 files stay ignored under `.voice-production/`. Processed assets are
written under `assets/audio/academy/control-room-en-us-v1/`. A generated pack
manifest remains in the ignored production directory with rights and listening
statuses fail-closed.

## Acceptance and rights evidence

Generation is not release acceptance. Before copying the generated manifest to
`config/academy-voice-pack.json`:

1. save the paid-plan invoice privately;
2. record the ElevenLabs commercial-use terms URL and retrieval date;
3. record voice ID, model ID, generation dates and file hashes;
4. preserve the blind listening verdict and provenance reveal;
5. listen for every technical term, fatigue, clipping and artifacts;
6. confirm every duration/loudness/silence measurement;
7. run `npm run voice:verify:release`, `npm run copy-web` and the full Academy
   gates.

Do not set `rightsStatus` to `approved-for-distribution` or call the pack
Voice-ready until those checks and the owner-controlled rights record exist.
