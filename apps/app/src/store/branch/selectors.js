export const selectAllowedBranches = (state) =>
  (state.Branch && state.Branch.branches) || [];

export const selectActiveBranch = (state) =>
  (state.Branch && state.Branch.activeBranch) || null;
