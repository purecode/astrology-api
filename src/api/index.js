const Router = require('express-promise-router')
const astrologer = require('../astrologer')

const router = new Router()

router.get('/', async (req, res) => res.status(200).json({ message: 'Welcome to Astrology api!' }))

router.get('/horoscope', async (req, res) => {
  const date = new Date(req.query.time)
  const {
    latitude,
    longitude,
    houseSystem
  } = req.query

  const chart = astrologer.natalChart(date, latitude, longitude, houseSystem)

  res.status(200).json({
    data: chart
  })
})

const astros = require('../astrologer/astros')
const { houses } = require('../astrologer/houses')

/**
 * @param {string} req.query.lat - The latitude coordinate (required).
 * @param {number} req.query.lng - The longitude coordinate (required).
 * @param {number} req.query.date - The date (required).
 */
router.get('/houses', async (req, res) => {
  if (!req.query.lat || !req.query.lng || !req.query.date) {
    res.status(400).json({
      error: 'Не переданы параметры date, lat и lng'
    })
    return
  }

  const date = new Date(req.query.date)
  const a = houses(date, {
    latitude: +req.query.lat,
    longitude: +req.query.lng
  })

  res.status(200).json({
    data: a
  })
})

/**
 * @param {string} req.query.planet - The planet (required).
 * @param {number} req.query.lng - The longitude coordinate (required).
 * @param {number} req.query.date - The date (required).
 */
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

  const valid = (cur, end, planet) => {
    if (planet === 'moon') {
      return Math.abs(cur - end) >= 0.0001
    } else {
      return Math.abs(cur - end) >= 0.0001
    }
  }

  const delta = (needle, cur) => {
    if (needle > 235 && cur < 45) {
      return 360 - needle + cur
    } else if (needle < 45 && cur > 235) {
      return 360 - cur + needle
    } else {
      return Math.abs(needle - cur)
    }
  }

  let cur = getPos(date)
  const pres = 0.01

  // console.log("CUR: " + cur + "; NEEDLE: " + needle)

  while (date.getTime() < toDate.getTime()) {
    cur = getPos(date)

    while (valid(cur, needle, planet)) {
      if (date.getTime() > toDate.getTime()) {
        return found
      }

      if (delta(needle, cur) > 1) {
        if (planet === 'moon') {
          // К луне нужно аккуратно подходить, она быстрая.
          date = new Date(date.getTime() + 1000 * 60 * 12)
        } else {
          date = new Date(date.getTime() + 1000 * 60 * 24)
        }

        // console.log("1: planet  = " + planet +", cur = " + cur + ", needle = " + needle + " delta(needle-cur) = " + delta(needle, cur) + " date " + date.toISOString() )
      } else if (delta(needle, cur) > 0.01) {
        if (planet === 'moon') { // К луне нужно аккуратно подходить, она быстрая.
          date = new Date(date.getTime() + 1000 * 30)
        } else {
          date = new Date(date.getTime() + 1000 * 60)
        }

        // console.log("2: planet  = " + planet +", cur = " + cur + ", needle = " + needle + " delta(needle-cur) = " + delta(needle, cur) + " date " + date.toISOString() )
      } else {
        date = new Date(date.getTime() + 1000)

        // console.log("3: planet  = " + planet +", cur = " + cur + ", needle = " + needle + " delta(needle-cur) = " + delta(needle, cur) + " date " + date.toISOString() )
      }

      cur = getPos(date)

      if (found.length > 100) {
        return found
      }
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
    return ({
      pos: pos.position.longitude,
      date,
      retrograde: pos.retrograde
    })
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
