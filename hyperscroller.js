(() => {
  const stage = document.querySelector('[data-hyperscroller]');
  if (!stage) return;

  const products = [...stage.querySelectorAll('[data-spin]')];
  const toggle = stage.querySelector('.motion-toggle');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bases = [-18, 19, -13];
  const spins = [220, -270, 240];
  let paused = false;
  let visible = false;
  let frame = 0;

  function render() {
    frame = 0;
    if (paused || preference.matches) return;
    const rect = stage.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    const travel = progress - 0.5;
    products.forEach((product, index) => {
      const rotation = bases[index] + travel * spins[index];
      const lift = Math.sin(travel * Math.PI * 2 + index * 1.3) * 18;
      const depth = Math.sin(travel * Math.PI + index) * 16;
      product.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) rotateX(${depth.toFixed(2)}deg) rotateY(${(travel * 38).toFixed(2)}deg) rotateZ(${rotation.toFixed(2)}deg)`;
    });
  }

  function schedule() {
    if (!visible || paused || preference.matches || frame) return;
    frame = window.requestAnimationFrame(render);
  }

  function updateControl() {
    const reduced = preference.matches;
    toggle.disabled = reduced;
    toggle.setAttribute('aria-pressed', String(paused || reduced));
    toggle.setAttribute('aria-label', reduced ? 'Motion disabled by your reduced-motion preference' : paused ? 'Resume scroll animation' : 'Pause scroll animation');
    toggle.innerHTML = reduced ? 'Reduced motion' : paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    if (reduced) products.forEach(product => product.style.removeProperty('transform'));
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    updateControl();
    if (paused && frame) { window.cancelAnimationFrame(frame); frame = 0; }
    schedule();
  });
  preference.addEventListener('change', () => {updateControl(); schedule();});
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && frame) {window.cancelAnimationFrame(frame); frame = 0;}
    schedule();
  }, {rootMargin:'100px'});
  observer.observe(stage);
  updateControl();
})();
