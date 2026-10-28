import { seshCall } from '../gen/sesh.js';
import { serve } from '../serve.js';

/** The Sesh's boards. `gen/sesh.js` is built from the game's code by `npm run build`. */
export const POST = (req: Request) => serve(req, undefined, seshCall);
export const OPTIONS = (req: Request) => serve(req);
