/* eslint-disable prettier/prettier */

type LineT = {
  id: string;
  isConnected: boolean;
};
type BlockT = {
  id: string;
  x: number;
  y: number;
};

enum ActionE {
  ZOOM,
  UNDOREDO,
  DRAG
}
export { type LineT, type BlockT, ActionE };
