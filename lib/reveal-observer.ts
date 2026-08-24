type RevealCallback = () => void;

const callbacks = new Map<Element, RevealCallback>();
let observer: IntersectionObserver | null = null;

function sharedObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  return observer;
}

/** Register one element with the page-wide lazy IntersectionObserver. */
export function observeReveal(element: Element, callback: RevealCallback) {
  callbacks.set(element, callback);
  sharedObserver().observe(element);

  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}
