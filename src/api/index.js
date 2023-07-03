const Router = require('express-promise-router')
const astrologer = require('../astrologer')

const router = new Router()

router.get('/', async (req, res) => res.status(200).json({ message: 'Welcome to Astrology api!' }))

router.get('/horoscope', async (req, res) => {
  const date = new Date(req.query.time)
  const { latitude, longitude, houseSystem } = req.query

  const chart = astrologer.natalChart(date, latitude, longitude, houseSystem)

  res.status(200).json({
    data: chart
  })
})

const astros = require('../astrologer/astros')

router.get('/dateByPlanetPosition', async (req, res) => {
  const planet = req.query.planet
  const needle = parseFloat(req.query.lng)
  const date = new Date(req.query.date)

  const getPos = (date) => {
    return astros.position(planet, date).position.longitude
  }

  const srcPos = getPos(date)
  let cur = srcPos

  if (cur < needle) {
    while (cur < needle) {
      if (needle - cur > 1) {
        date.setDate(date.getDate() + 1)
      } else if (needle - cur > 0.01) {
        date.setMinutes(date.getMinutes() + 1)
      } else {
        date.setSeconds(date.getSeconds() + 1)
      }
      cur = getPos(date)
    }
  } else {
    while (needle < cur) {
      if (cur - needle > 1) {
        date.setDate(date.getDate() - 1)
      } else if (cur - needle > 0.01) {
        date.setMinutes(date.getMinutes() - 1)
      } else {
        date.setSeconds(date.getSeconds() - 1)
      }
      cur = getPos(date)
    }
  }

  res.status(200).json({
    planet,
    srcPos,
    srcDate: new Date(req.query.date),
    foundPos: cur,
    foundDate: date
  })
})

// const plantesPrecies = { sun: 0.01, moon: 0.01 }

const find = (planet, needle, fromDate, toDate, firstOnly) => {
  let date = new Date(fromDate.valueOf())

  const getPos = (date) => {
    return astros.position(planet, date).position.longitude
  }

  const fr = getPos(fromDate)
  const to = getPos(toDate)

  let retro = fr > to
  if (fr > 180 && to < 180) {
    retro = false
  } else if (fr < 180 && to > 180) {
    retro = true
  }
  const found = []

  const valid = (cur, end, retro) => {
    if (cur > 180 && end < 180) {
      return cur < 360 || (cur > 0 && cur < end)
    } else if (cur < 180 && end > 180) {
      return cur > 0 || (cur < 360 && cur > end)
    } else {
      if (!retro) {
        return cur < end
      } else {
        return cur > end
      }
    }
  }

  let cur = getPos(date)
  const pres = 0.01

  while (date.getTime() < toDate.getTime()) {
    cur = getPos(date)

    while (valid(cur, needle, retro)) {
      if (date.getTime() > toDate.getTime()) {
        return found
      }
      if (needle - cur > 1) {
        date = new Date(date.getTime() + 1000 * 60 * 24)
      } else if (needle - cur > 0.01) {
        date = new Date(date.getTime() + 1000 * 60)
      } else {
        date = new Date(date.getTime() + 1000)
      }
      cur = getPos(date)
      if (found.length > 100) { return found }
    }

    if (Math.abs(cur - needle) <= pres) {
      found.push(date.toISOString())
      if (firstOnly) {
        return found
      }
      // break
    }

    date.setDate(date.getDate() + 1)
  }

  date.setDate(date.getDate() + 1)

  return found
}

router.get('/dateByPlanetPositionRange', async (req, res) => {
  const planet = req.query.planet
  const needle = parseFloat(req.query.lng)
  const fromDate = new Date(req.query.from)
  const toDate = new Date(req.query.to)
  const single = req.query.single !== undefined

  const found = find(planet, needle, fromDate, toDate, single).map((date) => {
    const pos = astros.position(planet, new Date(date))
    return ({ pos: pos.position.longitude, date, retrograde: pos.retrograde })
  })

  res.status(200).json({
    planet,
    fromDate,
    toDate,
    longitude: needle,
    found: single ? found[0] : found
  })
})

module.exports = router
