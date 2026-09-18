/** Появление блоков `.rv` при скролле (замена IntersectionObserver из React-версии). */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.08 },
);

document.querySelectorAll<HTMLElement>('.rv:not(.in)').forEach((el) => io.observe(el));
