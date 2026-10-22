import type { Npc, Step } from '@/lib/story/world';

/**
 * Jamie Boyde, on the concourse at Connolly Station in his rugby kit: the Boydemon second look.
 * No battle and nothing to win. He has one question, and whatever you say, it's the wrong answer.
 */

export const BOYDE_ASKS = 'JAMIE BOYDE: Here. HERE. Should I put this pill in my ass?';
export const BOYDE_YES =
  'JAMIE BOYDE: Absolutely not. What is wrong with you? I’m telling your mam.';
export const BOYDE_NO = 'JAMIE BOYDE: The ear, so? …No? Grand. I’ll ask the clerk.';

export const BOYDE_TALK: Step[] = [
  {
    do: 'ask',
    text: BOYDE_ASKS,
    yes: [{ do: 'say', text: BOYDE_YES }],
    no: [{ do: 'say', text: BOYDE_NO }],
  },
];

export const BOYDE: Npc = { look: 'boyde', face: 'left', talk: BOYDE_TALK };
