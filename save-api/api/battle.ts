import { battleCall } from '../gen/battle.js';
import { serve } from '../serve.js';

/** Friend battles. `gen/battle.js` is built from the game's code by `npm run build`. */
export const POST = (req: Request) => serve(req, battleCall);
export const OPTIONS = (req: Request) => serve(req);
