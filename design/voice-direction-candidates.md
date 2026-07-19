# Academy voice — direction candidates & decision

Independent voice-direction exploration for the StrikeArc / Flightglass Academy
(control-room / telemetry teaching voice). Ten build-ready ElevenLabs
voice-design directions across five archetypes, generated and auditioned
2026-07-19.

**Decision (2026-07-19, FINAL): owner adopted `LAB-2 — Lab Lead`** — a female
cinematic lab/facility-announcer voice (neutral General American, calm composed
authority, restrained warmth, 145–152 wpm, 300 ms pauses). Chosen from a later
shortlist after also exploring golf-commentator and 3-accent commentator sets.
An earlier pick, `4A — Veteran Teaching Pro`, was generated then rejected.

LAB-2 is now generated into the pack: voiceId `MDUwfjJSs3Jk4m7TC8BK`,
ttsSpeed 0.95, all 102 masters regenerated, config + script metadata updated,
`voice:verify` green, 244/244 tests green. **Human gates (fatigue / device /
VoiceOver) still pending** — release gate stays fail-closed until then.

The 10 directions below are the original neutral/control-room board and remain a
useful reference; the winning LAB-2 direction came from the separate female
lab-announcer set.

## What the job requires
- Low listener fatigue over 100+ short cues → grounded mid-low register, dry close-mic.
- Authority without ego — expert beside the player, not coach/broadcaster.
- Precise physics teaching → crisp consonants, real inter-sentence pauses.
- Phone playback at low volume → carrying, never breathy/intimate.
- Internationally legible accent · distinct brand asset · consistent over time.

## The ten directions

| ID | Name | Gender/accent | Register / wpm / pause | Build direction |
|----|------|---------------|------------------------|-----------------|
| 1A | Capsule Comm | neutral-gender en-US | mid / 150–155 / 250 ms | Adult neutral-gender General American mission-control communicator. Even mid register, dry close-mic, minimal affect, 150–155 wpm, clean 250 ms full-stop pauses. Exact and unflappable. Never theatrical, breathy, chirpy, coachy or assistant-like. |
| 1B | Deep Console | neutral/male en-US | dark / 148–153 / 280 ms | Adult low-register General American flight director, dark and grounded. Slow deliberate gravitas, 148–153 wpm, 280 ms full-stop pauses, warm authority under restraint. Never dramatic, gravelly, paternal or synthetic. |
| 2A | Biomechanist | female en-US | mid-low / 155–162 / 200 ms | Adult female biomechanics scientist, General American, cool analytical clarity. Grounded mid-low register, crisp diction, 155–162 wpm, 200 ms full-stop pauses, curiosity without warmth-forwardness. Never chirpy, intimate, coachy or assistant-like. |
| 2B | Range-side Scientist | female en-US | mid / 150–156 / 230 ms | Adult female golf performance scientist, General American, restrained humane warmth. Grounded mid register, 150–156 wpm, natural 230 ms full-stop pauses, observant and encouraging without hype. Scientist beside the player — never a coach, broadcaster or intimate narrator. |
| 3A | Southern Systems Lead | male S. British | mid-baritone / 158–164 / 230 ms | British man 40–55, neutral contemporary Southern British, mid-baritone. Dry systems-engineer authority, brisk 158–164 wpm, clean 230 ms full-stop pauses, understated. Never posh, BBC-like, professorial, cinematic or synthetic. |
| 3B | Northern Instrumentation Engineer | male N. British | dark / 152–158 / 260 ms | British man 42–56, softened modern Northern England accent, dark low baritone. Grounded instrumentation-engineer calm, 152–158 wpm, 260 ms full-stop pauses, quiet grit and warmth. Never folksy, broad, chatty, broadcaster-like or synthetic. |
| **4A** | **Veteran Teaching Pro** ✅ | **male en-US** | **baritone / 150–156 / 230 ms** | **Mature American man 48–58, neutral General American, clean baritone. Plain veteran-teacher clarity, controlled warmth, 150–156 wpm, 230 ms full-stop pauses. Never motivational, sports-broadcast, gravelly or paternal.** |
| 4B | Quiet Technician | male en-US | mid / 156–162 / 200 ms | Adult American man 32–42, neutral General American, matter-of-fact and clipped. Dry technical precision, minimal warmth, 156–162 wpm, 200 ms full-stop pauses. Never chatty, coachy, energetic-salesy or robotic. |
| 5A | Nordic Lab Lead | female Nordic | low-mid / 150–156 / 240 ms | Adult female Nordic laboratory lead, near-native international English, faint Scandinavian cadence, low-middle register. Minimalist, precise, calm, 150–156 wpm, 240 ms full-stop pauses. Distinctly human — never strongly accented, breathy, intimate, theatrical or assistant-like. |
| 5B | Nordic Systems Voice | male Nordic | dark / 150–155 / 250 ms | Adult male Nordic engineer, near-native international English, faint Scandinavian cadence, dark low register. Spare, exact, unhurried, 150–155 wpm, 250 ms full-stop pauses. Never strongly accented, monotone, coachy, trailer-like or synthetic. |

Auditioned via `/v1/text-to-voice/create-previews` on the standard audition
copy (`AUDITION_LINES`), internal pauses preserved. Previews are ephemeral —
generated_voice_ids were not persisted, so re-running yields a near (not
byte-identical) 4A.

## Adoption path (to make 4A the shipped voice)
1. Persist a chosen 4A preview as a real ElevenLabs voice (needs its generated_voice_id).
2. Validate 4A on real multi-sentence lesson cues before committing.
3. Extend the select/generate pipeline (today hardwired to the R2–R5 lineage;
   rejects board labels and hardcodes female British/American metadata).
4. Re-record all 102 masters with 4A (~102 paid calls, ~9454 chars) + FFmpeg normalize.
5. Regenerate `config/academy-voice-pack.json` (new audio sha256 + provider voiceId).
6. Update the `blindWinner:'R5-A'` references in code + the two voice-pack tests.
7. Re-run the human approval gates (blind winner, fatigue, device, VoiceOver).
