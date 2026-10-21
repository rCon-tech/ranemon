import type { AnchorHTMLAttributes } from 'react';

/** next/link on the play link: pages are hashes. */
export default function Link({
  href,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href === '/' ? '#' : `#${href.slice(1)}`} {...rest} />;
}
