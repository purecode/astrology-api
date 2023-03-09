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

router.get('/dateByPlanetPositionRange', async (req, res) => {
  const planet = req.query.planet
  const needle = parseFloat(req.query.lng)
  const fromDate = new Date(req.query.from)
  const toDate = new Date(req.query.to)

  const getPos = (date) => {
    return astros.position(planet, date).position.longitude
  }

  const date = new Date(fromDate.valueOf())
  let found = []

  let cur = getPos(date)
  while (date.getTime() < toDate.getTime()) {
    cur = getPos(date)
    if (cur > needle) {
      date.setDate(date.getDate() + 1)
      continue
    }

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
    found.push(date.toISOString())
    date.setDate(date.getDate() + 1)
  }

  found = found.map((date) => {
    const pos = astros.position(planet, new Date(date))
    return ({ pos: pos.position.longitude, date, retrograde: pos.retrograde })
  })

  res.status(200).json({
    planet,
    fromDate,
    toDate,
    longitude: needle,
    found
  })
})

module.exports = router
