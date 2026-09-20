export const getBerthTypeFromSeat = (seatNumber) => {
  const num = parseInt(seatNumber, 10);
  if (isNaN(num) || num <= 0) return 'LOWER';
  const rem = num % 8;
  switch (rem) {
    case 1:
    case 4:
      return 'LOWER';
    case 2:
    case 5:
      return 'MIDDLE';
    case 3:
    case 6:
      return 'UPPER';
    case 7:
      return 'SIDE_LOWER';
    case 0:
      return 'SIDE_UPPER';
    default:
      return 'LOWER';
  }
};

export const getBayNumber = (seatNumber) => {
  const num = parseInt(seatNumber, 10);
  if (isNaN(num) || num <= 0) return 1;
  return Math.floor((num - 1) / 8) + 1;
};
