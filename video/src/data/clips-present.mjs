// @ts-check
// As you record each step, drop the file into public/clips/ and add its step
// id here. Anything not listed renders the styled placeholder instead, so the
// video always previews and renders cleanly — even half-finished.
//
// Example once you've recorded the first three:
//   export const present = new Set(["step-01", "step-02", "step-03"]);

/** @type {Set<string>} */
export const present = new Set([
  "step-01",
  "step-02",
  "step-03",
  "step-04",
  "step-05",
  "step-06",
  "step-07",
  "step-08",
  "step-09",
  "step-10",
]);

/** @param {string} id */
export const hasClip = (id) => present.has(id);
