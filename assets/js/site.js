(() => {
  const slider = document.querySelector('#distance');
  if (!slider) return;
  const demo = document.querySelector('.sensor-demo');
  const output = document.querySelector('#distance-value');
  const status = document.querySelector('#sensor-status');
  const object = document.querySelector('#demo-object');
  function updateDistance() {
    const distance = Number(slider.value);
    const zone = distance > 17 ? 'far' : distance > 9 ? 'middle' : 'close';
    demo.dataset.zone = zone;
    output.value = String(distance);
    status.textContent = { far: 'Far away · green light', middle: 'Getting closer · yellow light', close: 'Close to the sensor · red light' }[zone];
    slider.setAttribute('aria-valuetext', `${distance} centimetres. ${status.textContent}`);
    object.style.left = `${25 + ((distance - 2) / 28) * 65}%`;
  }
  slider.addEventListener('input', updateDistance);
  updateDistance();
})();
