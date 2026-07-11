# Lie effects on spin & friction — sourced estimates

## HONESTY NOTE (read first)

These numbers are **external estimates for the REAL-WORLD LAYER only**. The StrikeArc
simulator engine has **no lie model** and never produces these numbers. Any UI surface
showing them must be clearly labelled **"Real-world estimate — not the simulator"**.
Never blend these values into simulator output; never present them as measured.

---

## Sources table

| # | Claim | Numeric range | Source (name, year, URL) |
|---|-------|---------------|--------------------------|
| 1 | Flyer lie (light rough, grass between face and ball): iron spin drops sharply | Roughly **30–65 % less spin** across sources. Single TrackMan test: 8-iron from light rough spun ~2,469 rpm vs a normal 8-iron baseline of ~7,000–8,000 rpm (≈65 % drop). Dave Pelz's read of USGA groove research: from rough a U-groove keeps ~2× the spin of a V-groove (≈50 % loss for the low-friction case), vs only ~10 % difference from fairway — i.e. the lie, not the groove, dominates | Bryan Pate Golf TrackMan test, 2020, https://bryanpategolf.com/2020/04/01/how-does-lie-effect-the-strike/ · Dave Pelz on USGA groove research, via Into The Grain, https://www.intothegrain.com/about-the-usga-groove-rule-change/ · USGA Spin Generation reports I (2006) / II (2007), https://www.usga.org/articles/2014/01/grooves-common-questions--answers-21474861635.html |
| 2 | Flyer lie: launch goes UP with mid/short irons | ~**+2° launch** in the Bryan Pate 8-iron test; Andrew Rice: 8-iron and shorter → "higher launch and lower spin … fly significantly longer" | Bryan Pate Golf, 2020 (above) · Andrew Rice via Golf.com "What is a flier?", https://golf.com/instruction/what-is-flier-lie-golf/ |
| 3 | Flyer lie: carry/total distance goes UP (short–mid irons) | **+6 yards carry** in the Pate 8-iron test despite ~9 mph ball-speed loss; low spin also adds rollout. Longer irons (6-iron+): spin drops but launch barely changes → ball can fall short instead | Bryan Pate Golf, 2020 · Andrew Rice via Golf.com (above) |
| 4 | Wet face / wet ball: friction falls, spin drops, launch rises | TrackMan test, 54° wedge, 50-yd shots: dry/dry **6,603 rpm @ 25.4°** → wet club **5,463 rpm @ 27.8°** (−17 %) → wet ball **5,291 rpm @ 30.1°** (−20 %). Rule of thumb from the test: **≈15–20 % spin loss** on wedge shots when water is on face or ball; dry ball hurts less than wet ball | Andrew Rice, "Wedges and Water", 2013, https://www.andrewricegolf.com/andrew-rice-golf/2013/02/wedges-and-water |
| 5 | Wet conditions: every ball launches higher / spins less; cover material matters | Robot test (56° Vokey SM9): **every ball tested launched higher and spun less wet**; urethane covers retain notably more wet spin than ionomer. Wet-vs-dry groove behaviour was also a core scenario in the USGA 2006–2010 groove research that led to the 2010 groove rule | MyGolfSpy Wet Wedge Test, 2022, https://mygolfspy.com/labs/2022-wet-wedge-test/ · MyGolfSpy Golf Ball Test: Wet vs Dry Spin, 2024, https://mygolfspy.com/labs/golf-ball-test-wet-versus-dry-spin/ · USGA groove Q&A (above) |
| 6 | Clean fairway baseline ("normal") | Ball-first contact, dry face/ball, full friction. PGA Tour TrackMan averages: **7-iron ≈ 7,100 rpm**; roughly **≈1,000 rpm per iron number** as a rule of thumb (e.g. 9-iron ≈ 8,500–9,000). This is what every simulator number implicitly assumes | TrackMan PGA Tour averages, via UpYourClub summary, 2024, https://www.upyourclub.com/7-iron-launch-angle-spin-rate/ · TrackMan spin-rate blog, https://www.trackman.com/blog/golf/3-steps-to-improve-your-spin-rate-in-golf |
| 7 | Heavy/deep rough: kills ball speed instead of producing a flyer | TrackMan test: ball speed fell from **115.7 mph (fairway) → 103.7 mph (ball half-down in rough)** — a ~12 mph loss — with smash factor down **~0.14**; distance drops instead of jumping | Bryan Pate Golf TrackMan test, 2020 (above) |

Caveats: #1 and #7 rest partly on one instructor's TrackMan session (small sample); the
USGA Spin Generation report PDFs themselves are no longer directly downloadable (403),
so USGA figures are cited via secondary write-ups. Where sources disagree, the range is
shown with both named.

---

## COPY LINES (ready for the Real-world layer, always with the "not the simulator" label)

- ≈ Flyer lie: grass between face and ball cuts friction — spin can drop by a third to well over half (USGA groove research 2006–07; Bryan Pate TrackMan test, 2020)
- ≈ Flyer lie: launch typically rises ~2° with mid/short irons — the ball comes out higher AND hotter (Bryan Pate TrackMan test, 2020)
- ≈ Flyers go longer: less spin means more carry and rollout — expect the ball to fly past your normal number (Andrew Rice via Golf.com; Bryan Pate, 2020)
- ≈ Wet face or ball: friction falls — roughly 15–20 % less spin and a higher launch on wedge shots (Andrew Rice TrackMan test, 2013)
- ≈ Morning dew or rain: every ball spins less when wet; soft urethane covers hold spin best (MyGolfSpy wet wedge/ball tests, 2022–24)
- ≈ Heavy rough is different: deep grass grabs the club and kills ball speed (~10+ mph) instead of making a flyer (Bryan Pate TrackMan test, 2020)
- ≈ "Normal" assumes a clean, dry fairway lie — ball-first contact and full friction, like a 7-iron at ~7,000 rpm (TrackMan PGA Tour averages)
