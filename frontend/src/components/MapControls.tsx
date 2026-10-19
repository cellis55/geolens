
type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: Props) {
  return (
    <div className="geo-map-controls">
      <button type="button" onClick={onZoomIn} title="Zoom in">
        +
      </button>
      <button type="button" onClick={onZoomOut} title="Zoom out">
        −
      </button>
      <button type="button" onClick={onReset} title="Reset map">
        ↺
      </button>
    </div>
  );
}
