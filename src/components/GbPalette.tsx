/**
 * The `#gb-palette` SVG filter: turns anything to lightness and snaps it to one of the 4 LCD
 * greens. Rendered once per page; CSS applies it with `filter: url(#gb-palette)`.
 */
export function GbPalette() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <filter id="gb-palette" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
        />
        <feComponentTransfer>
          <feFuncR type="discrete" tableValues="0.059 0.188 0.545 0.608" />
          <feFuncG type="discrete" tableValues="0.220 0.384 0.675 0.737" />
          <feFuncB type="discrete" tableValues="0.059 0.188 0.059 0.059" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}
