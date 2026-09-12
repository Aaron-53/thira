import React from "react";
import { createRoot } from "react-dom/client";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

// A tonal version of the water-plane shader, anchored to the logo's original orange.
function PlasmaBackground() {
  const [reducedMotion, setReducedMotion] = React.useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  React.useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return (
    <ShaderGradientCanvas style={{ width: "100%", height: "100%" }} pointerEvents="none">
      <ShaderGradient
        type="waterPlane"
        animate={reducedMotion ? "off" : "on"}
        color1="#A32C12"
        color2="#C03410"
        color3="#DC5428"
        brightness={1}
        uSpeed={0.22}
        grain="off"
        control="props"
        enableCameraUpdate={false}
        cameraZoom={1}
        zoomOut={false}
      />
    </ShaderGradientCanvas>
  );
}

createRoot(document.getElementById("plasma-background")).render(<PlasmaBackground />);
