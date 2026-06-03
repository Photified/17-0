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

const QBs = [
  // === 1960s ===
  makeQB("Johnny Unitas","Colts","1960s",1963,3481,20,12),
  makeQB("Bart Starr","Packers","1960s",1966,2257,14,3),
  makeQB("Y.A. Tittle","Giants","1960s",1963,3145,36,14),
  makeQB("Joe Namath","Jets","1960s",1967,4007,26,28),
  makeQB("Len Dawson","Chiefs","1960s",1962,2759,29,17),
  makeQB("George Blanda","Oilers","1960s",1961,3330,36,22),
  makeQB("John Brodie","49ers","1960s",1965,3112,30,16),
  makeQB("Don Meredith","Cowboys","1960s",1966,2805,24,12),
  makeQB("Roman Gabriel","Rams","1960s",1969,2549,24,7),
  makeQB("Jack Kemp","Bills","1960s",1964,2285,9,26),
  makeQB("Frank Ryan","Browns","1960s",1964,2404,25,19),
  makeQB("Sonny Jurgensen","Redskins","1960s",1967,3747,31,16),
  makeQB("Fran Tarkenton","Vikings","1960s",1964,2506,22,11),
  makeQB("Billy Kilmer","Saints","1960s",1969,2532,16,17),
  makeQB("Daryle Lamonica","Raiders","1960s",1969,3302,34,25),
  makeQB("Charley Johnson","Cardinals","1960s",1964,3045,21,24),
  makeQB("Bill Nelsen","Steelers","1960s",1966,2110,14,15),
  makeQB("Steve Tensi","Broncos","1960s",1967,1812,12,17),
  makeQB("John Hadl","Chargers","1960s",1968,3473,27,26),
  makeQB("Norm Snead","Eagles","1960s",1967,3399,29,24),
  makeQB("Rudy Bukich","Bears","1960s",1965,2641,20,9),
  makeQB("Greg Landry","Lions","1960s",1969,1532,9,11),

  // === 1970s ===
  makeQB("Roger Staubach","Cowboys","1970s",1978,3190,25,16),
  makeQB("Terry Bradshaw","Steelers","1970s",1978,2915,28,20),
  makeQB("Ken Stabler","Raiders","1970s",1976,2737,27,17),
  makeQB("Bob Griese","Dolphins","1970s",1977,2252,22,13),
  makeQB("Dan Fouts","Chargers","1970s",1979,4082,24,24),
  makeQB("Archie Manning","Saints","1970s",1978,3416,17,16),
  makeQB("Ken Anderson","Bengals","1970s",1975,3111,21,11),
  makeQB("Jim Hart","Cardinals","1970s",1974,2411,20,8),
  makeQB("Steve Bartkowski","Falcons","1970s",1979,2502,17,15),
  makeQB("Doug Williams","Buccaneers","1970s",1979,2448,18,24),
  makeQB("Jim Zorn","Seahawks","1970s",1978,3283,15,20),
  makeQB("Joe Ferguson","Bills","1970s",1975,2556,25,24),
  makeQB("Craig Morton","Broncos","1970s",1977,1929,14,8),
  makeQB("James Harris","Rams","1970s",1974,1544,11,6),
  makeQB("Greg Landry","Lions","1970s",1971,2237,16,13),
  makeQB("Bob Avellini","Bears","1970s",1977,2004,11,18),
  makeQB("Brian Sipe","Browns","1970s",1979,3793,28,26),

  // === 1980s ===
  makeQB("Dan Marino","Dolphins","1980s",1984,5084,48,17),
  makeQB("Joe Montana","49ers","1980s",1989,3521,26,8),
  makeQB("John Elway","Broncos","1980s",1987,3198,19,12),
  makeQB("Warren Moon","Oilers","1980s",1988,3031,17,18),
  makeQB("Jim Kelly","Bills","1980s",1989,3130,25,18),
  makeQB("Phil Simms","Giants","1980s",1986,3487,21,22),
  makeQB("Randall Cunningham","Eagles","1980s",1988,3808,24,16),
  makeQB("Boomer Esiason","Bengals","1980s",1988,3572,28,14),
  makeQB("Dave Krieg","Seahawks","1980s",1984,3671,32,24),
  makeQB("Bobby Hebert","Saints","1980s",1989,2686,15,15),
  makeQB("Joe Theismann","Redskins","1980s",1983,3714,29,11),
  makeQB("Danny White","Cowboys","1980s",1983,3915,29,17),
  makeQB("Tommy Kramer","Vikings","1980s",1986,3000,24,10),
  makeQB("Jim McMahon","Bears","1980s",1985,2392,15,11),
  makeQB("Steve Grogan","Patriots","1980s",1980,2475,18,22),
  makeQB("Ken O'Brien","Jets","1980s",1985,3888,25,8),
  makeQB("Steve DeBerg","Buccaneers","1980s",1984,3554,19,17),

  // === 1990s ===
  makeQB("Steve Young","49ers","1990s",1994,3969,35,10),
  makeQB("Brett Favre","Packers","1990s",1996,3899,39,13),
  makeQB("Kurt Warner","Rams","1990s",1999,4353,41,13),
  makeQB("Troy Aikman","Cowboys","1990s",1992,3445,23,14),
  makeQB("Drew Bledsoe","Patriots","1990s",1996,4086,27,15),
  makeQB("Vinny Testaverde","Jets","1990s",1998,3256,29,7),
  makeQB("Mark Brunell","Jaguars","1990s",1996,4367,19,20),
  makeQB("Chris Chandler","Falcons","1990s",1998,3154,25,12),
  makeQB("Trent Dilfer","Buccaneers","1990s",1997,2555,21,11),
  makeQB("Jake Plummer","Cardinals","1990s",1998,3737,17,20),
  makeQB("Kerry Collins","Panthers","1990s",1996,2454,14,9),
  makeQB("Vinny Testaverde","Ravens","1990s",1996,4177,33,19),
  makeQB("Jim Harbaugh","Colts","1990s",1995,2575,17,5),

  // === 2000s ===
  makeQB("Tom Brady","Patriots","2000s",2007,4806,50,8),
  makeQB("Peyton Manning","Colts","2000s",2004,4557,49,10),
  makeQB("Drew Brees","Saints","2000s",2009,4388,34,11),
  makeQB("Eli Manning","Giants","2000s",2009,4021,27,14),
  makeQB("Matt Schaub","Texans","2000s",2009,4770,29,15),
  makeQB("Michael Vick","Falcons","2000s",2006,2474,20,13,1039,2),
  makeQB("Ben Roethlisberger","Steelers","2000s",2009,4328,26,12),
  makeQB("Tim Couch","Browns","2000s",2002,2842,18,18),
  makeQB("Jake Delhomme","Panthers","2000s",2004,3886,29,15),
  makeQB("David Garrard","Jaguars","2000s",2007,3209,18,3),

  // === 2010s ===
  makeQB("Aaron Rodgers","Packers","2010s",2011,4643,45,6),
  makeQB("Patrick Mahomes","Chiefs","2010s",2018,5097,50,12),
  makeQB("Russell Wilson","Seahawks","2010s",2015,4024,34,8),
  makeQB("Cam Newton","Panthers","2010s",2015,3837,35,10),
  makeQB("Lamar Jackson","Ravens","2010s",2019,3127,36,6),
  makeQB("Deshaun Watson","Texans","2010s",2018,4165,26,9),
  makeQB("Baker Mayfield","Browns","2010s",2018,3725,27,14),
  makeQB("Ryan Fitzpatrick","Jets","2010s",2015,3905,31,15),
  makeQB("Jameis Winston","Buccaneers","2010s",2019,5109,33,30),

  // === 2020s ===
  makeQB("Josh Allen","Bills","2020s",2023,4306,29,18),
  makeQB("Joe Burrow","Bengals","2020s",2021,4611,34,14),
  makeQB("Justin Herbert","Chargers","2020s",2021,5014,38,15),
  makeQB("Jalen Hurts","Eagles","2020s",2022,3701,22,6),
  makeQB("Dak Prescott","Cowboys","2020s",2023,4516,36,9),
  makeQB("Tua Tagovailoa","Dolphins","2020s",2023,4624,29,14),
  makeQB("C.J. Stroud","Texans","2020s",2023,4108,23,5),
  makeQB("Geno Smith","Seahawks","2020s",2022,4282,30,11),
  makeQB("Trevor Lawrence","Jaguars","2020s",2022,4113,25,8),
  makeQB("Kyler Murray","Cardinals","2020s",2021,3787,24,10),
  makeQB("Zach Wilson","Jets","2020s",2021,2334,9,11)
];

const RBs = [
  // === 1960s ===
  makeRB("Jim Brown","Browns","1960s",1963,1863,12,24,268,3),
  makeRB("Gale Sayers","Bears","1960s",1965,867,14,29,507,6),
  makeRB("Leroy Kelly","Browns","1960s",1968,1239,16,25,297,4),
  makeRB("Paul Hornung","Packers","1960s",1960,671,13,28,257,2),
  makeRB("Abner Haynes","Chiefs","1960s",1962,1049,13,39,573,6),
  makeRB("Clem Daniels","Raiders","1960s",1963,1099,3,30,685,5),
  makeRB("Cookie Gilchrist","Bills","1960s",1962,1096,13,15,153,1),

  // === 1970s ===
  makeRB("O.J. Simpson","Bills","1970s",1973,2003,12,6,70,0),
  makeRB("Walter Payton","Bears","1970s",1977,1852,14,27,269,2),
  makeRB("Earl Campbell","Oilers","1970s",1979,1697,19,16,94,0),
  makeRB("Franco Harris","Steelers","1970s",1975,1246,10,28,214,1),
  makeRB("Chuck Foreman","Vikings","1970s",1975,1070,13,73,691,9),
  makeRB("Larry Csonka","Dolphins","1970s",1972,1117,6,15,87,0),

  // === 1980s ===
  makeRB("Eric Dickerson","Rams","1980s",1984,2105,14,21,139,0),
  makeRB("Marcus Allen","Raiders","1980s",1985,1759,11,67,555,3),
  makeRB("Roger Craig","49ers","1980s",1985,1050,9,92,1016,6),
  makeRB("John Riggins","Redskins","1980s",1983,1347,24,0,0,0),
  makeRB("Joe Morris","Giants","1980s",1986,1516,14,21,223,0),
  makeRB("Curt Warner","Seahawks","1980s",1983,1449,13,42,325,1),

  // === 1990s ===
  makeRB("Barry Sanders","Lions","1990s",1997,2053,11,33,305,3),
  makeRB("Emmitt Smith","Cowboys","1990s",1995,1773,25,62,375,0),
  makeRB("Terrell Davis","Broncos","1990s",1998,2008,21,25,217,2),
  makeRB("Marshall Faulk","Rams","1990s",1999,1381,7,87,1048,5),
  makeRB("Thurman Thomas","Bills","1990s",1991,1407,7,62,631,5),
  makeRB("Fred Taylor","Jaguars","1990s",1998,1223,14,44,421,2),

  // === 2000s ===
  makeRB("LaDainian Tomlinson","Chargers","2000s",2006,1815,28,56,508,3),
  makeRB("Shaun Alexander","Seahawks","2000s",2005,1880,27,15,78,1),
  makeRB("Priest Holmes","Chiefs","2000s",2002,1615,21,70,672,3),
  makeRB("Jamal Lewis","Ravens","2000s",2003,2066,14,26,205,0),
  makeRB("Ahman Green","Packers","2000s",2003,1883,15,50,367,5),
  makeRB("Domanick Williams","Texans","2000s",2004,1188,13,68,541,1),

  // === 2010s ===
  makeRB("Adrian Peterson","Vikings","2010s",2012,2097,12,40,217,1),
  makeRB("Le'Veon Bell","Steelers","2010s",2014,1361,8,83,854,3),
  makeRB("Christian McCaffrey","Panthers","2010s",2019,1387,15,116,1005,4),
  makeRB("Marshawn Lynch","Seahawks","2010s",2012,1590,11,23,196,1),
  makeRB("Arian Foster","Texans","2010s",2010,1616,16,66,604,2),

  // === 2020s ===
  makeRB("Derrick Henry","Titans","2020s",2020,2027,17,19,114,0),
  makeRB("Jonathan Taylor","Colts","2020s",2021,1811,18,40,360,2),
  makeRB("Saquon Barkley","Eagles","2020s",2024,2005,13,33,278,2),
  makeRB("Breece Hall","Jets","2020s",2023,994,5,76,591,4),
  makeRB("Christian McCaffrey","49ers","2020s",2023,1459,14,67,564,7)
];

const WRs = [
  // === 1960s ===
  makeWR("Charley Hennigan","Oilers","1960s",1961,82,1746,12),
  makeWR("Lance Alworth","Chargers","1960s",1965,69,1602,14),
  makeWR("Don Maynard","Jets","1960s",1967,71,1434,10),
  makeWR("Raymond Berry","Colts","1960s",1960,74,1298,10),
  makeWR("Tommy McDonald","Eagles","1960s",1961,64,1144,13),

  // === 1970s ===
  makeWR("Paul Warfield","Dolphins","1970s",1971,43,996,11),
  makeWR("Cliff Branch","Raiders","1970s",1974,60,1092,13),
  makeWR("Lynn Swann","Steelers","1970s",1978,61,880,11),
  makeWR("Harold Carmichael","Eagles","1970s",1973,67,1116,9),
  makeWR("Drew Pearson","Cowboys","1970s",1974,62,1087,2),

  // === 1980s ===
  makeWR("Jerry Rice","49ers","1980s",1987,65,1078,22),
  makeWR("Art Monk","Redskins","1980s",1984,106,1372,7),
  makeWR("Mark Clayton","Dolphins","1980s",1984,73,1389,18),
  makeWR("Steve Largent","Seahawks","1980s",1985,79,1287,6),
  makeWR("Sterling Sharpe","Packers","1980s",1989,90,1423,12),

  // === 1990s ===
  makeWR("Randy Moss","Vikings","1990s",1998,69,1313,17),
  makeWR("Cris Carter","Vikings","1990s",1995,122,1371,17),
  makeWR("Michael Irvin","Cowboys","1990s",1991,93,1523,8),
  makeWR("Jimmy Smith","Jaguars","1990s",1999,116,1636,6),
  makeWR("Herman Moore","Lions","1990s",1995,123,1686,14),

  // === 2000s ===
  makeWR("Marvin Harrison","Colts","2000s",2002,143,1722,11),
  makeWR("Terrell Owens","Eagles","2000s",2004,77,1200,14),
  makeWR("Torry Holt","Rams","2000s",2003,117,1696,12),
  makeWR("Steve Smith Sr.","Panthers","2000s",2005,103,1563,12),
  makeWR("Andre Johnson","Texans","2000s",2008,115,1575,8),

  // === 2010s ===
  makeWR("Calvin Johnson","Lions","2010s",2012,122,1964,5),
  makeWR("Antonio Brown","Steelers","2010s",2015,136,1834,10),
  makeWR("Julio Jones","Falcons","2010s",2015,136,1871,8),
  makeWR("DeAndre Hopkins","Texans","2010s",2018,115,1572,11),
  makeWR("Brandon Marshall","Bears","2010s",2012,118,1508,11),

  // === 2020s ===
  makeWR("Cooper Kupp","Rams","2020s",2021,145,1947,16),
  makeWR("Justin Jefferson","Vikings","2020s",2022,128,1809,8),
  makeWR("CeeDee Lamb","Cowboys","2020s",2023,135,1749,12),
  makeWR("Garrett Wilson","Jets","2020s",2023,95,1042,3),
  makeWR("Davante Adams","Packers","2020s",2020,115,1374,18)
];

const DEFs = [
  // === 1960s ===
  makeDEF("Packers Defense","Packers","1960s",1962,10.6,32,50),
  makeDEF("Vikings Defense","Vikings","1960s",1969,9.5,49,40),
  makeDEF("Chargers Defense","Chargers","1960s",1961,15.4,49,66),
  makeDEF("Colts Defense","Colts","1960s",1968,10.3,32,42),
  makeDEF("Chiefs Defense","Chiefs","1960s",1969,12.6,45,48),

  // === 1970s ===
  makeDEF("Steelers Defense","Steelers","1970s",1976,9.9,46,46),
  makeDEF("Dolphins Defense","Dolphins","1970s",1973,10.7,37,38),
  makeDEF("Cowboys Defense","Cowboys","1977",15.1,53,43),
  makeDEF("Rams Defense","Rams","1970s",1975,9.6,44,39),
  makeDEF("Broncos Defense","Broncos","1970s",1977,10.6,44,39),

  // === 1980s ===
  makeDEF("Bears Defense","Bears","1980s",1985,12.4,64,54),
  makeDEF("Giants Defense","Giants","1980s",1986,14.8,59,43),
  makeDEF("49ers Defense","49ers","1980s",1984,14.2,51,40),
  makeDEF("Redskins Defense","Redskins","1980s",1983,20.0,61,61),
  makeDEF("Eagles Defense","Eagles","1980s",1989,20.0,62,46),

  // === 1990s ===
  makeDEF("Eagles Defense","Eagles","1990s",1991,15.0,55,48),
  makeDEF("Packers Defense","Packers","1990s",1996,13.1,52,43),
  makeDEF("Buccaneers Defense","Buccaneers","1990s",1999,14.7,43,38),
  makeDEF("Jaguars Defense","Jaguars","1990s",1999,13.6,57,38),
  makeDEF("Cowboys Defense","Cowboys","1990s",1992,15.2,44,37),

  // === 2000s ===
  makeDEF("Ravens Defense","Ravens","2000s",2000,10.3,35,49),
  makeDEF("Buccaneers Defense","Buccaneers","2000s",2002,12.3,43,38),
  makeDEF("Steelers Defense","Steelers","2000s",2008,13.9,51,29),
  makeDEF("Panthers Defense","Panthers","2000s",2003,19.0,40,37),
  makeDEF("Texans Defense","Texans","2000s",2009,21.4,34,22),

  // === 2010s ===
  makeDEF("Seahawks Defense","Seahawks","2010s",2013,14.4,44,39),
  makeDEF("Broncos Defense","Broncos","2010s",2015,18.5,52,27),
  makeDEF("Patriots Defense","Patriots","2010s",2019,14.1,47,36),
  makeDEF("49ers Defense","49ers","2010s",2011,14.3,42,38),
  makeDEF("Jaguars Defense","Jaguars","2010s",2017,16.8,55,33),

  // === 2020s ===
  makeDEF("49ers Defense","49ers","2020s",2022,16.3,44,30),
  makeDEF("Ravens Defense","Ravens","2020s",2023,16.5,60,31),
  makeDEF("Chiefs Defense","Chiefs","2020s",2023,17.3,57,17),
  makeDEF("Jets Defense","Jets","2020s",2022,18.6,45,16),
  makeDEF("Bills Defense","Bills","2020s",2021,17.0,42,30)
];

const playerPool = [...QBs, ...RBs, ...WRs, ...DEFs];
window.NFL17_PLAYERS = { QBs, RBs, WRs, DEFs, playerPool };