import Link from 'next/link';
import { Sprite } from '@/components/Sprite';
import { TypeBadge } from '@/components/TypeBadge';
import { ROSTER } from '@/lib/battle/roster';
import { variantForm, variantsOf } from '@/lib/battle/variants';

export const metadata = { title: 'Ranedex' };

export default function Ranedex() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <div className="-mx-3 -mt-3 flex items-center justify-between border-b-4 border-bezel bg-dex px-3 py-2 text-[18px] font-bold text-paper [text-shadow:1px_1px_0_rgb(0_0_0/0.4)]">
        <h1>RANEDEX</h1>
        <Link href="/" className="text-[11px] underline underline-offset-4">
          BACK
        </Link>
      </div>
      <p className="text-[11px]">Tap a Ranemon for its page.</p>
      <ol className="flex flex-col gap-2">
        {ROSTER.map((c, i) => (
          <li key={c.id}>
            <Link href={`/ranedex/${c.id}`} className="dialog flex items-center gap-3 p-2">
              <span className="h-14 w-14 shrink-0 rounded-lg border-2 border-frame bg-mist p-1">
                <Sprite creature={c} />
              </span>
              {/* Its other looks: the same Ranemon in another photo. */}
              {variantsOf(c.id).map((v) => (
                <span
                  key={v.id}
                  className="h-14 w-14 shrink-0 rounded-lg border-2 border-frame bg-mist p-1"
                  title={`${c.name} (${v.label})`}
                >
                  <Sprite creature={variantForm(c, v.id)} />
                </span>
              ))}
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-[11px] opacity-60">No.{String(i + 1).padStart(3, '0')}</span>
                <span className="text-[15px]">{c.name}</span>
                <span className="flex gap-1">
                  {c.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </span>
              </span>
              <span aria-hidden="true">▶</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
