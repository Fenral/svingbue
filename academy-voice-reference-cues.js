import { ACADEMY_VOICE_LOCALE, ACADEMY_VOICE_PACK_ID, defineAcademyCueSet } from './academy-voice-manifest.js';

const base = { packId:ACADEMY_VOICE_PACK_ID, locale:ACADEMY_VOICE_LOCALE, contentVersion:1, surfaceId:'academy-home', autoplay:true, interruptions:['route','foreground-loss','model-input'], asset:null };

export const ACADEMY_HOME_CUES = defineAcademyCueSet({ ownerId:'academy-home', cues:[
  { ...base, cueId:'academy.home.orient', job:'orient', trigger:'surface-entry', text:'Choose the outcome you want to control. Flightglass will connect the important inputs and remember the evidence you earn.', beats:[{ targetId:'home-goal-chooser', atMs:0, emphasis:'outline' }] },
  { ...base, cueId:'academy.home.recommendation.first', job:'cue', trigger:'recommendation-first', text:'Your next experiment is ready. The recommendation follows from the evidence you have already earned.', beats:[{ targetId:'home-primary-action', atMs:0, emphasis:'outline' }] },
  { ...base, cueId:'academy.home.mastery-return', job:'consequence', trigger:'mastery-first', text:'That evidence is saved. Your next recommendation now follows from the outcome you just mastered.', beats:[{ targetId:'home-mastery-evidence', atMs:0, emphasis:'static-label' },{ targetId:'home-primary-action', atMs:1800, emphasis:'outline' }] }
] });

const backspinBase = { packId:ACADEMY_VOICE_PACK_ID, locale:ACADEMY_VOICE_LOCALE, contentVersion:1, autoplay:true, interruptions:['route','foreground-loss','model-input'], asset:null };
export const ACADEMY_BACKSPIN_CUES = defineAcademyCueSet({ ownerId:'backspin', cues:[
  { ...backspinBase, cueId:'academy.backspin.s0.entry', surfaceId:'backspin-s0', job:'orient', trigger:'surface-entry', text:'Backspin is an outcome. Build the face-to-travel gap, then see how Ball Speed scales it.', beats:[{targetId:'backspin-spin-loft-chain',atMs:0,emphasis:'connector'},{targetId:'backspin-ball-speed',atMs:2200,emphasis:'outline'}] },
  { ...backspinBase, cueId:'academy.backspin.s1.entry', surfaceId:'backspin-s1', job:'cue', trigger:'surface-entry', text:'Dynamic Loft minus Attack forms simplified Spin Loft. Ball Speed multiplies that modeled gap.', beats:[{targetId:'backspin-spin-loft-chain',atMs:0,emphasis:'connector'},{targetId:'backspin-raw-rpm',atMs:2100,emphasis:'static-label'}] },
  { ...backspinBase, cueId:'academy.backspin.s1.build', surfaceId:'backspin-s1', job:'consequence', trigger:'proof-first', text:'The gap is larger. Check whether Ball Speed and the rpm clamp changed the final result.', beats:[{targetId:'backspin-raw-rpm',atMs:0,emphasis:'static-label'},{targetId:'backspin-clamp-state',atMs:1900,emphasis:'outline'}] },
  { ...backspinBase, cueId:'academy.backspin.s1.cut', surfaceId:'backspin-s1', job:'consequence', trigger:'proof-first', text:'A smaller gap lowers raw rpm. The clean, centered strike assumption has not changed.', beats:[{targetId:'backspin-raw-rpm',atMs:0,emphasis:'static-label'},{targetId:'backspin-held-assumption',atMs:1800,emphasis:'outline'}] },
  { ...backspinBase, cueId:'academy.backspin.s2.entry', surfaceId:'backspin-s2', job:'cue', trigger:'surface-entry', text:'Spin Loft is the direct geometric lever here. Ball Speed scales it; real friction remains outside the engine.', beats:[{targetId:'backspin-influence-roles',atMs:0,emphasis:'connector'}] },
  { ...backspinBase, cueId:'academy.backspin.s3.boundary', surfaceId:'backspin-s3', job:'consequence', trigger:'proof-first', text:'Real spin changes flight. Flightglass does not feed this Backspin number back into its current trajectory fit.', beats:[{targetId:'backspin-model-boundary',atMs:0,emphasis:'connector'}] },
  { ...backspinBase, cueId:'academy.backspin.s4.entry', surfaceId:'backspin-s4', job:'cue', trigger:'surface-entry', text:'Hit both gates in one live state: the Backspin window and Landing Angle of at least fifty degrees.', beats:[{targetId:'backspin-mastery-gates',atMs:0,emphasis:'outline'}] },
  { ...backspinBase, cueId:'academy.backspin.s5.pass', surfaceId:'backspin-s5', job:'consequence', trigger:'mastery-first', text:'You built the requested Backspin state. Next, explain Apex and descent without promising stopping distance.', beats:[{targetId:'backspin-next-preview',atMs:0,emphasis:'outline'}] }
] });

export function homeCue(id) { return ACADEMY_HOME_CUES.cues.find(cue => cue.cueId === id) || null; }
