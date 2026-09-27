// Loading is a dependency of the camera timeline, not a separate visual scene.
export function createLoader(journey, manager) {
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  manager.onLoad = () => {
    journey.assetsLoaded();
    resolveReady();
  };
  const state = { reveal: 0, typeReveal: 0 };
  return {
    ready,
    state,
    resize() {},
    update(act) {
      state.reveal = act.reveal;
      state.typeReveal = act.typeReveal;
    },
    dispose() {
      manager.onLoad = () => {};
    },
  };
}
