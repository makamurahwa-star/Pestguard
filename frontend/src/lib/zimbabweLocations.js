/**
 * Zimbabwe provinces and major towns, each with an approximate centre point.
 *
 * Why approximate is enough:
 *   When a farmer says "Bindura", they mean "the area around Bindura town".
 *   Using the geographic centre of the town gives the outbreak map a sensible
 *   pin location that matches how people actually think about where they are.
 *
 *   Anyone needing pinpoint accuracy (e.g. logging an outbreak in a specific
 *   field corner) can still tap "Use my current location" to use GPS.
 *
 * All 10 provinces of Zimbabwe are covered, with 5-8 major towns each.
 * Coordinates from Wikipedia/OpenStreetMap, accurate to within a few hundred metres.
 */
export const ZIMBABWE_LOCATIONS = {
  'Harare': {
    lat: -17.8252, lng: 31.0335,
    towns: {
      'Harare CBD':    { lat: -17.8252, lng: 31.0335 },
      'Chitungwiza':   { lat: -18.0127, lng: 31.0756 },
      'Epworth':       { lat: -17.8900, lng: 31.1400 },
      'Norton':        { lat: -17.8833, lng: 30.7000 },
      'Ruwa':          { lat: -17.8856, lng: 31.2411 },
      'Mbare':         { lat: -17.8628, lng: 31.0383 },
      'Borrowdale':    { lat: -17.7400, lng: 31.0900 },
    },
  },

  'Bulawayo': {
    lat: -20.1500, lng: 28.5833,
    towns: {
      'Bulawayo CBD':   { lat: -20.1500, lng: 28.5833 },
      'Pumula':         { lat: -20.1833, lng: 28.5500 },
      'Cowdray Park':   { lat: -20.1167, lng: 28.5167 },
      'Nkulumane':      { lat: -20.1700, lng: 28.5300 },
      'Bellevue':       { lat: -20.1700, lng: 28.6200 },
      'Hillside':       { lat: -20.1700, lng: 28.6000 },
    },
  },

  'Mashonaland Central': {
    lat: -16.7500, lng: 31.0833,
    towns: {
      'Bindura':       { lat: -17.3019, lng: 31.3306 },
      'Mt Darwin':     { lat: -16.7758, lng: 31.5836 },
      'Centenary':     { lat: -16.8067, lng: 31.1267 },
      'Mvurwi':        { lat: -17.0356, lng: 30.8408 },
      'Shamva':        { lat: -17.3122, lng: 31.5650 },
      'Guruve':        { lat: -16.6594, lng: 30.7081 },
      'Glendale':      { lat: -17.3667, lng: 31.0500 },
      'Concession':    { lat: -17.3692, lng: 30.9536 },
    },
  },

  'Mashonaland East': {
    lat: -18.1833, lng: 31.5333,
    towns: {
      'Marondera':     { lat: -18.1853, lng: 31.5519 },
      'Murehwa':       { lat: -17.6517, lng: 31.7831 },
      'Mutoko':        { lat: -17.4167, lng: 32.2167 },
      'Wedza':         { lat: -18.6228, lng: 31.5750 },
      'Chivhu':        { lat: -19.0167, lng: 30.8833 },
      'Macheke':       { lat: -18.1500, lng: 31.8333 },
      'Mudzi':         { lat: -16.9167, lng: 32.6167 },
      'Goromonzi':     { lat: -17.8500, lng: 31.3333 },
    },
  },

  'Mashonaland West': {
    lat: -17.4500, lng: 30.0167,
    towns: {
      'Chinhoyi':      { lat: -17.3667, lng: 30.2000 },
      'Kariba':        { lat: -16.5167, lng: 28.8000 },
      'Karoi':         { lat: -16.8083, lng: 29.6917 },
      'Banket':        { lat: -17.3833, lng: 30.4167 },
      'Chegutu':       { lat: -18.1297, lng: 30.1492 },
      'Kadoma':        { lat: -18.3333, lng: 29.9167 },
      'Mhangura':      { lat: -16.9000, lng: 30.1333 },
      'Sanyati':       { lat: -17.7500, lng: 29.3833 },
    },
  },

  'Manicaland': {
    lat: -18.9167, lng: 32.6500,
    towns: {
      'Mutare':        { lat: -18.9707, lng: 32.6709 },
      'Rusape':        { lat: -18.5374, lng: 32.1281 },
      'Chipinge':      { lat: -20.2000, lng: 32.6167 },
      'Nyanga':        { lat: -18.2167, lng: 32.7500 },
      'Chimanimani':   { lat: -19.8000, lng: 32.8667 },
      'Honde Valley':  { lat: -18.3500, lng: 32.8333 },
      'Penhalonga':    { lat: -18.8833, lng: 32.7167 },
      'Buhera':        { lat: -19.3000, lng: 31.4667 },
    },
  },

  'Masvingo': {
    lat: -20.0667, lng: 30.8333,
    towns: {
      'Masvingo Town': { lat: -20.0744, lng: 30.8328 },
      'Chiredzi':      { lat: -21.0500, lng: 31.6667 },
      'Triangle':      { lat: -21.0500, lng: 31.4833 },
      'Zaka':          { lat: -20.3333, lng: 31.4667 },
      'Gutu':          { lat: -19.6333, lng: 31.1500 },
      'Mwenezi':       { lat: -21.3500, lng: 30.7000 },
      'Bikita':        { lat: -19.9833, lng: 31.4500 },
      'Chivi':         { lat: -20.3167, lng: 30.5500 },
    },
  },

  'Midlands': {
    lat: -19.4500, lng: 29.8167,
    towns: {
      'Gweru':         { lat: -19.4500, lng: 29.8167 },
      'Kwekwe':        { lat: -18.9281, lng: 29.8147 },
      'Redcliff':      { lat: -19.0333, lng: 29.7833 },
      'Shurugwi':      { lat: -19.6700, lng: 30.0067 },
      'Zvishavane':    { lat: -20.3333, lng: 30.0333 },
      'Mberengwa':     { lat: -20.4833, lng: 29.9333 },
      'Gokwe':         { lat: -18.2167, lng: 28.9333 },
      'Chirumhanzu':   { lat: -19.6500, lng: 30.5167 },
    },
  },

  'Matabeleland North': {
    lat: -18.5167, lng: 27.5000,
    towns: {
      'Hwange':        { lat: -18.3645, lng: 26.4955 },
      'Victoria Falls':{ lat: -17.9244, lng: 25.8567 },
      'Lupane':        { lat: -18.9333, lng: 27.8000 },
      'Binga':         { lat: -17.6217, lng: 27.3411 },
      'Tsholotsho':    { lat: -19.7667, lng: 27.7500 },
      'Nkayi':         { lat: -19.0000, lng: 28.9000 },
      'Bubi':          { lat: -19.5000, lng: 28.7500 },
    },
  },

  'Matabeleland South': {
    lat: -21.0500, lng: 29.0833,
    towns: {
      'Gwanda':        { lat: -20.9389, lng: 29.0014 },
      'Beitbridge':    { lat: -22.2167, lng: 30.0000 },
      'Plumtree':      { lat: -20.4833, lng: 27.8167 },
      'Esigodini':     { lat: -20.2833, lng: 28.9333 },
      'Filabusi':      { lat: -20.5333, lng: 29.2833 },
      'Mangwe':        { lat: -20.7833, lng: 27.7167 },
      'Matobo':        { lat: -20.7000, lng: 28.5167 },
      'Insiza':        { lat: -20.5167, lng: 29.0500 },
    },
  },
}

// Convenience: list of province names in display order
export const PROVINCES = Object.keys(ZIMBABWE_LOCATIONS)

// Convenience: list of towns for a given province
export function getTowns(province) {
  if (!province || !ZIMBABWE_LOCATIONS[province]) return []
  return Object.keys(ZIMBABWE_LOCATIONS[province].towns)
}

// Convenience: get lat/lng for a (province, town) pair
export function getCoords(province, town) {
  if (!province || !ZIMBABWE_LOCATIONS[province]) return null
  if (town && ZIMBABWE_LOCATIONS[province].towns[town]) {
    return ZIMBABWE_LOCATIONS[province].towns[town]
  }
  // Province only — return the province centre
  return { lat: ZIMBABWE_LOCATIONS[province].lat, lng: ZIMBABWE_LOCATIONS[province].lng }
}
