export type CursorCoordinates = { x: number; y: number } | null;

type CoordinateListener = (coords: CursorCoordinates) => void;
type CopyActionListener = (json: string) => void;

class CoordinateBus {
  private listeners: Set<CoordinateListener> = new Set();
  private copyListeners: Set<CopyActionListener> = new Set();
  private currentCoords: CursorCoordinates = null;
  private lastValidCoords: { x: number; y: number } | null = null;

  subscribe(listener: CoordinateListener): () => void {
    this.listeners.add(listener);
    // Immediate callback with current state if available
    listener(this.currentCoords);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeCopy(listener: CopyActionListener): () => void {
    this.copyListeners.add(listener);
    return () => {
      this.copyListeners.delete(listener);
    };
  }

  emit(coords: CursorCoordinates): void {
    this.currentCoords = coords;
    if (coords) {
      this.lastValidCoords = coords;
    }
    for (const listener of this.listeners) {
      listener(coords);
    }
  }

  get(): CursorCoordinates {
    return this.currentCoords;
  }

  getLastValid(): { x: number; y: number } | null {
    return this.lastValidCoords || this.currentCoords;
  }

  copyCoordinates(viewportWidth: number, viewportHeight: number): boolean {
    const coords = this.currentCoords || this.lastValidCoords;
    if (!coords) return false;

    const json = JSON.stringify(
      {
        pixel: { x: Math.round(coords.x), y: Math.round(coords.y) },
        percent: {
          left: Number(((coords.x / viewportWidth) * 100).toFixed(2)),
          top: Number(((coords.y / viewportHeight) * 100).toFixed(2)),
        },
      },
      null,
      2
    );

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => {});
    }

    for (const listener of this.copyListeners) {
      listener(json);
    }
    return true;
  }
}

export const coordinateBus = new CoordinateBus();

