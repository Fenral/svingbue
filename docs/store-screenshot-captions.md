# Store screenshot captions — StrikeArc

Generated set lives in `store-assets/` after `npm run shots`
(scripts/store-screenshots.mjs). The folder is gitignored — regenerate before
each upload so shots reflect the current UI. Sizes: iOS 6.9" 2868×1320, iOS
6.5" 2688×1242, Play phone 1920×1080, Play feature graphic 1024×500 (all
landscape).

Paste these one-liners into App Store Connect promotional text / Google Play
listing alt-captions (one per shot, order shown):

| File | Caption (alt / promo text) |
|------|-----------------------------|
| `01-impact-flight-ghosts.png` | Compare shots side by side — the live ball flight in cyan against grey "ghosts" of your previous swings, with the exact carry, curve and apex difference called out. |
| `02-impact-instrument.png` | The live D-plane instrument: drag face, path, attack and loft and watch launch direction, spin axis, curve and carry update instantly across two lenses. |
| `03-geometry-front.png` | See the swing arc in true 3D — the club, ball and low point rendered so you can read exactly where the strike happens. |
| `04-geometry-dtl.png` | Down-the-line view of the swing plane and low point, with the strike-detail inset dimensioning the ball-to-low-point distance in centimetres. |
| `05-home.png` | StrikeArc — a premium, landscape golf instrument that makes every ball-flight law visible. |
| `feature-graphic.png` (Play) | StrikeArc — see the shot before you hit it. |

Note: verify the current ASC / Play required pixel sizes before uploading; if
they change, edit only the `SETS` matrix in `scripts/store-screenshots.mjs`
and re-run `npm run shots`.
