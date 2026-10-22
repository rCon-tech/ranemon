import type { Npc, Step } from '@/lib/story/world';

/**
 * Jamie Boyde, on the concourse at Connolly Station in his rugby kit: the Boydemon second look.
 * No battle and nothing to win. He has one question, and whatever you say, he does it anyway.
 */

export const BOYDE_ASKS = 'JAMIE BOYDE: Here. HERE. Should I put this pill in my ass?';
export const BOYDE_YES = 'JAMIE BOYDE: Say no more.';
export const BOYDE_NO = 'JAMIE BOYDE: Ah, you’re no craic. I’m doing it anyway.';
export const BOYDE_DOES_IT = 'Jamie Boyde puts the pill in his ass.';
export const BOYDE_AFTER = 'JAMIE BOYDE: …Thanks for the advice.';

/** Whatever you answer, it ends the same way. */
const ANYWAY: Step[] = [
  { do: 'say', text: BOYDE_DOES_IT },
  { do: 'say', text: BOYDE_AFTER },
];

export const BOYDE_TALK: Step[] = [
  {
    do: 'ask',
    text: BOYDE_ASKS,
    yes: [{ do: 'say', text: BOYDE_YES }, ...ANYWAY],
    no: [{ do: 'say', text: BOYDE_NO }, ...ANYWAY],
  },
];

export const BOYDE: Npc = { look: 'boyde', face: 'left', talk: BOYDE_TALK };
