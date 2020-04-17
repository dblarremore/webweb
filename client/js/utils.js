export function zerosMatrix(size) {
  let matrix = new Array(size).fill(0)
  matrix.forEach((row, i) => matrix[i] = new Array(size).fill(0))
  return matrix
}

export function binValues(values, bins) {
  if (bins === undefined) {
    bins = values.length < 5 ? values.length : 4
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = (max - min) / (bins - 1)

  let binnedValues = []
  for (let binValue = min; binValue < max; binValue += step) {
    binnedValues.push(round(binValue, 10))
  }
  binnedValues.push(max)

  return binnedValues
}

export function getCallHandler(handlers) {
  let handleFunction = (handlerRequest, settings) => {
    let fn = handlers[handlerRequest]
    if (fn !== undefined) {
      fn(settings)
    }
  }

  return handleFunction
}

/*
 * Checks to make sure that a given key on an object is real
  * */
export function keyIsObjectAttribute(key, object) {
  if (object == undefined) {
    return false
  }

  let attribute = object[key]

  if (attribute == undefined) {
    return false
  }

  if ({}.toString.call(attribute) == '[object Function]') {
    return false
  }

  return true
}

export function getObjectAttributeKeys(object, attributesToExclude=[]) {
  return Object.keys(object).filter(
    key => keyIsObjectAttribute(key, object)
  ).filter(
    key => attributesToExclude.indexOf(key) === -1
  )
}

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
      return false
    }
  }

  return true
}

export function distance(x1, y1, x2, y2) {
  const x = Math.pow(x1 - x2, 2)
  const y = Math.pow(y1 - y2, 2)

  return Math.sqrt(x + y)
}

export function safeNumberCast(value) {
  return isNaN(value) ? value : +value
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
