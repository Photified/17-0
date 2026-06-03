"use strict";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmt(value) {
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function eraBoost(era) {
  const boosts = {
    "1960s": 1.18,
    "1970s": 1.14,
    "1980s": 1.09,
    "1990s": 1.04,
    "2000s": 1,
    "2010s": 0.97,
    "2020s": 0.95
  };
  return boosts[era] || 1;
}

function makeQB(name, team, era, season, passYds, passTD, interceptions, rushYds = 0, rushTD = 0) {
  const boost = eraBoost(era);
  const adjustedYds = passYds * boost;
  const adjustedTD = passTD * boost;
  const totalTD = passTD + rushTD;

  const volume = clamp(Math.round(68 + adjustedYds / 145), 70, 100);
  const efficiency = clamp(Math.round(72 + adjustedTD * 0.66 - interceptions * 0.44), 70, 100);
  const turnoverSafety = clamp(Math.round(100 - interceptions * 1.35), 70, 100);
  const clutch = clamp(Math.round(82 + totalTD * 0.3 - interceptions * 0.08), 78, 100);
  const rushingBonus = clamp(Math.round(rushYds / 65 + rushTD * 1.25), 0, 12);

  const rating = clamp(
    Math.round(volume * 0.31 + efficiency * 0.32 + turnoverSafety * 0.18 + clutch * 0.13 + rushingBonus * 0.06),
    78,
    100
  );

  return {
    slot: "QB",
    name,
    team,
    era,
    season,
    rating,
    stats: {
      Season: season,
      "Pass Yds": fmt(passYds),
      "Pass TD": passTD,
      INT: interceptions,
      ...(rushYds ? { "Rush Yds": fmt(rushYds) } : {}),
      ...(rushTD ? { "Rush TD": rushTD } : {})
    },
    traits: { efficiency, volume, turnoverSafety, clutch }
  };
}

function makeRB(name, team, era, season, rushYds, rushTD, rec = 0, recYds = 0, recTD = 0) {
  const boost = eraBoost(era);
  const scrimYds = rushYds + recYds;
  const totalTD = rushTD + recTD;

  const rushing = clamp(Math.round(68 + (rushYds * boost) / 26), 70, 100);
  const receiving = clamp(Math.round(70 + rec / 2.4 + recYds / 70 + recTD * 0.8), 70, 100);
  const touchdowns = clamp(Math.round(72 + totalTD * 1.45), 70, 100);
  const efficiency = clamp(Math.round(70 + scrimYds / 48 + totalTD * 0.35), 70, 100);

  const rating = clamp(
    Math.round(rushing * 0.36 + receiving * 0.16 + touchdowns * 0.27 + efficiency * 0.21),
    78,
    100
  );

  return {
    slot: "RB",
    name,
    team,
    era,
    season,
    rating,
    stats: {
      Season: season,
      "Rush Yds": fmt(rushYds),
      "Rush TD": rushTD,
      ...(rec ? { Rec: rec } : {}),
      ...(recYds ? { "Rec Yds": fmt(recYds) } : {}),
      ...(recTD ? { "Rec TD": recTD } : {}),
      "Total TD": totalTD
    },
    traits: { rushing, receiving, touchdowns, efficiency }
  };
}

function makeWR(name, team, era, season, rec, recYds, recTD) {
  const boost = eraBoost(era);

  const volume = clamp(Math.round(66 + rec / 1.55 + (recYds * boost) / 120), 70, 100);
  const touchdowns = clamp(Math.round(72 + recTD * 1.7), 70, 100);
  const efficiency = clamp(Math.round(70 + (recYds / Math.max(rec, 1)) * 1.15 + recTD * 0.4), 70, 100);
  const gravity = clamp(Math.round(72 + recYds / 42 + recTD * 0.75), 70, 100);

  const rating = clamp(
    Math.round(volume * 0.29 + touchdowns * 0.26 + efficiency * 0.2 + gravity * 0.25),
    78,
    100
  );

  return {
    slot: "WR",
    name,
    team,
    era,
    season,
    rating,
    stats: {
      Season: season,
      Rec: rec,
      "Rec Yds": fmt(recYds),
      "Rec TD": recTD
    },
    traits: { volume, touchdowns, efficiency, gravity }
  };
}

function makeDEF(name, team, era, season, pointsAllowedPerGame, sacks, takeaways, yardsAllowedPerGame = 0, defTD = 0) {
  const boost = eraBoost(era);

  const scoring = clamp(Math.round(112 - pointsAllowedPerGame * 1.7 * boost), 70, 100);
  const pressure = clamp(Math.round(70 + sacks * 0.55), 70, 100);
  const turnovers = clamp(Math.round(70 + takeaways * 0.62), 70, 100);
  const dominance = clamp(Math.round(scoring * 0.42 + pressure * 0.24 + turnovers * 0.24 + defTD * 0.8), 70, 100);

  const rating = clamp(
    Math.round(scoring * 0.35 + pressure * 0.22 + turnovers * 0.24 + dominance * 0.19),
    78,
    100
  );

  return {
    slot: "DEF",
    name: `${season} ${name}`,
    team,
    era,
    season,
    rating,
    stats: {
      Season: season,
      "Pts Allowed": `${pointsAllowedPerGame}/g`,
      Sacks: sacks,
      Takeaways: takeaways,
      ...(yardsAllowedPerGame ? { "Yds Allowed": `${yardsAllowedPerGame}/g` } : {}),
      ...(defTD ? { "Def TD": defTD } : {})
    },
    traits: { scoring, pressure, turnovers, dominance }
  };
}

// ---------------------------------------------------------
// FRANCHISE DATABASE
// Easily add new players to their respective teams below.
// ---------------------------------------------------------

const franchiseData = {
  "49ers": [
    makeQB("Steve Young", "49ers", "1990s", 1994, 3969, 35, 10, 293, 7),
    makeQB("Joe Montana", "49ers", "1980s", 1989, 3521, 26, 8),
    makeRB("Christian McCaffrey", "49ers", "2020s", 2023, 1459, 14, 67, 564, 7),
    makeRB("Frank Gore", "49ers", "2000s", 2006, 1695, 8, 61, 485, 1),
    makeWR("Jerry Rice", "49ers", "1980s", 1987, 65, 1078, 22),
    makeWR("Terrell Owens", "49ers", "2000s", 2000, 97, 1451, 13),
    makeWR("Deebo Samuel", "49ers", "2020s", 2021, 77, 1405, 6),
    makeDEF("49ers Defense", "49ers", "2020s", 2022, 16.3, 44, 30),
    makeDEF("49ers Defense", "49ers", "1980s", 1984, 14.2, 51, 40)
  ],

  "Bears": [
    makeQB("Jay Cutler", "Bears", "2010s", 2014, 3812, 28, 18),
    makeQB("Sid Luckman", "Bears", "1940s", 1943, 2194, 28, 12),
    makeRB("Walter Payton", "Bears", "1970s", 1977, 1852, 14, 27, 269, 2),
    makeRB("Gale Sayers", "Bears", "1960s", 1965, 867, 14, 29, 507, 6),
    makeWR("Brandon Marshall", "Bears", "2010s", 2012, 118, 1508, 11),
    makeWR("Alshon Jeffery", "Bears", "2010s", 2013, 89, 1421, 7),
    makeDEF("Bears Defense", "Bears", "1980s", 1985, 12.4, 64, 54),
    makeDEF("Bears Defense", "Bears", "2000s", 2006, 15.9, 40, 44)
  ],

  "Bengals": [
    makeQB("Joe Burrow", "Bengals", "2020s", 2021, 4611, 34, 14),
    makeQB("Ken Anderson", "Bengals", "1980s", 1981, 3754, 29, 10),
    makeRB("Corey Dillon", "Bengals", "2000s", 2000, 1435, 7, 18, 121, 0),
    makeRB("Joe Mixon", "Bengals", "2020s", 2021, 1205, 13, 42, 314, 3),
    makeWR("Ja'Marr Chase", "Bengals", "2020s", 2021, 81, 1455, 13),
    makeWR("A.J. Green", "Bengals", "2010s", 2013, 98, 1426, 11),
    makeWR("Chad Johnson", "Bengals", "2000s", 2005, 97, 1432, 9),
    makeDEF("Bengals Defense", "Bengals", "1980s", 1988, 17.4, 43, 34),
    makeDEF("Bengals Defense", "Bengals", "2020s", 2022, 20.1, 30, 24)
  ],

  "Bills": [
    makeQB("Josh Allen", "Bills", "2020s", 2023, 4306, 29, 18, 524, 15),
    makeQB("Jim Kelly", "Bills", "1990s", 1991, 3844, 33, 17),
    makeRB("O.J. Simpson", "Bills", "1970s", 1973, 2003, 12, 6, 70, 0),
    makeRB("Thurman Thomas", "Bills", "1990s", 1991, 1407, 7, 62, 631, 5),
    makeWR("Stefon Diggs", "Bills", "2020s", 2020, 127, 1535, 8),
    makeWR("Andre Reed", "Bills", "1980s", 1989, 88, 1312, 9),
    makeDEF("Bills Defense", "Bills", "2020s", 2021, 17.0, 42, 30),
    makeDEF("Bills Defense", "Bills", "1990s", 1999, 14.3, 46, 38)
  ],

  "Broncos": [
    makeQB("John Elway", "Broncos", "1990s", 1993, 4030, 25, 10),
    makeQB("Peyton Manning", "Broncos", "2010s", 2013, 5477, 55, 10),
    makeRB("Terrell Davis", "Broncos", "1990s", 1998, 2008, 21, 25, 217, 2),
    makeRB("Clinton Portis", "Broncos", "2000s", 2003, 1591, 14, 38, 314, 0),
    makeWR("Demaryius Thomas", "Broncos", "2010s", 2014, 111, 1619, 11),
    makeWR("Rod Smith", "Broncos", "2000s", 2000, 100, 1602, 8),
    makeDEF("Broncos Defense", "Broncos", "2010s", 2015, 18.5, 52, 27),
    makeDEF("Broncos Defense", "Broncos", "1970s", 1977, 10.6, 44, 39)
  ],

  "Browns": [
    makeQB("Brian Sipe", "Browns", "1980s", 1980, 4132, 30, 14),
    makeQB("Otto Graham", "Browns", "1950s", 1953, 2722, 11, 9, 143, 6),
    makeRB("Jim Brown", "Browns", "1960s", 1963, 1863, 12, 24, 268, 3),
    makeRB("Nick Chubb", "Browns", "2020s", 2022, 1525, 12, 27, 239, 1),
    makeWR("Josh Gordon", "Browns", "2010s", 2013, 87, 1646, 9),
    makeWR("Paul Warfield", "Browns", "1960s", 1968, 50, 1067, 12),
    makeDEF("Browns Defense", "Browns", "1950s", 1953, 13.5, 35, 45),
    makeDEF("Browns Defense", "Browns", "2020s", 2023, 21.3, 49, 28)
  ],

  "Buccaneers": [
    makeQB("Tom Brady", "Buccaneers", "2020s", 2021, 5316, 43, 12),
    makeQB("Doug Williams", "Buccaneers", "1970s", 1979, 2448, 18, 24),
    makeRB("James Wilder", "Buccaneers", "1980s", 1984, 1544, 13, 85, 685, 0),
    makeRB("Mike Alstott", "Buccaneers", "1990s", 1999, 949, 7, 27, 239, 2),
    makeWR("Mike Evans", "Buccaneers", "2010s", 2018, 86, 1524, 8),
    makeWR("Chris Godwin", "Buccaneers", "2010s", 2019, 86, 1333, 9),
    makeDEF("Buccaneers Defense", "Buccaneers", "2000s", 2002, 12.3, 43, 38),
    makeDEF("Buccaneers Defense", "Buccaneers", "1990s", 1999, 14.7, 43, 38)
  ],

  "Cardinals": [
    makeQB("Kurt Warner", "Cardinals", "2000s", 2008, 4583, 30, 14),
    makeQB("Kyler Murray", "Cardinals", "2020s", 2020, 3971, 26, 12, 819, 11),
    makeRB("David Johnson", "Cardinals", "2010s", 2016, 1239, 16, 80, 879, 4),
    makeRB("Ottis Anderson", "Cardinals", "1970s", 1979, 1605, 8, 41, 308, 2),
    makeWR("Larry Fitzgerald", "Cardinals", "2000s", 2008, 96, 1431, 12),
    makeWR("Anquan Boldin", "Cardinals", "2000s", 2003, 101, 1377, 8),
    makeDEF("Cardinals Defense", "Cardinals", "2010s", 2015, 19.6, 36, 33),
    makeDEF("Cardinals Defense", "Cardinals", "2000s", 2009, 20.3, 43, 31)
  ],

  "Chargers": [
    makeQB("Dan Fouts", "Chargers", "1980s", 1981, 4802, 33, 17),
    makeQB("Justin Herbert", "Chargers", "2020s", 2021, 5014, 38, 15),
    makeRB("LaDainian Tomlinson", "Chargers", "2000s", 2006, 1815, 28, 56, 508, 3),
    makeRB("Austin Ekeler", "Chargers", "2020s", 2021, 911, 12, 70, 647, 8),
    makeWR("Lance Alworth", "Chargers", "1960s", 1965, 69, 1602, 14),
    makeWR("Keenan Allen", "Chargers", "2010s", 2017, 102, 1393, 6),
    makeDEF("Chargers Defense", "Chargers", "1960s", 1961, 15.4, 49, 66),
    makeDEF("Chargers Defense", "Chargers", "2000s", 2006, 18.9, 61, 31)
  ],

  "Chiefs": [
    makeQB("Patrick Mahomes", "Chiefs", "2010s", 2018, 5097, 50, 12),
    makeQB("Len Dawson", "Chiefs", "1960s", 1966, 2527, 26, 10),
    makeRB("Priest Holmes", "Chiefs", "2000s", 2002, 1615, 21, 70, 672, 3),
    makeRB("Jamaal Charles", "Chiefs", "2010s", 2013, 1287, 12, 70, 693, 7),
    makeWR("Tyreek Hill", "Chiefs", "2020s", 2020, 87, 1276, 15),
    makeWR("Otis Taylor", "Chiefs", "1970s", 1971, 57, 1110, 7),
    makeDEF("Chiefs Defense", "Chiefs", "1960s", 1969, 12.6, 45, 48),
    makeDEF("Chiefs Defense", "Chiefs", "2020s", 2023, 17.3, 57, 17)
  ],

  "Colts": [
    makeQB("Peyton Manning", "Colts", "2000s", 2004, 4557, 49, 10),
    makeQB("Johnny Unitas", "Colts", "1960s", 1963, 3481, 20, 12),
    makeRB("Edgerrin James", "Colts", "1990s", 1999, 1553, 13, 62, 586, 4),
    makeRB("Jonathan Taylor", "Colts", "2020s", 2021, 1811, 18, 40, 360, 2),
    makeWR("Marvin Harrison", "Colts", "2000s", 2002, 143, 1722, 11),
    makeWR("Reggie Wayne", "Colts", "2000s", 2007, 104, 1510, 10),
    makeDEF("Colts Defense", "Colts", "2000s", 2005, 15.4, 46, 31),
    makeDEF("Colts Defense", "Colts", "1960s", 1968, 10.3, 32, 42)
  ],

  "Commanders": [
    makeQB("Joe Theismann", "Commanders", "1980s", 1983, 3714, 29, 11),
    makeQB("Kirk Cousins", "Commanders", "2010s", 2016, 4917, 29, 12),
    makeRB("John Riggins", "Commanders", "1980s", 1983, 1347, 24, 0, 0, 0),
    makeRB("Clinton Portis", "Commanders", "2000s", 2005, 1516, 11, 30, 216, 0),
    makeWR("Art Monk", "Commanders", "1980s", 1984, 106, 1372, 7),
    makeWR("Santana Moss", "Commanders", "2000s", 2005, 84, 1483, 9),
    makeDEF("Commanders Defense", "Commanders", "1980s", 1983, 20.0, 61, 61),
    makeDEF("Commanders Defense", "Commanders", "1990s", 1991, 14.0, 55, 41)
  ],

  "Cowboys": [
    makeQB("Roger Staubach", "Cowboys", "1970s", 1978, 3190, 25, 16),
    makeQB("Troy Aikman", "Cowboys", "1990s", 1992, 3445, 23, 14),
    makeRB("Emmitt Smith", "Cowboys", "1990s", 1995, 1773, 25, 62, 375, 0),
    makeRB("Tony Dorsett", "Cowboys", "1980s", 1981, 1646, 4, 32, 325, 2),
    makeWR("Michael Irvin", "Cowboys", "1990s", 1991, 93, 1523, 8),
    makeWR("CeeDee Lamb", "Cowboys", "2020s", 2023, 135, 1749, 12),
    makeDEF("Cowboys Defense", "Cowboys", "1970s", 1977, 15.1, 53, 43),
    makeDEF("Cowboys Defense", "Cowboys", "1990s", 1992, 15.2, 44, 37)
  ],

  "Dolphins": [
    makeQB("Dan Marino", "Dolphins", "1980s", 1984, 5084, 48, 17),
    makeQB("Bob Griese", "Dolphins", "1970s", 1977, 2252, 22, 13),
    makeRB("Larry Csonka", "Dolphins", "1970s", 1972, 1117, 6, 15, 87, 0),
    makeRB("Ricky Williams", "Dolphins", "2000s", 2002, 1853, 16, 47, 363, 1),
    makeWR("Mark Clayton", "Dolphins", "1980s", 1984, 73, 1389, 18),
    makeWR("Tyreek Hill", "Dolphins", "2020s", 2023, 119, 1799, 13),
    makeWR("Paul Warfield", "Dolphins", "1970s", 1971, 43, 996, 11),
    makeDEF("Dolphins Defense", "Dolphins", "1970s", 1973, 10.7, 37, 38),
    makeDEF("Dolphins Defense", "Dolphins", "1990s", 1998, 16.6, 44, 31)
  ],

  "Eagles": [
    makeQB("Randall Cunningham", "Eagles", "1990s", 1990, 3466, 30, 13, 942, 5),
    makeQB("Jalen Hurts", "Eagles", "2020s", 2022, 3701, 22, 6, 760, 13),
    makeRB("LeSean McCoy", "Eagles", "2010s", 2013, 1607, 9, 52, 539, 2),
    makeRB("Saquon Barkley", "Eagles", "2020s", 2024, 2005, 13, 33, 278, 2),
    makeWR("Terrell Owens", "Eagles", "2000s", 2004, 77, 1200, 14),
    makeWR("A.J. Brown", "Eagles", "2020s", 2022, 88, 1496, 11),
    makeWR("Mike Quick", "Eagles", "1980s", 1983, 69, 1409, 13),
    makeDEF("Eagles Defense", "Eagles", "1990s", 1991, 15.0, 55, 48),
    makeDEF("Eagles Defense", "Eagles", "2010s", 2017, 18.4, 38, 31)
  ],

  "Falcons": [
    makeQB("Matt Ryan", "Falcons", "2010s", 2016, 4944, 38, 7),
    makeQB("Michael Vick", "Falcons", "2000s", 2006, 2474, 20, 13, 1039, 2),
    makeRB("Jamal Anderson", "Falcons", "1990s", 1998, 1846, 14, 27, 319, 2),
    makeRB("Michael Turner", "Falcons", "2000s", 2008, 1699, 17, 6, 41, 0),
    makeWR("Julio Jones", "Falcons", "2010s", 2015, 136, 1871, 8),
    makeWR("Roddy White", "Falcons", "2010s", 2010, 115, 1389, 10),
    makeDEF("Falcons Defense", "Falcons", "1970s", 1977, 9.2, 35, 42),
    makeDEF("Falcons Defense", "Falcons", "1990s", 1998, 18.1, 38, 36)
  ],

  "Giants": [
    makeQB("Eli Manning", "Giants", "2010s", 2011, 4933, 29, 16),
    makeQB("Phil Simms", "Giants", "1980s", 1986, 3487, 21, 22),
    makeRB("Tiki Barber", "Giants", "2000s", 2005, 1860, 9, 54, 530, 2),
    makeRB("Joe Morris", "Giants", "1980s", 1986, 1516, 14, 21, 223, 0),
    makeWR("Odell Beckham Jr.", "Giants", "2010s", 2015, 96, 1450, 13),
    makeWR("Amani Toomer", "Giants", "2000s", 2002, 82, 1343, 8),
    makeDEF("Giants Defense", "Giants", "1980s", 1986, 14.8, 59, 43),
    makeDEF("Giants Defense", "Giants", "2000s", 2007, 21.9, 53, 23)
  ],

  "Jaguars": [
    makeQB("Mark Brunell", "Jaguars", "1990s", 1996, 4367, 19, 20),
    makeQB("Trevor Lawrence", "Jaguars", "2020s", 2022, 4113, 25, 8),
    makeRB("Fred Taylor", "Jaguars", "1990s", 1998, 1223, 14, 44, 421, 2),
    makeRB("Maurice Jones-Drew", "Jaguars", "2010s", 2011, 1606, 8, 43, 374, 3),
    makeWR("Jimmy Smith", "Jaguars", "1990s", 1999, 116, 1636, 6),
    makeWR("Keenan McCardell", "Jaguars", "1990s", 1996, 85, 1129, 3),
    makeDEF("Jaguars Defense", "Jaguars", "2010s", 2017, 16.8, 55, 33),
    makeDEF("Jaguars Defense", "Jaguars", "1990s", 1999, 13.6, 57, 38)
  ],

  "Jets": [
    makeQB("Joe Namath", "Jets", "1960s", 1967, 4007, 26, 28),
    makeQB("Ryan Fitzpatrick", "Jets", "2010s", 2015, 3905, 31, 15),
    makeRB("Curtis Martin", "Jets", "2000s", 2004, 1697, 12, 41, 245, 2),
    makeRB("Breece Hall", "Jets", "2020s", 2023, 994, 5, 76, 591, 4),
    makeWR("Don Maynard", "Jets", "1960s", 1967, 71, 1434, 10),
    makeWR("Garrett Wilson", "Jets", "2020s", 2023, 95, 1042, 3),
    makeWR("Brandon Marshall", "Jets", "2010s", 2015, 109, 1502, 14),
    makeDEF("Jets Defense", "Jets", "2000s", 2009, 14.8, 32, 31),
    makeDEF("Jets Defense", "Jets", "2020s", 2022, 18.6, 45, 16)
  ],

  "Lions": [
    makeQB("Matthew Stafford", "Lions", "2010s", 2011, 5038, 41, 16),
    makeQB("Bobby Layne", "Lions", "1950s", 1951, 2403, 26, 23),
    makeRB("Barry Sanders", "Lions", "1990s", 1997, 2053, 11, 33, 305, 3),
    makeRB("Billy Sims", "Lions", "1980s", 1981, 1437, 13, 28, 451, 2),
    makeWR("Calvin Johnson", "Lions", "2010s", 2012, 122, 1964, 5),
    makeWR("Herman Moore", "Lions", "1990s", 1995, 123, 1686, 14),
    makeDEF("Lions Defense", "Lions", "2010s", 2014, 17.6, 42, 27),
    makeDEF("Lions Defense", "Lions", "1960s", 1962, 12.6, 45, 35)
  ],

  "Packers": [
    makeQB("Aaron Rodgers", "Packers", "2010s", 2011, 4643, 45, 6),
    makeQB("Brett Favre", "Packers", "1990s", 1996, 3899, 39, 13),
    makeRB("Ahman Green", "Packers", "2000s", 2003, 1883, 15, 50, 367, 5),
    makeRB("Jim Taylor", "Packers", "1960s", 1962, 1474, 19, 22, 106, 0),
    makeWR("Davante Adams", "Packers", "2020s", 2020, 115, 1374, 18),
    makeWR("Sterling Sharpe", "Packers", "1980s", 1989, 90, 1423, 12),
    makeWR("Jordy Nelson", "Packers", "2010s", 2014, 98, 1519, 13),
    makeDEF("Packers Defense", "Packers", "1960s", 1962, 10.6, 32, 50),
    makeDEF("Packers Defense", "Packers", "1990s", 1996, 13.1, 52, 43)
  ],

  "Panthers": [
    makeQB("Cam Newton", "Panthers", "2010s", 2015, 3837, 35, 10, 636, 10),
    makeQB("Jake Delhomme", "Panthers", "2000s", 2005, 3436, 24, 16),
    makeRB("Christian McCaffrey", "Panthers", "2010s", 2019, 1387, 15, 116, 1005, 4),
    makeRB("DeAngelo Williams", "Panthers", "2000s", 2008, 1515, 18, 22, 121, 2),
    makeWR("Steve Smith Sr.", "Panthers", "2000s", 2005, 103, 1563, 12),
    makeWR("Muhsin Muhammad", "Panthers", "2000s", 2004, 93, 1405, 16),
    makeDEF("Panthers Defense", "Panthers", "2010s", 2015, 19.3, 44, 39),
    makeDEF("Panthers Defense", "Panthers", "2000s", 2003, 19.0, 40, 37)
  ],

  "Patriots": [
    makeQB("Tom Brady", "Patriots", "2000s", 2007, 4806, 50, 8),
    makeQB("Drew Bledsoe", "Patriots", "1990s", 1996, 4086, 27, 15),
    makeRB("Corey Dillon", "Patriots", "2000s", 2004, 1635, 12, 15, 103, 1),
    makeRB("Curtis Martin", "Patriots", "1990s", 1995, 1487, 14, 30, 261, 1),
    makeWR("Randy Moss", "Patriots", "2000s", 2007, 98, 1493, 23),
    makeWR("Wes Welker", "Patriots", "2010s", 2011, 122, 1569, 9),
    makeDEF("Patriots Defense", "Patriots", "2010s", 2019, 14.1, 47, 36),
    makeDEF("Patriots Defense", "Patriots", "2000s", 2003, 14.9, 41, 29)
  ],

  "Raiders": [
    makeQB("Ken Stabler", "Raiders", "1970s", 1976, 2737, 27, 17),
    makeQB("Rich Gannon", "Raiders", "2000s", 2002, 4689, 26, 10),
    makeRB("Marcus Allen", "Raiders", "1980s", 1985, 1759, 11, 67, 555, 3),
    makeRB("Josh Jacobs", "Raiders", "2020s", 2022, 1653, 12, 53, 400, 0),
    makeWR("Tim Brown", "Raiders", "1990s", 1997, 104, 1408, 5),
    makeWR("Cliff Branch", "Raiders", "1970s", 1974, 60, 1092, 13),
    makeWR("Davante Adams", "Raiders", "2020s", 2022, 100, 1516, 14),
    makeDEF("Raiders Defense", "Raiders", "1980s", 1983, 21.1, 57, 45),
    makeDEF("Raiders Defense", "Raiders", "1970s", 1976, 16.9, 43, 39)
  ],

  "Rams": [
    makeQB("Kurt Warner", "Rams", "1990s", 1999, 4353, 41, 13),
    makeQB("Matthew Stafford", "Rams", "2020s", 2021, 4886, 41, 17),
    makeRB("Eric Dickerson", "Rams", "1980s", 1984, 2105, 14, 21, 139, 0),
    makeRB("Marshall Faulk", "Rams", "1990s", 1999, 1381, 7, 87, 1048, 5),
    makeWR("Cooper Kupp", "Rams", "2020s", 2021, 145, 1947, 16),
    makeWR("Torry Holt", "Rams", "2000s", 2003, 117, 1696, 12),
    makeWR("Isaac Bruce", "Rams", "1990s", 1995, 119, 1781, 13),
    makeDEF("Rams Defense", "Rams", "1970s", 1975, 9.6, 44, 39),
    makeDEF("Rams Defense", "Rams", "1990s", 1999, 15.1, 57, 36)
  ],

  "Ravens": [
    makeQB("Lamar Jackson", "Ravens", "2010s", 2019, 3127, 36, 6, 1206, 7),
    makeQB("Joe Flacco", "Ravens", "2010s", 2014, 3986, 27, 12),
    makeRB("Jamal Lewis", "Ravens", "2000s", 2003, 2066, 14, 26, 205, 0),
    makeRB("Ray Rice", "Ravens", "2010s", 2011, 1364, 12, 70, 704, 3),
    makeWR("Derrick Mason", "Ravens", "2000s", 2007, 103, 1087, 5),
    makeWR("Anquan Boldin", "Ravens", "2010s", 2010, 64, 837, 7),
    makeDEF("Ravens Defense", "Ravens", "2000s", 2000, 10.3, 35, 49),
    makeDEF("Ravens Defense", "Ravens", "2020s", 2023, 16.5, 60, 31)
  ],

  "Saints": [
    makeQB("Drew Brees", "Saints", "2010s", 2011, 5476, 46, 14),
    makeQB("Archie Manning", "Saints", "1970s", 1978, 3416, 17, 16),
    makeRB("Alvin Kamara", "Saints", "2020s", 2020, 932, 16, 83, 756, 5),
    makeRB("Deuce McAllister", "Saints", "2000s", 2003, 1641, 8, 69, 516, 0),
    makeWR("Michael Thomas", "Saints", "2010s", 2019, 149, 1725, 9),
    makeWR("Marques Colston", "Saints", "2000s", 2007, 98, 1202, 11),
    makeDEF("Saints Defense", "Saints", "1990s", 1992, 12.6, 57, 35),
    makeDEF("Saints Defense", "Saints", "2000s", 2009, 21.3, 39, 39)
  ],

  "Seahawks": [
    makeQB("Russell Wilson", "Seahawks", "2010s", 2015, 4024, 34, 8, 553, 1),
    makeQB("Matt Hasselbeck", "Seahawks", "2000s", 2005, 3459, 24, 9),
    makeRB("Shaun Alexander", "Seahawks", "2000s", 2005, 1880, 27, 15, 78, 1),
    makeRB("Marshawn Lynch", "Seahawks", "2010s", 2012, 1590, 11, 23, 196, 1),
    makeWR("Steve Largent", "Seahawks", "1980s", 1985, 79, 1287, 6),
    makeWR("DK Metcalf", "Seahawks", "2020s", 2020, 83, 1303, 10),
    makeDEF("Seahawks Defense", "Seahawks", "2010s", 2013, 14.4, 44, 39),
    makeDEF("Seahawks Defense", "Seahawks", "1980s", 1984, 17.8, 55, 63)
  ],

  "Steelers": [
    makeQB("Ben Roethlisberger", "Steelers", "2010s", 2014, 4952, 32, 9),
    makeQB("Terry Bradshaw", "Steelers", "1970s", 1978, 2915, 28, 20),
    makeRB("Franco Harris", "Steelers", "1970s", 1975, 1246, 10, 28, 214, 1),
    makeRB("Le'Veon Bell", "Steelers", "2010s", 2014, 1361, 8, 83, 854, 3),
    makeWR("Antonio Brown", "Steelers", "2010s", 2015, 136, 1834, 10),
    makeWR("Hines Ward", "Steelers", "2000s", 2002, 112, 1329, 14),
    makeWR("Lynn Swann", "Steelers", "1970s", 1978, 61, 880, 11),
    makeDEF("Steelers Defense", "Steelers", "1970s", 1976, 9.9, 46, 46),
    makeDEF("Steelers Defense", "Steelers", "2000s", 2008, 13.9, 51, 29)
  ],

  "Texans": [
    makeQB("Deshaun Watson", "Texans", "2010s", 2020, 4823, 33, 7),
    makeQB("Matt Schaub", "Texans", "2000s", 2009, 4770, 29, 15),
    makeRB("Arian Foster", "Texans", "2010s", 2010, 1616, 16, 66, 604, 2),
    makeRB("Joe Mixon", "Texans", "2020s", 2024, 1150, 14, 30, 250, 2),
    makeWR("DeAndre Hopkins", "Texans", "2010s", 2018, 115, 1572, 11),
    makeWR("Andre Johnson", "Texans", "2000s", 2008, 115, 1575, 8),
    makeDEF("Texans Defense", "Texans", "2010s", 2011, 17.4, 44, 22),
    makeDEF("Texans Defense", "Texans", "2010s", 2016, 20.5, 24, 11)
  ],

  "Titans": [
    makeQB("Warren Moon", "Titans", "1990s", 1990, 4689, 33, 13),
    makeQB("Steve McNair", "Titans", "2000s", 2003, 3215, 24, 7, 138, 4),
    makeRB("Earl Campbell", "Titans", "1970s", 1979, 1697, 19, 16, 94, 0),
    makeRB("Derrick Henry", "Titans", "2020s", 2020, 2027, 17, 19, 114, 0),
    makeWR("Charley Hennigan", "Titans", "1960s", 1961, 82, 1746, 12),
    makeWR("A.J. Brown", "Titans", "2020s", 2020, 70, 1075, 11),
    makeDEF("Titans Defense", "Titans", "2000s", 2000, 11.9, 55, 31),
    makeDEF("Titans Defense", "Titans", "2000s", 2008, 14.6, 44, 31)
  ],

  "Vikings": [
    makeQB("Fran Tarkenton", "Vikings", "1970s", 1975, 2994, 25, 13),
    makeQB("Daunte Culpepper", "Vikings", "2000s", 2004, 4717, 39, 11, 406, 2),
    makeRB("Adrian Peterson", "Vikings", "2010s", 2012, 2097, 12, 40, 217, 1),
    makeRB("Chuck Foreman", "Vikings", "1970s", 1975, 1070, 13, 73, 691, 9),
    makeWR("Randy Moss", "Vikings", "1990s", 1998, 69, 1313, 17),
    makeWR("Justin Jefferson", "Vikings", "2020s", 2022, 128, 1809, 8),
    makeWR("Cris Carter", "Vikings", "1990s", 1995, 122, 1371, 17),
    makeDEF("Vikings Defense", "Vikings", "1960s", 1969, 9.5, 49, 40),
    makeDEF("Vikings Defense", "Vikings", "1980s", 1988, 14.3, 42, 39)
  ]
};

// Flatten the grouped dictionary down into the array the game logic expects
const playerPool = Object.values(franchiseData).flat();

window.NFL17_PLAYERS = { franchiseData, playerPool };