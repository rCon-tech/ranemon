import Link from 'next/link';
import { UPDATES } from '@/content/updates';
import { MarkSeen } from './MarkSeen';

export const metadata = { title: 'Updates' };

const DAY = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Updates() {
  const days = [...new Set(UPDATES.map((u) => u.date))];
  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <MarkSeen />
      <div className="-mx-3 -mt-3 flex items-center justify-between border-b-4 border-bezel bg-dex px-3 py-2 text-[18px] font-bold text-paper [text-shadow:1px_1px_0_rgb(0_0_0/0.4)]">
        <h1>UPDATES</h1>
        <Link href="/" className="text-[11px] underline underline-offset-4">
          BACK
        </Link>
      </div>
      {days.map((day) => (
        <section key={day} className="flex flex-col gap-2" data-testid="update-day">
          <h2 className="text-[12px] font-bold text-frame">
            {DAY.format(new Date(`${day}T12:00:00Z`))}
          </h2>
          {UPDATES.filter((u) => u.date === day).map((u) => (
            <article
              key={u.title}
              className="dialog flex flex-col gap-1.5 p-3 text-[12px] leading-relaxed"
            >
              <h3 className="text-[14px] font-bold">{u.title}</h3>
              <ul className="flex list-disc flex-col gap-1 pl-4">
                {u.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
