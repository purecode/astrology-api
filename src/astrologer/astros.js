const sweph = require('sweph')
const { utcToJulianEt, zodiacSign, degreesToDms } = require('./utils')
const path = require('path')

sweph.set_ephe_path(path.join(__dirname, '/../../eph'))

const {
  SE_SUN,
  SE_MOON,
  SE_EARTH,
  SE_TRUE_NODE,
  SE_MEAN_APOG,
  SE_MERCURY,
  SE_VENUS,
  SE_MARS,
  SE_JUPITER,
  SE_SATURN,
  SE_URANUS,
  SE_NEPTUNE,
  SE_PLUTO,
  SE_VESTA,
  SE_JUNO,
  SE_CHIRON,
  SE_CERES,
  SE_PALLAS,
  SE_WHITE_MOON,
  SEFLG_SWIEPH,
  SEFLG_SPEED
} = sweph.constants

const PLANETS = {
  sun: SE_SUN,
  earth: SE_SUN,
  north_node: SE_TRUE_NODE,
  south_node: SE_TRUE_NODE,
  moon: SE_MOON,
  mercury: SE_MERCURY,
  venus: SE_VENUS,
  mars: SE_MARS,
  jupiter: SE_JUPITER,
  saturn: SE_SATURN,
  uranus: SE_URANUS,
  neptune: SE_NEPTUNE,
  pluto: SE_PLUTO,
  chiron: SE_CHIRON,
  lilith: SE_MEAN_APOG,
  ceres: SE_CERES,
  vesta: SE_VESTA,
  pallas: SE_PALLAS,
  selene: SE_WHITE_MOON,
  juno: SE_JUNO
}

const planetsByType = {
  sun: 'luminary',
  moon: 'luminary',
  earth: 'luminary',
  north_node: 'luminary',
  south_node: 'luminary',
  mercury: 'personal',
  venus: 'personal',
  mars: 'personal',
  jupiter: 'social',
  saturn: 'social',
  uranus: 'transpersonal',
  neptune: 'transpersonal',
  pluto: 'transpersonal',
  chiron: 'other',
  lilith: 'other',
  ceres: 'other',
  vesta: 'other',
  pallas: 'other',
  selene: 'other',
  juno: 'other'
}

const FLAG = SEFLG_SPEED | SEFLG_SWIEPH

const getPositionOfAstro = (astro, julianDay) => sweph.calc(julianDay, PLANETS[astro], FLAG)

const isRetrograde = (speed) => speed < 0

const position = (astrologyObject, moment) => {
  const julianDay = utcToJulianEt(moment)
  const { data } = getPositionOfAstro(astrologyObject, julianDay)
  const longitude = data[0]
  const speed = data[3]
  const dms = degreesToDms(longitude)
  const retrograde = isRetrograde(speed)

  return {
    position: {
      longitude,
      ...dms
    },
    speed,
    retrograde,
    sign: zodiacSign(longitude)
  }
}

const planets = (date) => {
  return Object.keys(PLANETS)
    .reduce(
      (accumulator, name) => {
        const planetPosition = position(name, date)
        accumulator[name] = {
          name,
          ...planetPosition,
          type: planetsByType[name]
        }
        return accumulator
      },
      {}
    )
}

module.exports = {
  PLANETS,
  position,
  planetsByType,
  planets
}
