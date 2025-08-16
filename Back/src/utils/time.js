
export const toMin = (hhmm) => {
  const [H, M] = String(hhmm).split(":").map(Number);
  return H * 60 + M;
};

export const toHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE;


export const localDate = (y, m, d, H = 0, M = 0) => new Date(y, m - 1, d, H, M, 0, 0);

export const hhmmToMin = (s) => toMin(s);

export const toLocalDate = (y, m, d, H, M) => localDate(y, m, d, H, M);

export const startOfDay = (y, m, d) => new Date(y, m - 1, d, 0, 0, 0, 0);

export const endOfDay = (y, m, d) => new Date(y, m - 1, d, 23, 59, 59, 999);

export const dayStart = (dStr) => {
  const [y, m, d] = dStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export const dayEnd = (dStr) => {
  const [y, m, d] = dStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

