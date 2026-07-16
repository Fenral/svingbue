# Academy Voice QA - R5-A production pack

Updated: 2026-07-16

## Result

The Academy Voice source implementation is complete for
`control-room-en-us-v1`. The owner selected blind candidate R5-A, a mature
British female systems-engineer direction, against the anonymous R3-D control.
The selected identity is rendered at ElevenLabs TTS speed `0.8` with
`eleven_multilingual_v2`.

The application ships 102 local prerecorded masters. It never calls ElevenLabs
at runtime. Captions remain the visible and accessible source of truth.

## Selection evidence

- Blind winner: `R5-A`.
- Anonymous comparison control: `R5-D`, revealed after selection as R3-D.
- Selection criteria: technical clarity, authority without distance, restrained
  warmth, low fatigue and absence of posh/BBC/assistant affect.
- Production direction: neutral contemporary Southern British accent, grounded
  lower-middle register, calm authority and precise technical diction.
- The already-created R5 audition identity was reused during selection; no
  duplicate Voice Design identity was created.
- The provider request expands spoken `Flightglass` to `Flight glass` and `rpm`
  to `R P M`; the caption and displayed brand remain unchanged.

The blind verdict and provider provenance remain ignored under
`.voice-production/control-room-en-us-v1/`. Provider credentials and raw MP3s
are not committed.

## Asset and audio evidence

- Cue records: 102.
- Unique cue IDs, paths and SHA-256 hashes: 102 each.
- Missing or orphaned files: 0.
- Total duration: 605.439 seconds.
- Per-cue duration: 3.453-8.1 seconds.
- Integrated loudness: -19.75 to -17.56 LUFS.
- Maximum true peak: -1.36 dBTP.
- Maximum leading/trailing silence: 70/142 ms.
- Shipping size: 6,471,074 bytes.
- Format: AAC-LC `.m4a`, mono, 48 kHz, 80 kbps.

Two 8.1-second cues have explicit reviewed exceptions in the canonical manifest:

- `academy.contact-height.s2.entry` keeps one complete technical sentence with
  no removable pause or redundant wording.
- `academy.plane-coupling.s0.entry` keeps the model-boundary warning and the
  explicit `Flight glass` pronunciation intact.

All other cues are within the normal 3-8 second contract.

## Pronunciation and transcription evidence

Eight stress cues covered the brand, `rpm`, degrees, decimals, plus/minus
values, technical boundaries and cues from separate modules. The two brand
cues were regenerated after the first independent transcription exposed an
ambiguous compound-word pronunciation. Both then transcribed as `Flight Glass`.

Faster-Whisper `tiny.en` decoded and screened all 102 shipping files. Six were
rechecked with `small.en`; the recheck confirmed the intended numbers `7.5`,
`7.4` and `13.28`, `Air layer`, the British spellings `modelled`/`centred`, and
meaning-preserving word-boundary variants such as `Ahead`/`A head`. No confirmed
wrong number, technical term, brand pronunciation or changed claim remained.

This automated transcript review is evidence for content and pronunciation. It
does not replace the pending five-minute human fatigue listen.

## Runtime and packaging evidence

- `defineAcademyCueSet()` binds every authored null asset to one deterministic
  local master path.
- The pack verifier rejects remote/escaping paths, missing files, wrong hashes,
  wrong caption hashes, unreviewed duration outliers, orphan records and a
  valid local file rebound to the wrong runtime cue.
- `npm run voice:verify`: PASS, 102/102, no errors.
- `npm run test:academy-voice`: PASS, 36/36.
- Academy foundation: PASS, 241/241.
- The complete Chromium Academy browser/model file set passes. Because the
  combined shell exceeded its 15-minute wrapper budget, Home, Backspin and the
  remaining 13 modules were run as the same unchanged files in clean sequential
  processes.
- The complete WebKit Academy browser set passes: Home 6/6, Backspin 41/41 and
  all 13 remaining module files. One long-lived Backspin worker accumulated
  browser resources on this Windows runner; the same 41 unchanged assertions
  passed in fresh WebKit workers (first 6, isolated axe, and 34/34 across nine
  named chunks).
- `npm run copy-web`: PASS.
- Root and `www/` contain 102 masters each with zero SHA-256 mismatch; the
  runtime manifest is also byte-identical.

`npm run voice:verify:release` intentionally fails closed only on:

- `fatigue-listen-not-approved`;
- `device-playback-not-approved`;
- `voiceover-not-approved`.

These are human/physical-device release gates, not missing voice code or assets.

## Commercial-use evidence

The owner confirmed an ElevenLabs Creator paid plan before generation. The
production model is not marked as a Beta Service. Flightglass owns the input
cue copy and uses a generated Voice Design identity rather than a cloned
third-party voice.

Official sources retrieved 2026-07-16 state that paid-plan output has commercial
usage rights and that output generated during a paid subscription remains
commercially usable after the subscription ends:

- https://elevenlabs.io/terms-of-use
- https://elevenlabs.io/docs/overview/administration/billing
- https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform
- https://help.elevenlabs.io/hc/en-us/articles/15993008593297-What-happens-to-my-content-after-my-subscription-ends

The restricted production key permits Voice Design and Text to Speech but not
`user_read`, so subscription introspection is deliberately unavailable through
that key. No key, invoice, raw provider response or private account record is
stored in Git.

## Remaining release-only work

Before an App Store/Play Store release candidate can pass the strict verifier,
an owner must complete and record:

1. one continuous five-minute fatigue listen;
2. physical-device playback, offline and audio-route/interruption checks; and
3. iOS VoiceOver behavior with Voice on, Captions and Voice off.

The repository still has no `ios/` or `android/` platform project, so these
checks and signed native archives cannot be produced in this worktree.
