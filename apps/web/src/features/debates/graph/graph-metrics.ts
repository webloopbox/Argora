// Node box used both by the dagre layout (to reserve space) and by the lasso
// hit test (to find a node's centre). One source of truth, because a mismatch
// shows up as a lasso that selects tiles the user did not draw around.
export const NODE_WIDTH = 300;
export const NODE_HEIGHT = 150;
export const THESIS_WIDTH = 360;
export const THESIS_HEIGHT = 160;

export const THESIS_NODE_ID = "thesis";
