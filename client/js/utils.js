export function allInts(vals) {
    for (var i in vals) {
        if (!isInt(vals[i])) {
            return false;
        }
    }

    return true;
}

export function allNumbers(values) {
  for (let value of values) {
    if (isNaN(value)) {
      return true
    }
  }

  return false
}

export function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

export function round(x, dec) {
  return (Math.round(x * dec) / dec)
}

export function rounddown(x, dec) {
  return (Math.floor(x * dec) / dec)
}

export function roundup(x, dec) {
  return (Math.ceil(x * dec) / dec)
}

export function zip(arr, ...arrs) {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]))
}
