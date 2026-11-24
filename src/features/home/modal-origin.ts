// Remembers where the detail modal should grow FROM and shrink back INTO.
//
// The click happens on the home page; the modal mounts a moment later, after
// Next has navigated to /movie/550. A tiny module-level "mailbox" is the
// simplest way to hand that information over (it lives only in the browser).

export type ModalOrigin = {
  /** The rectangle (in viewport coordinates) the modal grows out of. */
  from: DOMRect;
  /** The card to shrink back into on close (if it's still on screen then). */
  returnTo: HTMLElement | null;
};

let pending: ModalOrigin | null = null;

export function setModalOrigin(origin: ModalOrigin) {
  pending = origin;
}

/** Read once: the next modal that opens without a fresh origin just fades in. */
export function takeModalOrigin() {
  const origin = pending;
  pending = null;
  return origin;
}
