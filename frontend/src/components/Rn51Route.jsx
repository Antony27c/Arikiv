import { Polyline, Popup } from "react-leaflet";

const RN51_COORDS = [
  [-24.783, -65.412],
  [-24.841, -65.583],
  [-24.910, -65.636],
  [-24.878, -65.783],
  [-24.750, -65.900],
  [-24.683, -65.950],
  [-24.570, -66.050],
  [-24.467, -66.050],
  [-24.380, -66.200],
  [-24.256, -66.178],
  [-24.220, -66.315],
  [-24.183, -66.312],
  [-24.133, -66.667],
  [-24.250, -67.000],
  [-24.317, -67.083],
  [-24.383, -67.533],
  [-24.417, -68.250],
];

export default function Rn51Route() {
  return (
    <Polyline
      positions={RN51_COORDS}
      pathOptions={{
        color: "#c62828",
        weight: 3,
        opacity: 0.6,
        dashArray: "8 6",
      }}
    >
      <Popup>RN 51 — Ruta Nacional 51</Popup>
    </Polyline>
  );
}
