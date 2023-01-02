const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initialization = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initialization();
//get all player
const convertDbObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayer = `
    SELECT*
    FROM player_details;
    `;
  const details = await db.all(getPlayer);
  response.send(details.map((eachPlayer) => convertDbObject(eachPlayer)));
});
//get specific player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
  SELECT*
  FROM player_details
  WHERE
  player_id=${playerId};
  `;
  const details = await db.get(getPlayer);
  response.send({
    playerId: details.player_id,
    playerName: details.player_name,
  });
});
//update
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const detailsPl = request.body;
  const { playerName } = detailsPl;
  const updateQuery = `
  UPDATE
  player_details
  SET
  player_name='${playerName}'
  `;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});
//get match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
  SELECT*
  FROM match_details
  WHERE
  match_id=${matchId};
  `;
  const dbs = await db.get(getMatch);
  response.send({
    matchId: dbs.match_id,
    match: dbs.match,
    year: dbs.year,
  });
});
//list of all matches
const convertDbObjectIn = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
  SELECT
  *
  FROM player_match_score NATURAL JOIN match_details
  
  WHERE
  player_id= ${playerId};`;

  const getArray = await db.all(getMatchQuery);
  response.send(getArray.map((eachMatch) => convertDbObjectIn(eachMatch)));
});

//return specific player
const convertDbObjectInto = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const specificQuery = `
  SELECT*
  FROM player_match_score NATURAL JOIN player_details
  WHERE
  match_id= ${matchId};
  `;
  const getArray = await db.all(specificQuery);
  response.send(getArray.map((eachPlayer) => convertDbObjectInto(eachPlayer)));
});

//
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
  SELECT
  player_id,player_name,SUM(score), SUM(fours), SUM(sixes)
  FROM player_match_score NATURAL JOIN player_details
  WHERE
  player_id= ${playerId};
  
  `;
  const responseObj = await db.get(getQuery);
  response.send({
    playerId: responseObj.player_id,
    playerName: responseObj.player_name,
    totalScore: responseObj["SUM(score)"],
    totalFours: responseObj["SUM(fours)"],
    totalSixes: responseObj["SUM(sixes)"],
  });
});
module.exports = app;
