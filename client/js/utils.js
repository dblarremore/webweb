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

export function degreeToRadians(degree) {
  return degree * (Math.PI / 180)
}

export function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function isObject(value) {
  return typeof one === 'object'
}

export function objectsAreDeepEqual(one, two) {
  if ((! isObject(one)) || (! isObject(two))) {
    return false
  }

  let keysInOne = []
  for (let [key, val] of Object.entries(one)) {
    if (! itemsAreDeepEqual(val, two[key])) {
      return false
    }

    keysInOne.push(key)
  }

  for (let [key, value] of Object.entries(two)) {
    if (keysInOne.includes(key)) {
      continue
    }

    if (! itemsAreDeepEqual(val, one[key])) {
      return false
    }
  }

  return true
}

export function itemsAreDeepEqual(one, two) {
  if (isObject(one) && isObject(two)) {
    return objectsAreDeepEqual(one, two)
  }
  else if ((! isObject(one)) && (! isObject(two))) {
    return one === two
  }
  else {
    return false
  }
}
