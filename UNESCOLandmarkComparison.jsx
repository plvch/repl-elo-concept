import React, { useState, useEffect } from 'react';
import { Database } from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm';

const TOTAL_COMPARISONS = 25;

const UNESCOLandmarkComparison = () => {
  const [db, setDb] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    initSqlJs({ locateFile: file => sqlWasm }).then(SQL => {
      const db = new SQL.Database();
      setDb(db);
      createTables(db);
      loadLandmarks(db);
    });
  }, []);

  const createTables = (db) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS landmarks (
        unique_number TEXT PRIMARY KEY,
        name_en TEXT,
        states_name_en TEXT,
        elo INTEGER
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        unique_number TEXT PRIMARY KEY,
        name_en TEXT,
        states_name_en TEXT,
        elo INTEGER
      )
    `);
  };

  const loadLandmarks = (db) => {
    const result = db.exec("SELECT * FROM landmarks");
    if (result.length === 0 || result[0].values.length === 0) {
      // If the table is empty, insert the initial data
      landmarkData.forEach(landmark => {
        db.run("INSERT INTO landmarks VALUES (?, ?, ?, 1400)", [landmark.unique_number, landmark.name_en, landmark.states_name_en]);
      });
      const initializedLandmarks = landmarkData.map(landmark => ({ ...landmark, elo: 1400 }));
      setLandmarks(initializedLandmarks);
      selectNewPair(initializedLandmarks);
    } else {
      // If data exists, load it
      const loadedLandmarks = result[0].values.map(row => ({
        unique_number: row[0],
        name_en: row[1],
        states_name_en: row[2],
        elo: row[3]
      }));
      setLandmarks(loadedLandmarks);
      selectNewPair(loadedLandmarks);
    }
  };

  const selectNewPair = (landmarkList) => {
    const pair = landmarkList.sort(() => 0.5 - Math.random()).slice(0, 2);
    setCurrentPair(pair);
  };

  const updateElo = (winner, loser) => {
    const k = 32;
    const expectedScoreWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    const expectedScoreLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

    winner.elo += k * (1 - expectedScoreWinner);
    loser.elo += k * (0 - expectedScoreLoser);

    // Update the database
    db.run("UPDATE landmarks SET elo = ? WHERE unique_number = ?", [winner.elo, winner.unique_number]);
    db.run("UPDATE landmarks SET elo = ? WHERE unique_number = ?", [loser.elo, loser.unique_number]);
  };

  const handleChoice = (chosenIndex) => {
    const winner = currentPair[chosenIndex];
    const loser = currentPair[1 - chosenIndex];

    updateElo(winner, loser);

    setComparisonCount(count => {
      if (count + 1 >= TOTAL_COMPARISONS) {
        setIsFinished(true);
        updateLeaderboard();
      }
      return count + 1;
    });

    if (comparisonCount + 1 < TOTAL_COMPARISONS) {
      selectNewPair(landmarks);
    }
  };

  const updateLeaderboard = () => {
    const sortedLandmarks = [...landmarks].sort((a, b) => b.elo - a.elo);
    const top10 = sortedLandmarks.slice(0, 10);
    setLeaderboard(top10);

    // Update the leaderboard in the database
    db.run("DELETE FROM leaderboard");
    top10.forEach(landmark => {
      db.run("INSERT INTO leaderboard VALUES (?, ?, ?, ?)", [landmark.unique_number, landmark.name_en, landmark.states_name_en, landmark.elo]);
    });
  };

  const restartComparison = () => {
    setComparisonCount(0);
    setIsFinished(false);
    const resetLandmarks = landmarks.map(landmark => ({ ...landmark, elo: 1400 }));
    setLandmarks(resetLandmarks);
    selectNewPair(resetLandmarks);

    // Reset ELO scores in the database
    db.run("UPDATE landmarks SET elo = 1400");
  };

  const toggleLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
    if (!showLeaderboard) {
      updateLeaderboard();
    }
  };

  return (
    <div style={{maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
      <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '20px'}}>UNESCO Landmark Comparison</h2>
      <button 
        onClick={toggleLeaderboard}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          border: '1px solid black',
          background: 'white',
          cursor: 'pointer'
        }}
      >
        {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
      </button>

      {showLeaderboard && (
        <div>
          <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '10px'}}>Leaderboard</h3>
          <ol style={{listStyleType: 'decimal', paddingLeft: '20px'}}>
            {leaderboard.map((landmark, index) => (
              <li key={landmark.unique_number} style={{marginBottom: '10px'}}>
                {landmark.name_en} ({landmark.states_name_en}) - ELO: {Math.round(landmark.elo)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!isFinished && (
        <div>
          <p style={{marginBottom: '20px'}}>Comparison {comparisonCount + 1} of {TOTAL_COMPARISONS}</p>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            {currentPair.map((landmark, index) => (
              <button
                key={landmark.unique_number}
                onClick={() => handleChoice(index)}
                style={{
                  width: '45%',
                  height: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid black',
                  padding: '10px',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <span style={{fontSize: '14px', textAlign: 'center'}}>{landmark.name_en}</span>
                <span style={{fontSize: '12px', textAlign: 'center', marginTop: '10px'}}>({landmark.states_name_en})</span>
                <span style={{marginTop: '10px'}}>{index === 0 ? '←' : '→'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div>
          <p>You've completed all comparisons!</p>
          <button
            onClick={restartComparison}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              border: '1px solid black',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default UNESCOLandmarkComparison;