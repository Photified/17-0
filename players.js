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
    "1940s": 1.25,
    "1950s": 1.22,
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
    70,
    100
  );

  return {
    slot: "QB",
    name, team, era, season, rating,
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
    70,
    100
  );

  return {
    slot: "RB",
    name, team, era, season, rating,
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
    70,
    100
  );

  return {
    slot: "WR",
    name, team, era, season, rating,
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
    70,
    100
  );

  return {
    slot: "DEF",
    name: `${season} ${name}`,
    team, era, season, rating,
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
// ---------------------------------------------------------

const franchiseData = {
  "49ers": [
    makeQB("Steve Young", "49ers", "1990s", 1994, 3969, 35, 10, 293, 7),
    makeQB("Joe Montana", "49ers", "1980s", 1989, 3521, 26, 8),
    makeQB("Jeff Garcia", "49ers", "2000s", 2000, 4278, 31, 10, 414, 4),
    makeQB("Brock Purdy", "49ers", "2020s", 2023, 4280, 31, 11, 144, 2),
    makeRB("Christian McCaffrey", "49ers", "2020s", 2023, 1459, 14, 67, 564, 7),
    makeRB("Frank Gore", "49ers", "2000s", 2006, 1695, 8, 61, 485, 1),
    makeRB("Roger Craig", "49ers", "1980s", 1985, 1050, 9, 92, 1016, 6),
    makeRB("Garrison Hearst", "49ers", "1990s", 1998, 1570, 7, 39, 535, 2),
    makeWR("Jerry Rice", "49ers", "1980s", 1987, 65, 1078, 22),
    makeWR("Terrell Owens", "49ers", "2000s", 2000, 97, 1451, 13),
    makeWR("Deebo Samuel", "49ers", "2020s", 2021, 77, 1405, 6),
    makeWR("George Kittle", "49ers", "2010s", 2018, 88, 1377, 5),
    makeWR("John Taylor", "49ers", "1980s", 1989, 60, 1077, 10),
    makeDEF("49ers Defense", "49ers", "2020s", 2022, 16.3, 44, 30),
    makeDEF("49ers Defense", "49ers", "1980s", 1984, 14.2, 51, 40),
    makeDEF("49ers Defense", "49ers", "2010s", 2011, 14.3, 42, 38)
  ],

  "Bears": [
    makeQB("Jay Cutler", "Bears", "2010s", 2014, 3812, 28, 18),
    makeQB("Sid Luckman", "Bears", "1940s", 1943, 2194, 28, 12),
    makeQB("Jim McMahon", "Bears", "1980s", 1985, 2392, 15, 11, 252, 3),
    makeQB("Justin Fields", "Bears", "2020s", 2022, 2242, 17, 11, 1143, 8),
    makeRB("Walter Payton", "Bears", "1970s", 1977, 1852, 14, 27, 269, 2),
    makeRB("Gale Sayers", "Bears", "1960s", 1965, 867, 14, 29, 507, 6),
    makeRB("Matt Forte", "Bears", "2010s", 2014, 1038, 6, 102, 808, 4),
    makeRB("Neal Anderson", "Bears", "1980s", 1989, 1275, 11, 50, 434, 4),
    makeWR("Brandon Marshall", "Bears", "2010s", 2012, 118, 1508, 11),
    makeWR("Alshon Jeffery", "Bears", "2010s", 2013, 89, 1421, 7),
    makeWR("Allen Robinson", "Bears", "2010s", 2020, 102, 1250, 6),
    makeWR("Johnny Morris", "Bears", "1960s", 1964, 93, 1200, 10),
    makeDEF("Bears Defense", "Bears", "1980s", 1985, 12.4, 64, 54),
    makeDEF("Bears Defense", "Bears", "2000s", 2006, 15.9, 40, 44),
    makeDEF("Bears Defense", "Bears", "2010s", 2018, 17.7, 50, 36)
  ],

  "Bengals": [
    makeQB("Joe Burrow", "Bengals", "2020s", 2021, 4611, 34, 14),
    makeQB("Ken Anderson", "Bengals", "1980s", 1981, 3754, 29, 10),
    makeQB("Boomer Esiason", "Bengals", "1980s", 1988, 3572, 28, 14, 248, 1),
    makeQB("Carson Palmer", "Bengals", "2000s", 2005, 3836, 32, 12),
    makeRB("Corey Dillon", "Bengals", "2000s", 2000, 1435, 7, 18, 121, 0),
    makeRB("Joe Mixon", "Bengals", "2020s", 2021, 1205, 13, 42, 314, 3),
    makeRB("Ickey Woods", "Bengals", "1980s", 1988, 1066, 15, 21, 199, 0),
    makeRB("James Brooks", "Bengals", "1980s", 1989, 1239, 7, 35, 306, 4),
    makeWR("Ja'Marr Chase", "Bengals", "2020s", 2021, 81, 1455, 13),
    makeWR("A.J. Green", "Bengals", "2010s", 2013, 98, 1426, 11),
    makeWR("Chad Johnson", "Bengals", "2000s", 2005, 97, 1432, 9),
    makeWR("Tee Higgins", "Bengals", "2020s", 2021, 74, 1091, 6),
    makeWR("Carl Pickens", "Bengals", "1990s", 1995, 99, 1234, 17),
    makeDEF("Bengals Defense", "Bengals", "1980s", 1988, 17.4, 43, 34),
    makeDEF("Bengals Defense", "Bengals", "2020s", 2022, 20.1, 30, 24),
    makeDEF("Bengals Defense", "Bengals", "2010s", 2015, 17.4, 42, 28)
  ],

  "Bills": [
    makeQB("Josh Allen", "Bills", "2020s", 2023, 4306, 29, 18, 524, 15),
    makeQB("Jim Kelly", "Bills", "1990s", 1991, 3844, 33, 17),
    makeQB("Jack Kemp", "Bills", "1960s", 1965, 2368, 10, 18, 166, 4),
    makeQB("Doug Flutie", "Bills", "1990s", 1998, 2711, 20, 11, 248, 1),
    makeRB("O.J. Simpson", "Bills", "1970s", 1973, 2003, 12, 6, 70, 0),
    makeRB("Thurman Thomas", "Bills", "1990s", 1991, 1407, 7, 62, 631, 5),
    makeRB("LeSean McCoy", "Bills", "2010s", 2017, 1138, 6, 59, 448, 2),
    makeRB("Fred Jackson", "Bills", "2000s", 2009, 1062, 2, 46, 371, 2),
    makeWR("Stefon Diggs", "Bills", "2020s", 2020, 127, 1535, 8),
    makeWR("Andre Reed", "Bills", "1980s", 1989, 88, 1312, 9),
    makeWR("Eric Moulds", "Bills", "1990s", 1998, 67, 1368, 9),
    makeWR("James Lofton", "Bills", "1990s", 1990, 35, 712, 4),
    makeDEF("Bills Defense", "Bills", "2020s", 2021, 17.0, 42, 30),
    makeDEF("Bills Defense", "Bills", "1990s", 1999, 14.3, 46, 38),
    makeDEF("Bills Defense", "Bills", "1990s", 1990, 16.3, 40, 35)
  ],

  "Broncos": [
    makeQB("John Elway", "Broncos", "1990s", 1993, 4030, 25, 10),
    makeQB("Peyton Manning", "Broncos", "2010s", 2013, 5477, 55, 10),
    makeQB("Craig Morton", "Broncos", "1970s", 1977, 1929, 14, 8),
    makeQB("Jake Plummer", "Broncos", "2000s", 2004, 4089, 27, 20),
    makeRB("Terrell Davis", "Broncos", "1990s", 1998, 2008, 21, 25, 217, 2),
    makeRB("Clinton Portis", "Broncos", "2000s", 2003, 1591, 14, 38, 314, 0),
    makeRB("Floyd Little", "Broncos", "1970s", 1971, 1133, 6, 26, 255, 0),
    makeRB("Javonte Williams", "Broncos", "2020s", 2021, 903, 4, 43, 316, 3),
    makeWR("Demaryius Thomas", "Broncos", "2010s", 2014, 111, 1619, 11),
    makeWR("Rod Smith", "Broncos", "2000s", 2000, 100, 1602, 8),
    makeWR("Shannon Sharpe", "Broncos", "1990s", 1996, 80, 1062, 10),
    makeWR("Emmanuel Sanders", "Broncos", "2010s", 2014, 101, 1404, 9),
    makeWR("Ed McCaffrey", "Broncos", "1990s", 1998, 64, 1053, 10),
    makeDEF("Broncos Defense", "Broncos", "2010s", 2015, 18.5, 52, 27),
    makeDEF("Broncos Defense", "Broncos", "1970s", 1977, 10.6, 44, 39),
    makeDEF("Broncos Defense", "Broncos", "1980s", 1989, 14.1, 44, 35)
  ],

  "Browns": [
    makeQB("Brian Sipe", "Browns", "1980s", 1980, 4132, 30, 14),
    makeQB("Otto Graham", "Browns", "1950s", 1953, 2722, 11, 9, 143, 6),
    makeQB("Bernie Kosar", "Browns", "1980s", 1986, 3854, 17, 10),
    makeQB("Baker Mayfield", "Browns", "2020s", 2020, 3563, 26, 8),
    makeRB("Jim Brown", "Browns", "1960s", 1963, 1863, 12, 24, 268, 3),
    makeRB("Nick Chubb", "Browns", "2020s", 2022, 1525, 12, 27, 239, 1),
    makeRB("Marion Motley", "Browns", "1950s", 1950, 810, 4, 11, 146, 0),
    makeRB("Earnest Byner", "Browns", "1980s", 1985, 1002, 8, 47, 460, 2),
    makeWR("Josh Gordon", "Browns", "2010s", 2013, 87, 1646, 9),
    makeWR("Paul Warfield", "Browns", "1960s", 1968, 50, 1067, 12),
    makeWR("Jarvis Landry", "Browns", "2010s", 2019, 83, 1174, 6),
    makeWR("Amari Cooper", "Browns", "2020s", 2023, 72, 1250, 5),
    makeWR("Ozzie Newsome", "Browns", "1980s", 1981, 69, 1002, 6),
    makeDEF("Browns Defense", "Browns", "1950s", 1953, 13.5, 35, 45),
    makeDEF("Browns Defense", "Browns", "2020s", 2023, 21.3, 49, 28),
    makeDEF("Browns Defense", "Browns", "1980s", 1989, 15.9, 41, 35)
  ],

  "Buccaneers": [
    makeQB("Tom Brady", "Buccaneers", "2020s", 2021, 5316, 43, 12),
    makeQB("Doug Williams", "Buccaneers", "1970s", 1979, 2448, 18, 24),
    makeQB("Brad Johnson", "Buccaneers", "2000s", 2002, 3049, 22, 6),
    makeQB("Jameis Winston", "Buccaneers", "2010s", 2019, 5109, 33, 30),
    makeRB("James Wilder", "Buccaneers", "1980s", 1984, 1544, 13, 85, 685, 0),
    makeRB("Mike Alstott", "Buccaneers", "1990s", 1999, 949, 7, 27, 239, 2),
    makeRB("Warrick Dunn", "Buccaneers", "1990s", 1997, 978, 4, 39, 462, 3),
    makeRB("Leonard Fournette", "Buccaneers", "2020s", 2021, 812, 8, 69, 454, 2),
    makeWR("Mike Evans", "Buccaneers", "2010s", 2018, 86, 1524, 8),
    makeWR("Chris Godwin", "Buccaneers", "2010s", 2019, 86, 1333, 9),
    makeWR("Keyshawn Johnson", "Buccaneers", "2000s", 2001, 106, 1266, 1),
    makeWR("Vincent Jackson", "Buccaneers", "2010s", 2012, 72, 1384, 8),
    makeDEF("Buccaneers Defense", "Buccaneers", "2000s", 2002, 12.3, 43, 38),
    makeDEF("Buccaneers Defense", "Buccaneers", "1990s", 1999, 14.7, 43, 38),
    makeDEF("Buccaneers Defense", "Buccaneers", "2020s", 2020, 22.2, 48, 25)
  ],

  "Cardinals": [
    makeQB("Kurt Warner", "Cardinals", "2000s", 2008, 4583, 30, 14),
    makeQB("Kyler Murray", "Cardinals", "2020s", 2020, 3971, 26, 12, 819, 11),
    makeQB("Carson Palmer", "Cardinals", "2010s", 2015, 4671, 35, 11),
    makeQB("Jim Hart", "Cardinals", "1970s", 1974, 2411, 20, 8),
    makeRB("David Johnson", "Cardinals", "2010s", 2016, 1239, 16, 80, 879, 4),
    makeRB("Ottis Anderson", "Cardinals", "1970s", 1979, 1605, 8, 41, 308, 2),
    makeRB("Edgerrin James", "Cardinals", "2000s", 2007, 1222, 7, 24, 204, 0),
    makeRB("James Conner", "Cardinals", "2020s", 2023, 1040, 7, 27, 165, 2),
    makeWR("Larry Fitzgerald", "Cardinals", "2000s", 2008, 96, 1431, 12),
    makeWR("Anquan Boldin", "Cardinals", "2000s", 2003, 101, 1377, 8),
    makeWR("DeAndre Hopkins", "Cardinals", "2020s", 2020, 115, 1407, 6),
    makeWR("Roy Green", "Cardinals", "1980s", 1984, 78, 1555, 12),
    makeDEF("Cardinals Defense", "Cardinals", "2010s", 2015, 19.6, 36, 33),
    makeDEF("Cardinals Defense", "Cardinals", "2000s", 2009, 20.3, 43, 31),
    makeDEF("Cardinals Defense", "Cardinals", "1970s", 1974, 15.6, 35, 41)
  ],

  "Chargers": [
    makeQB("Dan Fouts", "Chargers", "1980s", 1981, 4802, 33, 17),
    makeQB("Justin Herbert", "Chargers", "2020s", 2021, 5014, 38, 15),
    makeQB("Philip Rivers", "Chargers", "2000s", 2008, 4009, 34, 11),
    makeQB("Stan Humphries", "Chargers", "1990s", 1994, 3209, 17, 12),
    makeRB("LaDainian Tomlinson", "Chargers", "2000s", 2006, 1815, 28, 56, 508, 3),
    makeRB("Austin Ekeler", "Chargers", "2020s", 2021, 911, 12, 70, 647, 8),
    makeRB("Marion Butts", "Chargers", "1990s", 1990, 1225, 8, 11, 71, 0),
    makeRB("Chuck Muncie", "Chargers", "1980s", 1981, 1144, 19, 43, 362, 0),
    makeWR("Lance Alworth", "Chargers", "1960s", 1965, 69, 1602, 14),
    makeWR("Keenan Allen", "Chargers", "2010s", 2017, 102, 1393, 6),
    makeWR("Charlie Joiner", "Chargers", "1980s", 1981, 70, 1188, 7),
    makeWR("Vincent Jackson", "Chargers", "2000s", 2009, 68, 1167, 9),
    makeWR("Antonio Gates", "Chargers", "2000s", 2004, 81, 964, 13),
    makeDEF("Chargers Defense", "Chargers", "1960s", 1961, 15.4, 49, 66),
    makeDEF("Chargers Defense", "Chargers", "2000s", 2006, 18.9, 61, 31),
    makeDEF("Chargers Defense", "Chargers", "1990s", 1992, 16.1, 51, 36)
  ],

  "Chiefs": [
    makeQB("Patrick Mahomes", "Chiefs", "2010s", 2018, 5097, 50, 12),
    makeQB("Len Dawson", "Chiefs", "1960s", 1966, 2527, 26, 10),
    makeQB("Alex Smith", "Chiefs", "2010s", 2017, 4042, 26, 5, 355, 1),
    makeQB("Trent Green", "Chiefs", "2000s", 2003, 4039, 24, 12),
    makeRB("Priest Holmes", "Chiefs", "2000s", 2002, 1615, 21, 70, 672, 3),
    makeRB("Jamaal Charles", "Chiefs", "2010s", 2013, 1287, 12, 70, 693, 7),
    makeRB("Christian Okoye", "Chiefs", "1980s", 1989, 1480, 12, 2, 17, 0),
    makeRB("Larry Johnson", "Chiefs", "2000s", 2006, 1789, 17, 41, 410, 2),
    makeWR("Tyreek Hill", "Chiefs", "2020s", 2020, 87, 1276, 15),
    makeWR("Otis Taylor", "Chiefs", "1970s", 1971, 57, 1110, 7),
    makeWR("Travis Kelce", "Chiefs", "2020s", 2020, 105, 1416, 11),
    makeWR("Dante Hall", "Chiefs", "2000s", 2003, 40, 422, 3),
    makeDEF("Chiefs Defense", "Chiefs", "1960s", 1969, 12.6, 45, 48),
    makeDEF("Chiefs Defense", "Chiefs", "2020s", 2023, 17.3, 57, 17),
    makeDEF("Chiefs Defense", "Chiefs", "1990s", 1995, 15.1, 47, 34)
  ],

  "Colts": [
    makeQB("Peyton Manning", "Colts", "2000s", 2004, 4557, 49, 10),
    makeQB("Johnny Unitas", "Colts", "1960s", 1963, 3481, 20, 12),
    makeQB("Andrew Luck", "Colts", "2010s", 2014, 4761, 40, 16, 273, 3),
    makeQB("Bert Jones", "Colts", "1970s", 1976, 3104, 24, 9, 198, 2),
    makeRB("Edgerrin James", "Colts", "1990s", 1999, 1553, 13, 62, 586, 4),
    makeRB("Jonathan Taylor", "Colts", "2020s", 2021, 1811, 18, 40, 360, 2),
    makeRB("Marshall Faulk", "Colts", "1990s", 1998, 1319, 6, 86, 908, 4),
    makeRB("Eric Dickerson", "Colts", "1980s", 1988, 1659, 14, 36, 377, 1),
    makeWR("Marvin Harrison", "Colts", "2000s", 2002, 143, 1722, 11),
    makeWR("Reggie Wayne", "Colts", "2000s", 2007, 104, 1510, 10),
    makeWR("T.Y. Hilton", "Colts", "2010s", 2016, 91, 1448, 6),
    makeWR("Raymond Berry", "Colts", "1950s", 1959, 66, 959, 14),
    makeWR("Dallas Clark", "Colts", "2000s", 2009, 100, 1106, 10),
    makeDEF("Colts Defense", "Colts", "2000s", 2005, 15.4, 46, 31),
    makeDEF("Colts Defense", "Colts", "1960s", 1968, 10.3, 32, 42),
    makeDEF("Colts Defense", "Colts", "2000s", 2007, 16.4, 31, 35)
  ],

  "Commanders": [
    makeQB("Joe Theismann", "Commanders", "1980s", 1983, 3714, 29, 11),
    makeQB("Kirk Cousins", "Commanders", "2010s", 2016, 4917, 29, 12),
    makeQB("Mark Rypien", "Commanders", "1990s", 1991, 3564, 28, 11),
    makeQB("Sonny Jurgensen", "Commanders", "1960s", 1967, 3747, 31, 16),
    makeRB("John Riggins", "Commanders", "1980s", 1983, 1347, 24, 0, 0, 0),
    makeRB("Clinton Portis", "Commanders", "2000s", 2005, 1516, 11, 30, 216, 0),
    makeRB("Alfred Morris", "Commanders", "2010s", 2012, 1613, 13, 11, 77, 0),
    makeRB("Larry Brown", "Commanders", "1970s", 1972, 1216, 8, 32, 473, 4),
    makeWR("Art Monk", "Commanders", "1980s", 1984, 106, 1372, 7),
    makeWR("Santana Moss", "Commanders", "2000s", 2005, 84, 1483, 9),
    makeWR("Terry McLaurin", "Commanders", "2020s", 2022, 77, 1191, 5),
    makeWR("Gary Clark", "Commanders", "1990s", 1991, 70, 1340, 10),
    makeDEF("Commanders Defense", "Commanders", "1980s", 1983, 20.0, 61, 61),
    makeDEF("Commanders Defense", "Commanders", "1990s", 1991, 14.0, 55, 41),
    makeDEF("Commanders Defense", "Commanders", "1970s", 1972, 15.6, 38, 36)
  ],

  "Cowboys": [
    makeQB("Roger Staubach", "Cowboys", "1970s", 1978, 3190, 25, 16),
    makeQB("Troy Aikman", "Cowboys", "1990s", 1992, 3445, 23, 14),
    makeQB("Dak Prescott", "Cowboys", "2020s", 2023, 4516, 36, 9, 242, 2),
    makeQB("Tony Romo", "Cowboys", "2010s", 2014, 3705, 34, 9),
    makeRB("Emmitt Smith", "Cowboys", "1990s", 1995, 1773, 25, 62, 375, 0),
    makeRB("Tony Dorsett", "Cowboys", "1980s", 1981, 1646, 4, 32, 325, 2),
    makeRB("Ezekiel Elliott", "Cowboys", "2010s", 2016, 1631, 15, 32, 363, 1),
    makeRB("DeMarco Murray", "Cowboys", "2010s", 2014, 1845, 13, 57, 416, 0),
    makeWR("Michael Irvin", "Cowboys", "1990s", 1991, 93, 1523, 8),
    makeWR("CeeDee Lamb", "Cowboys", "2020s", 2023, 135, 1749, 12),
    makeWR("Dez Bryant", "Cowboys", "2010s", 2014, 88, 1320, 16),
    makeWR("Drew Pearson", "Cowboys", "1970s", 1977, 48, 870, 2),
    makeWR("Jason Witten", "Cowboys", "2000s", 2007, 96, 1145, 7),
    makeDEF("Cowboys Defense", "Cowboys", "1970s", 1977, 15.1, 53, 43),
    makeDEF("Cowboys Defense", "Cowboys", "1990s", 1992, 15.2, 44, 37),
    makeDEF("Cowboys Defense", "Cowboys", "2020s", 2021, 21.1, 41, 34)
  ],

  "Dolphins": [
    makeQB("Dan Marino", "Dolphins", "1980s", 1984, 5084, 48, 17),
    makeQB("Bob Griese", "Dolphins", "1970s", 1977, 2252, 22, 13),
    makeQB("Tua Tagovailoa", "Dolphins", "2020s", 2023, 4624, 29, 14),
    makeQB("Jay Fiedler", "Dolphins", "2000s", 2001, 3290, 20, 19),
    makeRB("Larry Csonka", "Dolphins", "1970s", 1972, 1117, 6, 15, 87, 0),
    makeRB("Ricky Williams", "Dolphins", "2000s", 2002, 1853, 16, 47, 363, 1),
    makeRB("Ronnie Brown", "Dolphins", "2000s", 2008, 916, 10, 33, 254, 0),
    makeRB("Mercury Morris", "Dolphins", "1970s", 1972, 1000, 12, 15, 168, 0),
    makeWR("Mark Clayton", "Dolphins", "1980s", 1984, 73, 1389, 18),
    makeWR("Tyreek Hill", "Dolphins", "2020s", 2023, 119, 1799, 13),
    makeWR("Paul Warfield", "Dolphins", "1970s", 1971, 43, 996, 11),
    makeWR("Jaylen Waddle", "Dolphins", "2020s", 2022, 75, 1356, 8),
    makeWR("Nat Moore", "Dolphins", "1970s", 1977, 52, 765, 12),
    makeDEF("Dolphins Defense", "Dolphins", "1970s", 1973, 10.7, 37, 38),
    makeDEF("Dolphins Defense", "Dolphins", "1990s", 1998, 16.6, 44, 31),
    makeDEF("Dolphins Defense", "Dolphins", "1970s", 1972, 12.2, 33, 26)
  ],

  "Eagles": [
    makeQB("Randall Cunningham", "Eagles", "1990s", 1990, 3466, 30, 13, 942, 5),
    makeQB("Jalen Hurts", "Eagles", "2020s", 2022, 3701, 22, 6, 760, 13),
    makeQB("Donovan McNabb", "Eagles", "2000s", 2004, 3875, 31, 8, 220, 3),
    makeQB("Nick Foles", "Eagles", "2010s", 2013, 2891, 27, 2),
    makeRB("LeSean McCoy", "Eagles", "2010s", 2013, 1607, 9, 52, 539, 2),
    makeRB("Saquon Barkley", "Eagles", "2020s", 2024, 2005, 13, 33, 278, 2),
    makeRB("Brian Westbrook", "Eagles", "2000s", 2007, 1333, 7, 90, 771, 5),
    makeRB("Miles Sanders", "Eagles", "2020s", 2022, 1269, 11, 20, 78, 0),
    makeWR("Terrell Owens", "Eagles", "2000s", 2004, 77, 1200, 14),
    makeWR("A.J. Brown", "Eagles", "2020s", 2022, 88, 1496, 11),
    makeWR("Mike Quick", "Eagles", "1980s", 1983, 69, 1409, 13),
    makeWR("DeSean Jackson", "Eagles", "2010s", 2013, 82, 1332, 9),
    makeWR("Harold Carmichael", "Eagles", "1970s", 1973, 67, 1116, 9),
    makeDEF("Eagles Defense", "Eagles", "1990s", 1991, 15.0, 55, 48),
    makeDEF("Eagles Defense", "Eagles", "2010s", 2017, 18.4, 38, 31),
    makeDEF("Eagles Defense", "Eagles", "2000s", 2004, 16.3, 47, 29)
  ],

  "Falcons": [
    makeQB("Matt Ryan", "Falcons", "2010s", 2016, 4944, 38, 7),
    makeQB("Michael Vick", "Falcons", "2000s", 2006, 2474, 20, 13, 1039, 2),
    makeQB("Chris Chandler", "Falcons", "1990s", 1998, 3154, 25, 12),
    makeQB("Steve Bartkowski", "Falcons", "1980s", 1980, 3544, 31, 16),
    makeRB("Jamal Anderson", "Falcons", "1990s", 1998, 1846, 14, 27, 319, 2),
    makeRB("Michael Turner", "Falcons", "2000s", 2008, 1699, 17, 6, 41, 0),
    makeRB("Devonta Freeman", "Falcons", "2010s", 2015, 1056, 11, 73, 578, 3),
    makeRB("Gerald Riggs", "Falcons", "1980s", 1985, 1719, 10, 33, 267, 0),
    makeWR("Julio Jones", "Falcons", "2010s", 2015, 136, 1871, 8),
    makeWR("Roddy White", "Falcons", "2010s", 2010, 115, 1389, 10),
    makeWR("Calvin Ridley", "Falcons", "2020s", 2020, 90, 1374, 9),
    makeWR("Terance Mathis", "Falcons", "1990s", 1994, 111, 1342, 11),
    makeDEF("Falcons Defense", "Falcons", "1970s", 1977, 9.2, 35, 42),
    makeDEF("Falcons Defense", "Falcons", "1990s", 1998, 18.1, 38, 36),
    makeDEF("Falcons Defense", "Falcons", "2010s", 2016, 25.4, 34, 22) // Fun but volatile
  ],

  "Giants": [
    makeQB("Eli Manning", "Giants", "2010s", 2011, 4933, 29, 16),
    makeQB("Phil Simms", "Giants", "1980s", 1986, 3487, 21, 22),
    makeQB("Y.A. Tittle", "Giants", "1960s", 1963, 3145, 36, 14),
    makeQB("Kerry Collins", "Giants", "2000s", 2000, 3610, 22, 13),
    makeRB("Tiki Barber", "Giants", "2000s", 2005, 1860, 9, 54, 530, 2),
    makeRB("Joe Morris", "Giants", "1980s", 1986, 1516, 14, 21, 223, 0),
    makeRB("Saquon Barkley", "Giants", "2010s", 2018, 1307, 11, 91, 721, 4),
    makeRB("Brandon Jacobs", "Giants", "2000s", 2008, 1089, 15, 6, 36, 0),
    makeWR("Odell Beckham Jr.", "Giants", "2010s", 2015, 96, 1450, 13),
    makeWR("Amani Toomer", "Giants", "2000s", 2002, 82, 1343, 8),
    makeWR("Victor Cruz", "Giants", "2010s", 2011, 82, 1536, 9),
    makeWR("Plaxico Burress", "Giants", "2000s", 2007, 70, 1025, 12),
    makeDEF("Giants Defense", "Giants", "1980s", 1986, 14.8, 59, 43),
    makeDEF("Giants Defense", "Giants", "2000s", 2007, 21.9, 53, 23),
    makeDEF("Giants Defense", "Giants", "1990s", 1990, 13.2, 30, 35)
  ],

  "Jaguars": [
    makeQB("Mark Brunell", "Jaguars", "1990s", 1996, 4367, 19, 20),
    makeQB("Trevor Lawrence", "Jaguars", "2020s", 2022, 4113, 25, 8),
    makeQB("David Garrard", "Jaguars", "2000s", 2007, 2509, 18, 3, 169, 0),
    makeQB("Blake Bortles", "Jaguars", "2010s", 2015, 4428, 35, 18, 310, 2),
    makeRB("Fred Taylor", "Jaguars", "1990s", 1998, 1223, 14, 44, 421, 2),
    makeRB("Maurice Jones-Drew", "Jaguars", "2010s", 2011, 1606, 8, 43, 374, 3),
    makeRB("James Robinson", "Jaguars", "2020s", 2020, 1070, 7, 49, 344, 3),
    makeRB("Leonard Fournette", "Jaguars", "2010s", 2017, 1040, 9, 36, 302, 1),
    makeWR("Jimmy Smith", "Jaguars", "1990s", 1999, 116, 1636, 6),
    makeWR("Keenan McCardell", "Jaguars", "1990s", 1996, 85, 1129, 3),
    makeWR("Allen Robinson", "Jaguars", "2010s", 2015, 80, 1400, 14),
    makeWR("Christian Kirk", "Jaguars", "2020s", 2022, 84, 1108, 8),
    makeDEF("Jaguars Defense", "Jaguars", "2010s", 2017, 16.8, 55, 33),
    makeDEF("Jaguars Defense", "Jaguars", "1990s", 1999, 13.6, 57, 38),
    makeDEF("Jaguars Defense", "Jaguars", "2000s", 2006, 14.8, 37, 24)
  ],

  "Jets": [
    makeQB("Joe Namath", "Jets", "1960s", 1967, 4007, 26, 28),
    makeQB("Ryan Fitzpatrick", "Jets", "2010s", 2015, 3905, 31, 15),
    makeQB("Ken O'Brien", "Jets", "1980s", 1985, 3888, 25, 8),
    makeQB("Chad Pennington", "Jets", "2000s", 2002, 3120, 22, 6),
    makeRB("Curtis Martin", "Jets", "2000s", 2004, 1697, 12, 41, 245, 2),
    makeRB("Breece Hall", "Jets", "2020s", 2023, 994, 5, 76, 591, 4),
    makeRB("Freeman McNeil", "Jets", "1980s", 1982, 786, 6, 18, 192, 1),
    makeRB("Thomas Jones", "Jets", "2000s", 2008, 1312, 13, 36, 207, 2),
    makeWR("Don Maynard", "Jets", "1960s", 1967, 71, 1434, 10),
    makeWR("Garrett Wilson", "Jets", "2020s", 2023, 95, 1042, 3),
    makeWR("Brandon Marshall", "Jets", "2010s", 2015, 109, 1502, 14),
    makeWR("Keyshawn Johnson", "Jets", "1990s", 1998, 83, 1131, 10),
    makeWR("Al Toon", "Jets", "1980s", 1988, 93, 1067, 5),
    makeDEF("Jets Defense", "Jets", "2000s", 2009, 14.8, 32, 31),
    makeDEF("Jets Defense", "Jets", "2020s", 2022, 18.6, 45, 16),
    makeDEF("Jets Defense", "Jets", "1960s", 1968, 20.0, 40, 25)
  ],

  "Lions": [
    makeQB("Matthew Stafford", "Lions", "2010s", 2011, 5038, 41, 16),
    makeQB("Bobby Layne", "Lions", "1950s", 1951, 2403, 26, 23),
    makeQB("Jared Goff", "Lions", "2020s", 2023, 4575, 30, 12),
    makeQB("Scott Mitchell", "Lions", "1990s", 1995, 4338, 32, 12),
    makeRB("Barry Sanders", "Lions", "1990s", 1997, 2053, 11, 33, 305, 3),
    makeRB("Billy Sims", "Lions", "1980s", 1981, 1437, 13, 28, 451, 2),
    makeRB("Jahmyr Gibbs", "Lions", "2020s", 2023, 945, 10, 52, 316, 1),
    makeRB("Kevin Jones", "Lions", "2000s", 2004, 1133, 5, 23, 129, 1),
    makeWR("Calvin Johnson", "Lions", "2010s", 2012, 122, 1964, 5),
    makeWR("Herman Moore", "Lions", "1990s", 1995, 123, 1686, 14),
    makeWR("Amon-Ra St. Brown", "Lions", "2020s", 2023, 119, 1515, 10),
    makeWR("Golden Tate", "Lions", "2010s", 2014, 99, 1331, 4),
    makeDEF("Lions Defense", "Lions", "2010s", 2014, 17.6, 42, 27),
    makeDEF("Lions Defense", "Lions", "1960s", 1962, 12.6, 45, 35),
    makeDEF("Lions Defense", "Lions", "2020s", 2023, 23.2, 41, 23)
  ],

  "Packers": [
    makeQB("Aaron Rodgers", "Packers", "2010s", 2011, 4643, 45, 6),
    makeQB("Brett Favre", "Packers", "1990s", 1996, 3899, 39, 13),
    makeQB("Bart Starr", "Packers", "1960s", 1966, 2257, 14, 3),
    makeQB("Jordan Love", "Packers", "2020s", 2023, 4159, 32, 11, 247, 4),
    makeRB("Ahman Green", "Packers", "2000s", 2003, 1883, 15, 50, 367, 5),
    makeRB("Jim Taylor", "Packers", "1960s", 1962, 1474, 19, 22, 106, 0),
    makeRB("Aaron Jones", "Packers", "2010s", 2019, 1084, 16, 49, 474, 3),
    makeRB("Dorsey Levens", "Packers", "1990s", 1997, 1435, 7, 53, 370, 5),
    makeWR("Davante Adams", "Packers", "2020s", 2020, 115, 1374, 18),
    makeWR("Sterling Sharpe", "Packers", "1980s", 1989, 90, 1423, 12),
    makeWR("Jordy Nelson", "Packers", "2010s", 2014, 98, 1519, 13),
    makeWR("Greg Jennings", "Packers", "2010s", 2010, 76, 1265, 12),
    makeWR("Donald Driver", "Packers", "2000s", 2006, 92, 1295, 8),
    makeDEF("Packers Defense", "Packers", "1960s", 1962, 10.6, 32, 50),
    makeDEF("Packers Defense", "Packers", "1990s", 1996, 13.1, 52, 43),
    makeDEF("Packers Defense", "Packers", "2010s", 2010, 15.0, 47, 32)
  ],

  "Panthers": [
    makeQB("Cam Newton", "Panthers", "2010s", 2015, 3837, 35, 10, 636, 10),
    makeQB("Jake Delhomme", "Panthers", "2000s", 2005, 3436, 24, 16),
    makeQB("Kerry Collins", "Panthers", "1990s", 1996, 2454, 14, 9),
    makeQB("Steve Beuerlein", "Panthers", "1990s", 1999, 4436, 36, 15),
    makeRB("Christian McCaffrey", "Panthers", "2010s", 2019, 1387, 15, 116, 1005, 4),
    makeRB("DeAngelo Williams", "Panthers", "2000s", 2008, 1515, 18, 22, 121, 2),
    makeRB("Jonathan Stewart", "Panthers", "2000s", 2009, 1133, 10, 18, 139, 1),
    makeRB("Stephen Davis", "Panthers", "2000s", 2003, 1444, 8, 14, 84, 0),
    makeWR("Steve Smith Sr.", "Panthers", "2000s", 2005, 103, 1563, 12),
    makeWR("Muhsin Muhammad", "Panthers", "2000s", 2004, 93, 1405, 16),
    makeWR("D.J. Moore", "Panthers", "2020s", 2020, 66, 1193, 4),
    makeWR("Kelvin Benjamin", "Panthers", "2010s", 2014, 73, 1008, 9),
    makeDEF("Panthers Defense", "Panthers", "2010s", 2015, 19.3, 44, 39),
    makeDEF("Panthers Defense", "Panthers", "2000s", 2003, 19.0, 40, 37),
    makeDEF("Panthers Defense", "Panthers", "1990s", 1996, 13.6, 60, 38)
  ],

  "Patriots": [
    makeQB("Tom Brady", "Patriots", "2000s", 2007, 4806, 50, 8),
    makeQB("Drew Bledsoe", "Patriots", "1990s", 1996, 4086, 27, 15),
    makeQB("Mac Jones", "Patriots", "2020s", 2021, 3801, 22, 13),
    makeQB("Steve Grogan", "Patriots", "1970s", 1979, 3286, 28, 20, 368, 2),
    makeRB("Corey Dillon", "Patriots", "2000s", 2004, 1635, 12, 15, 103, 1),
    makeRB("Curtis Martin", "Patriots", "1990s", 1995, 1487, 14, 30, 261, 1),
    makeRB("LeGarrette Blount", "Patriots", "2010s", 2016, 1161, 18, 7, 38, 0),
    makeRB("Kevin Faulk", "Patriots", "2000s", 2003, 638, 0, 48, 440, 0),
    makeWR("Randy Moss", "Patriots", "2000s", 2007, 98, 1493, 23),
    makeWR("Wes Welker", "Patriots", "2010s", 2011, 122, 1569, 9),
    makeWR("Julian Edelman", "Patriots", "2010s", 2013, 105, 1056, 6),
    makeWR("Rob Gronkowski", "Patriots", "2010s", 2011, 90, 1327, 17),
    makeWR("Stanley Morgan", "Patriots", "1980s", 1986, 84, 1491, 10),
    makeDEF("Patriots Defense", "Patriots", "2010s", 2019, 14.1, 47, 36),
    makeDEF("Patriots Defense", "Patriots", "2000s", 2003, 14.9, 41, 29),
    makeDEF("Patriots Defense", "Patriots", "2000s", 2004, 16.2, 45, 30)
  ],

  "Raiders": [
    makeQB("Ken Stabler", "Raiders", "1970s", 1976, 2737, 27, 17),
    makeQB("Rich Gannon", "Raiders", "2000s", 2002, 4689, 26, 10),
    makeQB("Derek Carr", "Raiders", "2010s", 2016, 3937, 28, 6),
    makeQB("Jim Plunkett", "Raiders", "1980s", 1980, 2299, 18, 16),
    makeRB("Marcus Allen", "Raiders", "1980s", 1985, 1759, 11, 67, 555, 3),
    makeRB("Josh Jacobs", "Raiders", "2020s", 2022, 1653, 12, 53, 400, 0),
    makeRB("Bo Jackson", "Raiders", "1980s", 1989, 950, 4, 9, 69, 0),
    makeRB("Darren McFadden", "Raiders", "2010s", 2011, 614, 4, 19, 154, 1),
    makeWR("Tim Brown", "Raiders", "1990s", 1997, 104, 1408, 5),
    makeWR("Cliff Branch", "Raiders", "1970s", 1974, 60, 1092, 13),
    makeWR("Davante Adams", "Raiders", "2020s", 2022, 100, 1516, 14),
    makeWR("Fred Biletnikoff", "Raiders", "1970s", 1971, 61, 929, 9),
    makeWR("Amari Cooper", "Raiders", "2010s", 2016, 83, 1153, 5),
    makeDEF("Raiders Defense", "Raiders", "1980s", 1983, 21.1, 57, 45),
    makeDEF("Raiders Defense", "Raiders", "1970s", 1976, 16.9, 43, 39),
    makeDEF("Raiders Defense", "Raiders", "2000s", 2002, 19.0, 43, 29)
  ],

  "Rams": [
    makeQB("Kurt Warner", "Rams", "1990s", 1999, 4353, 41, 13),
    makeQB("Matthew Stafford", "Rams", "2020s", 2021, 4886, 41, 17),
    makeQB("Jared Goff", "Rams", "2010s", 2018, 4688, 32, 12),
    makeQB("Roman Gabriel", "Rams", "1960s", 1969, 2549, 24, 7),
    makeRB("Eric Dickerson", "Rams", "1980s", 1984, 2105, 14, 21, 139, 0),
    makeRB("Marshall Faulk", "Rams", "1990s", 1999, 1381, 7, 87, 1048, 5),
    makeRB("Todd Gurley", "Rams", "2010s", 2017, 1305, 13, 64, 788, 6),
    makeRB("Steven Jackson", "Rams", "2000s", 2006, 1528, 13, 90, 806, 3),
    makeWR("Cooper Kupp", "Rams", "2020s", 2021, 145, 1947, 16),
    makeWR("Torry Holt", "Rams", "2000s", 2003, 117, 1696, 12),
    makeWR("Isaac Bruce", "Rams", "1990s", 1995, 119, 1781, 13),
    makeWR("Puka Nacua", "Rams", "2020s", 2023, 105, 1486, 6),
    makeWR("Elroy Hirsch", "Rams", "1950s", 1951, 66, 1495, 17),
    makeDEF("Rams Defense", "Rams", "1970s", 1975, 9.6, 44, 39),
    makeDEF("Rams Defense", "Rams", "1990s", 1999, 15.1, 57, 36),
    makeDEF("Rams Defense", "Rams", "2020s", 2021, 21.9, 50, 25)
  ],

  "Ravens": [
    makeQB("Lamar Jackson", "Ravens", "2010s", 2019, 3127, 36, 6, 1206, 7),
    makeQB("Joe Flacco", "Ravens", "2010s", 2014, 3986, 27, 12),
    makeQB("Steve McNair", "Ravens", "2000s", 2006, 3050, 16, 12),
    makeQB("Vinny Testaverde", "Ravens", "1990s", 1996, 4177, 33, 19),
    makeRB("Jamal Lewis", "Ravens", "2000s", 2003, 2066, 14, 26, 205, 0),
    makeRB("Ray Rice", "Ravens", "2010s", 2011, 1364, 12, 70, 704, 3),
    makeRB("Willis McGahee", "Ravens", "2000s", 2007, 1207, 7, 43, 231, 1),
    makeRB("Mark Ingram", "Ravens", "2010s", 2019, 1018, 10, 26, 247, 5),
    makeWR("Derrick Mason", "Ravens", "2000s", 2007, 103, 1087, 5),
    makeWR("Anquan Boldin", "Ravens", "2010s", 2010, 64, 837, 7),
    makeWR("Mark Andrews", "Ravens", "2020s", 2021, 107, 1361, 9),
    makeWR("Torrey Smith", "Ravens", "2010s", 2013, 65, 1128, 4),
    makeDEF("Ravens Defense", "Ravens", "2000s", 2000, 10.3, 35, 49),
    makeDEF("Ravens Defense", "Ravens", "2020s", 2023, 16.5, 60, 31),
    makeDEF("Ravens Defense", "Ravens", "2000s", 2006, 12.6, 60, 40)
  ],

  "Saints": [
    makeQB("Drew Brees", "Saints", "2010s", 2011, 5476, 46, 14),
    makeQB("Archie Manning", "Saints", "1970s", 1978, 3416, 17, 16),
    makeQB("Aaron Brooks", "Saints", "2000s", 2003, 3546, 24, 8),
    makeQB("Bobby Hebert", "Saints", "1990s", 1992, 3287, 19, 16),
    makeRB("Alvin Kamara", "Saints", "2020s", 2020, 932, 16, 83, 756, 5),
    makeRB("Deuce McAllister", "Saints", "2000s", 2003, 1641, 8, 69, 516, 0),
    makeRB("Mark Ingram", "Saints", "2010s", 2017, 1124, 12, 58, 416, 0),
    makeRB("Pierre Thomas", "Saints", "2000s", 2009, 793, 6, 39, 302, 2),
    makeWR("Michael Thomas", "Saints", "2010s", 2019, 149, 1725, 9),
    makeWR("Marques Colston", "Saints", "2000s", 2007, 98, 1202, 11),
    makeWR("Joe Horn", "Saints", "2000s", 2004, 94, 1399, 11),
    makeWR("Chris Olave", "Saints", "2020s", 2023, 87, 1123, 5),
    makeDEF("Saints Defense", "Saints", "1990s", 1992, 12.6, 57, 35),
    makeDEF("Saints Defense", "Saints", "2000s", 2009, 21.3, 39, 39),
    makeDEF("Saints Defense", "Saints", "2010s", 2013, 19.0, 49, 19)
  ],

  "Seahawks": [
    makeQB("Russell Wilson", "Seahawks", "2010s", 2015, 4024, 34, 8, 553, 1),
    makeQB("Matt Hasselbeck", "Seahawks", "2000s", 2005, 3459, 24, 9),
    makeQB("Dave Krieg", "Seahawks", "1980s", 1984, 3671, 32, 24),
    makeQB("Geno Smith", "Seahawks", "2020s", 2022, 4282, 30, 11, 366, 1),
    makeRB("Shaun Alexander", "Seahawks", "2000s", 2005, 1880, 27, 15, 78, 1),
    makeRB("Marshawn Lynch", "Seahawks", "2010s", 2012, 1590, 11, 23, 196, 1),
    makeRB("Chris Carson", "Seahawks", "2010s", 2019, 1230, 7, 37, 266, 2),
    makeRB("Curt Warner", "Seahawks", "1980s", 1983, 1449, 13, 42, 325, 1),
    makeWR("Steve Largent", "Seahawks", "1980s", 1985, 79, 1287, 6),
    makeWR("DK Metcalf", "Seahawks", "2020s", 2020, 83, 1303, 10),
    makeWR("Tyler Lockett", "Seahawks", "2020s", 2021, 73, 1175, 8),
    makeWR("Doug Baldwin", "Seahawks", "2010s", 2015, 78, 1069, 14),
    makeDEF("Seahawks Defense", "Seahawks", "2010s", 2013, 14.4, 44, 39),
    makeDEF("Seahawks Defense", "Seahawks", "1980s", 1984, 17.8, 55, 63),
    makeDEF("Seahawks Defense", "Seahawks", "2010s", 2014, 15.9, 37, 24)
  ],

  "Steelers": [
    makeQB("Ben Roethlisberger", "Steelers", "2010s", 2014, 4952, 32, 9),
    makeQB("Terry Bradshaw", "Steelers", "1970s", 1978, 2915, 28, 20),
    makeQB("Kordell Stewart", "Steelers", "2000s", 2001, 3109, 14, 11, 537, 5),
    makeQB("Neil O'Donnell", "Steelers", "1990s", 1995, 2970, 17, 7),
    makeRB("Franco Harris", "Steelers", "1970s", 1975, 1246, 10, 28, 214, 1),
    makeRB("Le'Veon Bell", "Steelers", "2010s", 2014, 1361, 8, 83, 854, 3),
    makeRB("Jerome Bettis", "Steelers", "1990s", 1997, 1665, 7, 17, 110, 2),
    makeRB("Willie Parker", "Steelers", "2000s", 2006, 1494, 13, 31, 222, 3),
    makeWR("Antonio Brown", "Steelers", "2010s", 2015, 136, 1834, 10),
    makeWR("Hines Ward", "Steelers", "2000s", 2002, 112, 1329, 14),
    makeWR("Lynn Swann", "Steelers", "1970s", 1978, 61, 880, 11),
    makeWR("John Stallworth", "Steelers", "1970s", 1979, 70, 1183, 8),
    makeWR("JuJu Smith-Schuster", "Steelers", "2010s", 2018, 111, 1426, 7),
    makeDEF("Steelers Defense", "Steelers", "1970s", 1976, 9.9, 46, 46),
    makeDEF("Steelers Defense", "Steelers", "2000s", 2008, 13.9, 51, 29),
    makeDEF("Steelers Defense", "Steelers", "2010s", 2010, 14.5, 48, 35)
  ],

  "Texans": [
    makeQB("Deshaun Watson", "Texans", "2010s", 2020, 4823, 33, 7),
    makeQB("Matt Schaub", "Texans", "2000s", 2009, 4770, 29, 15),
    makeQB("C.J. Stroud", "Texans", "2020s", 2023, 4108, 23, 5),
    makeRB("Arian Foster", "Texans", "2010s", 2010, 1616, 16, 66, 604, 2),
    makeRB("Joe Mixon", "Texans", "2020s", 2024, 1150, 14, 30, 250, 2),
    makeRB("Dameon Pierce", "Texans", "2020s", 2022, 939, 4, 30, 165, 1),
    makeRB("Domanick Davis", "Texans", "2000s", 2003, 1031, 8, 47, 351, 0),
    makeWR("DeAndre Hopkins", "Texans", "2010s", 2018, 115, 1572, 11),
    makeWR("Andre Johnson", "Texans", "2000s", 2008, 115, 1575, 8),
    makeWR("Tank Dell", "Texans", "2020s", 2023, 47, 709, 7),
    makeWR("Will Fuller", "Texans", "2020s", 2020, 53, 879, 8),
    makeDEF("Texans Defense", "Texans", "2010s", 2011, 17.4, 44, 22),
    makeDEF("Texans Defense", "Texans", "2010s", 2016, 20.5, 24, 11),
    makeDEF("Texans Defense", "Texans", "2020s", 2023, 20.8, 46, 24)
  ],

  "Titans": [
    makeQB("Warren Moon", "Titans", "1990s", 1990, 4689, 33, 13),
    makeQB("Steve McNair", "Titans", "2000s", 2003, 3215, 24, 7, 138, 4),
    makeQB("Ryan Tannehill", "Titans", "2020s", 2020, 3819, 33, 7, 266, 7),
    makeQB("George Blanda", "Titans", "1960s", 1961, 3330, 36, 22),
    makeRB("Earl Campbell", "Titans", "1970s", 1979, 1697, 19, 16, 94, 0),
    makeRB("Derrick Henry", "Titans", "2020s", 2020, 2027, 17, 19, 114, 0),
    makeRB("Chris Johnson", "Titans", "2000s", 2009, 2006, 14, 50, 503, 2),
    makeRB("Eddie George", "Titans", "2000s", 2000, 1509, 14, 50, 453, 2),
    makeWR("Charley Hennigan", "Titans", "1960s", 1961, 82, 1746, 12),
    makeWR("A.J. Brown", "Titans", "2020s", 2020, 70, 1075, 11),
    makeWR("Drew Hill", "Titans", "1980s", 1985, 74, 1169, 9),
    makeWR("Derrick Mason", "Titans", "2000s", 2003, 95, 1303, 8),
    makeDEF("Titans Defense", "Titans", "2000s", 2000, 11.9, 55, 31),
    makeDEF("Titans Defense", "Titans", "2000s", 2008, 14.6, 44, 31),
    makeDEF("Titans Defense", "Titans", "1990s", 1993, 14.8, 39, 34)
  ],

  "Vikings": [
    makeQB("Fran Tarkenton", "Vikings", "1970s", 1975, 2994, 25, 13),
    makeQB("Daunte Culpepper", "Vikings", "2000s", 2004, 4717, 39, 11, 406, 2),
    makeQB("Kirk Cousins", "Vikings", "2020s", 2021, 4221, 33, 7),
    makeQB("Randall Cunningham", "Vikings", "1990s", 1998, 3704, 34, 10),
    makeRB("Adrian Peterson", "Vikings", "2010s", 2012, 2097, 12, 40, 217, 1),
    makeRB("Chuck Foreman", "Vikings", "1970s", 1975, 1070, 13, 73, 691, 9),
    makeRB("Dalvin Cook", "Vikings", "2020s", 2020, 1557, 16, 44, 361, 1),
    makeRB("Robert Smith", "Vikings", "2000s", 2000, 1521, 7, 36, 348, 3),
    makeWR("Randy Moss", "Vikings", "1990s", 1998, 69, 1313, 17),
    makeWR("Justin Jefferson", "Vikings", "2020s", 2022, 128, 1809, 8),
    makeWR("Cris Carter", "Vikings", "1990s", 1995, 122, 1371, 17),
    makeWR("Adam Thielen", "Vikings", "2010s", 2018, 113, 1373, 9),
    makeWR("Stefon Diggs", "Vikings", "2010s", 2018, 102, 1021, 9),
    makeDEF("Vikings Defense", "Vikings", "1960s", 1969, 9.5, 49, 40),
    makeDEF("Vikings Defense", "Vikings", "1980s", 1988, 14.3, 42, 39),
    makeDEF("Vikings Defense", "Vikings", "2010s", 2017, 15.8, 37, 19)
  ]
};

// Flatten the grouped dictionary down into the array the game logic expects
const playerPool = Object.values(franchiseData).flat();

window.NFL17_PLAYERS = { franchiseData, playerPool };