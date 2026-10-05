# Audio direction for someone who can't compose

Audio is the highest ratio of felt-quality to effort in the whole project, and it's the thing solo devs leave until last and then ship badly or not at all. A game with eight good loops and clean sound effects feels finished. The same game silent feels like a prototype.

**Contents:** [Where to get audio](#where-to-get-audio) · [Making it yourself](#making-it-yourself) · [AI music](#ai-music-status) · [What a game needs](#what-a-game-actually-needs) · [Looping](#looping-the-part-that-goes-wrong) · [Mixing](#mixing-and-buses) · [The mistakes](#the-mistakes-in-the-order-people-make-them)

---

## Where to get audio

**Free, commercial-safe, no attribution:**

- **Ninja Adventure Asset Pack** — CC0, and it ships **37 music tracks and 100+ sound effects alongside its art**. For a project using that pack's art this is the obvious answer, because the audio and the art were made to agree with each other. Coherence beats quality here.
- **Kenney Audio** — CC0. UI clicks, impacts, footsteps, interface beeps. Clean and reliable, not enough on its own to give a game character.
- **Sonniss GDC Game Audio Bundle** — professional recorded sound effects, free, no attribution, usable in commercial projects for life. Caveat: it's film-style foley, so it needs processing to sit in a pixel game. Note the license forbids using them to train models.
- **OpenGameArt** and **Freesound**, filtered to CC0. Freesound's CC-BY-NC entries are a common trap — filter, don't browse.
- **Pixabay** — commercial use, no attribution required. Quality varies; archive a dated copy of the license terms.

**Attribution required but safe:** Incompetech (Kevin MacLeod) is CC-BY with 2,000+ tracks and is extremely safe legally, though so widely used it can read as generic. Soundimage.org is huge and explicitly game-oriented.

**Avoid for anything you'll release:**

- **YouTube Audio Library** — licensed for use *on YouTube*, not for redistribution inside a game. Common and expensive mistake.
- **Free Music Archive** and **Jamendo free tier** — mixed per-track, many non-commercial only.
- **BBC Sound Effects** — non-commercial only.
- Anything ripped from a commercial game. Same rule as art.

**Buying is unusually good value here.** A curated pack from one composer on itch.io runs $0–30, and **buying one composer's whole 20-track pack gives soundtrack coherence that no amount of free-source mixing will.** Commissioning original music runs roughly $100–500 per finished loop.

Same `CREDITS.md` discipline as art: one row per audio file, from the first one.

---

## Making it yourself

For a non-musician, this is more achievable than making art. The tools are genuinely designed for people who can't read music.

**Music: start with Bosca Ceoil Blue.** Free, open source, runs in a browser or as an app, 300+ instruments, exports WAV, MIDI and tracker modules. It's built so someone who can't read music can paint notes on a grid and get a usable game loop in an afternoon. **BeepBox** (browser) is even simpler and great for short stingers.

**Don't start with LMMS or a full DAW.** It's the right tool once Bosca Ceoil is outgrown, and it's where non-musicians go to abandon the project.

**Sound effects: jsfxr, Bfxr, or ChipTone.** Retro sound generators with a handful of buttons — pickup, hit, explosion, blip, powerup. Click randomize until something's right, tweak, export. ChipTone's output is explicitly CC0. **This is genuinely 90% of an RPG's sound effects in about two hours.**

**Audacity** for trimming, normalizing, fading and converting. It gets used constantly.

**A phone and your own mouth** is underrated for creature grunts and door creaks — record, pitch down four semitones, bitcrush.

Realistic time cost: **2–4 hours per music loop** as a beginner in Bosca Ceoil; **15 minutes per sound effect** including auditioning.

---

## AI music status

The licensing got clearer in 2025–26 and the copyright position got worse. Worth stating plainly if it comes up:

- **Free tiers of the major generators are non-commercial.** Output can't go in a game that ships.
- **Paid tiers assign whatever rights the service has — while explicitly not warranting that any copyright exists.** Read plainly: you're paying for permission to use something you may not be able to own or defend.
- **Steam and itch.io both require disclosing AI-generated content**, music included.

For a non-musician, **Bosca Ceoil plus a $20 itch pack beats AI generation on cost, coherence, legal safety and audience reception.** Say so once and move on.

---

## What a game actually needs

A 10–20 hour pixel RPG realistically ships with **8–15 music tracks and 60–120 sound effects**. The Ninja Adventure pack alone gives 37 and 100+, which tells you where the bar is.

**Area themes** — 60–90 second loops, **one per region, not per map.** Six good area themes beat twenty mediocre ones. Reuse aggressively: players read a repeated theme as *"this is the same region,"* which is information, not laziness.

**Battle themes** — one normal, one boss, optionally a final boss. Short, high-energy, and heard hundreds of times, so it must not fatigue. **If exactly one thing gets commissioned, make it this.**

**Stingers** — 1 to 4 seconds, non-looping: victory, item found, level up, defeat, quest complete. **Extremely high emotional return per second of work.** The item-get jingle is the most-remembered two seconds in some entire soundtracks. Make these in BeepBox in an afternoon.

**Safe places** — a short, calm loop for towns, inns and save points. Music doing "you're safe now" is narrative work.

**Ambience** — wind, water, cave drips. Cheap, and it's what makes an area feel like a place rather than a picture.

**Skip adaptive/layered music for v1.** Crossfading stems with tension is a lot of authoring work for a subtle effect, and it competes directly with simply having more distinct tracks. Revisit it only if audio behavior is itself a design feature.

---

## Looping: the part that goes wrong

A track that repeats forever usually has a short intro that plays once, then a body that loops — and the loop has to be sample-accurate. A 1ms gap produces an audible click every ninety seconds, forever, and it's one of the most fatiguing flaws a game can have.

**Formats:**

- **OGG Vorbis** — the right default for music. Small, good quality, widely supported, and most engines let you set a loop point on import. Test it — some engines pop at a non-zero loop offset.
- **Short WAV** for sound effects. They're small and you want zero decode latency.
- **Tracker modules** (.xm, .it) loop perfectly by construction and are tiny, but engine support is spotty.
- **Avoid MP3 for looping music.** Its frame padding makes gapless looping structurally hard, for no benefit over OGG.

**The bulletproof workaround**, engine-agnostic: author **two files — an intro and a loop** — and schedule the second to start at the exact sample the first ends. This sidesteps every engine's loop-metadata quirks. Do it for the three to five most-heard tracks and use simple full-file loops for the rest.

**Authoring the loop:** compose in whole bars, land the loop point on a downbeat, and make sure the reverb tail at the end matches what's under the loop start. The standard fix is to render the track through twice and cut one full cycle out of the middle — the tail from the first cycle naturally underlaps the head of the second.

---

## Mixing and buses

**Set up buses from the start:** Music, SFX, UI, Ambience, each under Master. Expose Music and SFX sliders in the options menu. Non-negotiable — players will complain otherwise, and retrofitting it means touching every sound in the game.

**Normalize everything before it enters the project.** The most common indie audio failure is one sound effect being 15dB louder than everything else. Normalize to a consistent peak or loudness target in Audacity as part of importing.

**Leave headroom** — the master should peak around -6dB. Games that clip sound cheap in a way players can't name.

**Ducking**, if needed: when a stinger or a cutscene cue plays, drop the music bus 4–8dB over ~150ms and restore over ~400ms. For a text-only RPG this is mostly needed for boss intros and cutscenes — don't over-engineer it.

**Standardize on 44.1kHz** across the whole project.

**Target the whole audio folder under ~150MB.** Music as OGG at moderate quality, mono where acceptable; sound effects as short 16-bit WAV.

---

## The mistakes, in the order people make them

1. **No volume sliders.** Ship-blocking for a lot of players.
2. **The identical footstep or menu blip sample on every single play.** Fix: 3–5 variants chosen at random, plus ±5% random pitch on every play. **This one trick makes amateur audio sound professional and costs twenty lines of code.** Worth building into the project's sound helper from day one so it's the default rather than something to remember — put it in the first audio build block.
3. **Audible loop seams.** See above.
4. **UI sounds too loud and too frequent.** Menu navigation blips should be *quiet*. They're heard thousands of times.
5. **Music restarting on every room transition.** Track the currently-playing theme by name; if the new area asks for the same one, do nothing.
6. **Identical sounds stacking into clipping** — ten enemies dying at once is ten times the amplitude. Limit concurrent instances of any sound to two or three, with a ~50ms cooldown per sound.
7. **Hard cuts with no fade** on scene changes. Fade out over 0.3–1.0s, always. Crossfade area-to-battle over ~0.5s, or mask the cut with a one-second stinger.
8. **Mixing sample rates and bit depths** across the project.
9. **Not testing on laptop speakers.** Everything mixed on headphones will have inaudible bass and harsh mids. Test on the worst speaker in the house.
10. **Licensing debt.** The `CREDITS.md` row goes in when the file does.

**Middleware (FMOD, Wwise) is not needed here.** Engine-native audio handles "play a sound on an event, crossfade music sometimes" fine. Adopt it only if audio behavior is itself a design feature — and if so, adopt it early, because retrofitting is expensive.
