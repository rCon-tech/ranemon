import { describe, expect, it } from 'vitest';
import { startBattle } from '@/lib/battle/engine';
import { MOVES } from '@/lib/battle/moves';
import { areaSong, battleCues, battleSong, lineCues } from '@/lib/sound/cues';
import { barsOf, chordOf, compile, freqOf, midiOf } from '@/lib/sound/music';
import { getSoundMode, nextSoundMode, setSoundMode, subscribeSound } from '@/lib/sound/settings';
import { cryOf, moveSfx, SFX } from '@/lib/sound/sfx';
import { JINGLES, SONGS } from '@/lib/sound/songs';
import { reduce, startSession, type Session } from '@/lib/ui/session';
import { STARTERS } from '../fixtures/placeholders';

const ALL = { ...SONGS, ...JINGLES };

describe('music', () => {
  it('reads notes and chords', () => {
    expect(midiOf('C4')).toBe(60);
    expect(midiOf('F#5')).toBe(78);
    expect(midiOf('Bb3')).toBe(58);
    expect(freqOf(midiOf('A4'))).toBe(440);
    expect(chordOf('Am')).toEqual({ root: 9, tones: [0, 3, 7] });
    expect(chordOf('Bbmaj7').root).toBe(10);
  });

  it.each(Object.entries(ALL))('%s has whole bars that line up with its chords', (_, song) => {
    const lead = barsOf(song.lead);
    const chords = barsOf(song.chords);
    expect(lead.length).toBe(chords.length);
    for (const bar of [...lead, ...chords, ...barsOf(song.drums ?? '')]) {
      expect(song.bar % bar.length, bar.join(' ')).toBe(0);
    }
    const c = compile(song);
    expect(c.length).toBe(lead.length * song.bar);
    const notes = c.steps.flat();
    expect(notes.some((n) => n.voice === 'lead')).toBe(true);
    expect(notes.some((n) => n.voice === 'bass')).toBe(true);
    for (const n of notes) {
      expect(n.step + n.len).toBeLessThanOrEqual(c.length);
      if (n.voice !== 'drum') expect(freqOf(n.midi)).toBeGreaterThan(80);
    }
  });

  it('holds a note through its dashes', () => {
    const c = compile({
      ...SONGS.title,
      lead: 'C5 - - - . . . . | . . . . . . . .',
      chords: 'C | C',
    });
    const lead = c.steps.flat().filter((n) => n.voice === 'lead');
    expect(lead).toEqual([{ step: 0, len: 8, voice: 'lead', midi: 72 }]);
  });

  it('loops the themes and plays the jingles once', () => {
    for (const s of Object.values(SONGS)) expect(s.loop).toBe(true);
    for (const s of Object.values(JINGLES)) expect(s.loop).toBe(false);
  });
});

describe('sound setting', () => {
  it('cycles music and effects, effects only, off', () => {
    expect(nextSoundMode('on')).toBe('sfx');
    expect(nextSoundMode('sfx')).toBe('off');
    expect(nextSoundMode('off')).toBe('on');
    let heard = 0;
    const stop = subscribeSound(() => heard++);
    setSoundMode('off');
    expect(getSoundMode()).toBe('off');
    setSoundMode('on');
    stop();
    expect(heard).toBe(2);
  });
});

describe('sound cues', () => {
  it('has an effect for every type of move', () => {
    for (const m of MOVES) {
      expect(SFX[moveSfx(m.type, m.category === 'status', !!m.signature)]).toBeTypeOf('function');
    }
  });

  it('gives every Ranemon a cry of its own', () => {
    const cries = new Set(STARTERS.map((c) => JSON.stringify(cryOf(c.id))));
    expect(cries.size).toBe(STARTERS.length);
  });

  it('plays a sound for the moves, hits and faints of a battle', () => {
    let s: Session = startSession(
      startBattle([STARTERS.slice(0, 2), STARTERS.slice(2, 4)] as [never, never], 3),
      'normal',
    );
    const heard = new Set<string>();
    for (let i = 0; i < 2000 && s.mode !== 'over'; i++) {
      const before = s.played;
      s =
        s.mode === 'playing'
          ? reduce(s, { type: 'step', random: i })
          : reduce(s, { type: 'act', action: { kind: 'move', index: 0 }, random: i });
      if (s.mode === 'forced-switch') {
        const to = s.state.teams[0].battlers.findIndex(
          (b, j) => b.hp > 0 && j !== s.state.teams[0].active,
        );
        s = reduce(s, { type: 'replace', to });
      }
      if (s.played > before && s.last) {
        for (const c of battleCues(s.last, s.state, s.view))
          heard.add('sfx' in c ? c.sfx : 'cry' in c ? 'cry' : c.jingle);
      }
    }
    expect(s.mode).toBe('over');
    expect(heard).toContain('send');
    expect(heard).toContain('cry');
    expect(heard).toContain('faint');
    expect([...heard].some((h) => h.startsWith('hit') || h === 'crit')).toBe(true);
  });

  it('knows the story lines worth a jingle', () => {
    expect(lineCues('You got a Blue Ghost!')).toEqual([{ jingle: 'item' }]);
    expect(lineCues('Conemon grew to Lv12!')).toEqual([{ jingle: 'level' }]);
    expect(lineCues('You got €90 for winning!\nConemon grew to Lv12 and learned Fry Up!')).toEqual([
      { jingle: 'level' },
    ]);
    expect(lineCues('Your Ranemon are fighting fit again!')).toEqual([{ jingle: 'heal' }]);
    expect(lineCues('Gotcha! Conemon finished the pint and joined you!')).toEqual([
      { jingle: 'caught' },
    ]);
    expect(lineCues('Sip… sip…')).toEqual([{ sfx: 'sip' }]);
    expect(lineCues('Norm found something!')).toEqual([{ sfx: 'bark' }]);
    expect(lineCues('Lovely day.')).toEqual([]);
  });

  it('picks the music for each place and battle', () => {
    expect(areaSong('clare', 'clare')).toBe('route');
    expect(areaSong('clare-P0', 'clare')).toBe('pub');
    expect(areaSong('limerick-G0', 'limerick')).toBe('gym');
    expect(areaSong('clare-H0', 'clare')).toBe('home');
    expect(areaSong('dublin', 'dublin')).toBe('city');
    expect(areaSong('dublin-L0', 'dublin')).toBe('city');
    expect(battleSong('field', true, null)).toBe('wild');
    expect(battleSong('city', false, 'someone')).toBe('trainer');
    expect(battleSong('gym', false, 'leader')).toBe('leader');
    expect(battleSong('night', false, 'bns')).toBe('boss');
    expect(battleSong('field', false, 'poseidon')).toBe('boss');
  });
});
