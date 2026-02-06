import { useRef, useEffect, useState } from 'react';
import './ResultScreen.css';

/**
 * Calculate distance between two points (in percentage coordinates)
 * Returns distance as a percentage of the map diagonal
 */
function calculateDistance(guess, actual) {
  const dx = guess.x - actual.x;
  const dy = guess.y - actual.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate score based on distance (0-5000 points per round, GeoGuessr style)
 * Perfect guess = 5000 points
 * Score decreases exponentially with distance
 */
function calculateScore(distance) {
  // Max distance on a 100x100 grid is ~141 (diagonal)
  // Use exponential decay for scoring
  const maxScore = 5000;
  const decayRate = 0.05; // Adjust for difficulty
  const score = Math.round(maxScore * Math.exp(-decayRate * distance));
  return Math.max(0, Math.min(maxScore, score));
}

/**
 * Format distance as a readable string
 */
function formatDistance(distance) {
  // Convert percentage distance to approximate "units" for display
  // In a real campus, this might be meters or feet
  const units = Math.round(distance * 2); // Arbitrary scaling
  if (units < 5) return 'Perfect!';
  if (units < 20) return `${units} ft away`;
  return `${units} ft away`;
}

function ResultScreen({
  guessLocation,
  guessFloor,
  actualLocation,
  actualFloor,
  imageUrl,
  roundNumber,
  totalRounds,
  onNextRound,
  onViewFinalResults,
  isLastRound
}) {
  const mapRef = useRef(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [displayedScore, setDisplayedScore] = useState(0);

  const distance = calculateDistance(guessLocation, actualLocation);
  const locationScore = calculateScore(distance);
  const floorCorrect = guessFloor === actualFloor;
  // Multiply by 0.8 for incorrect floor
  const totalScore = floorCorrect ? locationScore : Math.round(locationScore * 0.8);
  const floorPenalty = floorCorrect ? 0 : Math.round(locationScore * 0.2);

  // Animation sequence
  useEffect(() => {
    // Phase 0: Initial state
    // Phase 1: Show actual location marker
    // Phase 2: Draw line between markers
    // Phase 3: Show score
    const timers = [
      setTimeout(() => setAnimationPhase(1), 300),
      setTimeout(() => setAnimationPhase(2), 800),
      setTimeout(() => setAnimationPhase(3), 1300),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Animate score counter
  useEffect(() => {
    if (animationPhase >= 3) {
      const duration = 1000;
      const steps = 30;
      const increment = totalScore / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= totalScore) {
          setDisplayedScore(totalScore);
          clearInterval(interval);
        } else {
          setDisplayedScore(Math.round(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [animationPhase, totalScore]);

  return (
    <div className="result-screen">
      {/* Top section - Round info and score */}
      <div className="result-header">
        <div className="round-indicator">
          Round {roundNumber} of {totalRounds}
        </div>
        <div className={`score-display ${animationPhase >= 3 ? 'visible' : ''}`}>
          <span className="score-label">Score</span>
          <span className="score-value">{displayedScore.toLocaleString()}</span>
          <span className="score-max">/ 5,000</span>
        </div>
      </div>

      {/* Main content - Map with results */}
      <div className="result-content">
        <div className="result-map-container">
          <div className="result-map" ref={mapRef}>
            {/* Map SVG - same as MapPicker */}
            <svg
              className="map-svg"
              viewBox="0 0 400 300"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background */}
              <rect x="0" y="0" width="400" height="300" fill="#1a1a2e" />

              {/* Grid lines */}
              <g stroke="#2a2a4a" strokeWidth="0.5">
                {[...Array(9)].map((_, i) => (
                  <line key={`v${i}`} x1={(i + 1) * 40} y1="0" x2={(i + 1) * 40} y2="300" />
                ))}
                {[...Array(7)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={(i + 1) * 40} x2="400" y2={(i + 1) * 40} />
                ))}
              </g>

              {/* Buildings */}
              <g fill="#16213e" stroke="#3a3a5a" strokeWidth="1">
                <rect x="50" y="80" width="120" height="80" rx="4" />
                <text x="110" y="125" fill="#6b6b6b" fontSize="10" textAnchor="middle">Main</text>

                <rect x="200" y="60" width="80" height="60" rx="4" />
                <text x="240" y="95" fill="#6b6b6b" fontSize="10" textAnchor="middle">Library</text>

                <rect x="300" y="100" width="70" height="100" rx="4" />
                <text x="335" y="155" fill="#6b6b6b" fontSize="10" textAnchor="middle">Gym</text>

                <rect x="100" y="190" width="100" height="70" rx="4" />
                <text x="150" y="230" fill="#6b6b6b" fontSize="10" textAnchor="middle">Science</text>

                <rect x="230" y="180" width="90" height="80" rx="4" />
                <text x="275" y="225" fill="#6b6b6b" fontSize="10" textAnchor="middle">Arts</text>
              </g>

              {/* Paths */}
              <g stroke="#3a3a5a" strokeWidth="2" fill="none" strokeDasharray="4,4">
                <path d="M170 120 L200 90" />
                <path d="M170 130 L200 200 L230 220" />
                <path d="M280 90 L300 150" />
                <path d="M200 230 L230 220" />
              </g>

              {/* Line between guess and actual (Phase 2+) */}
              {animationPhase >= 2 && (
                <line
                  className="result-line"
                  x1={`${guessLocation.x}%`}
                  y1={`${guessLocation.y}%`}
                  x2={`${actualLocation.x}%`}
                  y2={`${actualLocation.y}%`}
                  stroke="#ffc107"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                />
              )}
            </svg>

            {/* Guess marker (always visible) */}
            <div
              className="result-marker guess-marker"
              style={{
                left: `${guessLocation.x}%`,
                top: `${guessLocation.y}%`
              }}
            >
              <div className="marker-pin guess-pin"></div>
              <div className="marker-label">Your guess</div>
            </div>

            {/* Actual location marker (Phase 1+) */}
            {animationPhase >= 1 && (
              <div
                className="result-marker actual-marker"
                style={{
                  left: `${actualLocation.x}%`,
                  top: `${actualLocation.y}%`
                }}
              >
                <div className="marker-pin actual-pin"></div>
                <div className="marker-label">Correct</div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel with details */}
        <div className="result-details">
          <div className="result-image-preview">
            <img src={imageUrl} alt="Location" />
          </div>

          <div className="result-stats">
            <div className="stat-row">
              <span className="stat-icon">📍</span>
              <span className="stat-label">Distance</span>
              <span className="stat-value">{formatDistance(distance)}</span>
            </div>

            <div className="stat-row">
              <span className="stat-icon">🏢</span>
              <span className="stat-label">Floor</span>
              <span className={`stat-value ${guessFloor === actualFloor ? 'correct' : 'incorrect'}`}>
                {guessFloor === actualFloor ? (
                  <>Correct! (Floor {actualFloor})</>
                ) : (
                  <>You: {guessFloor} | Actual: {actualFloor}</>
                )}
              </span>
            </div>

            <div className="score-breakdown">
              <div className="breakdown-row">
                <span>Location Score</span>
                <span>{locationScore.toLocaleString()}</span>
              </div>
              {floorPenalty > 0 && (
                <div className="breakdown-row penalty">
                  <span>Wrong Floor (-20%)</span>
                  <span>-{floorPenalty.toLocaleString()}</span>
                </div>
              )}
              <div className="breakdown-row total">
                <span>Total</span>
                <span>{totalScore.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            className="next-round-button"
            onClick={isLastRound ? onViewFinalResults : onNextRound}
          >
            {isLastRound ? 'View Final Results' : 'Next Round'}
            <span className="button-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="round-progress">
        {[...Array(totalRounds)].map((_, i) => (
          <div
            key={i}
            className={`progress-dot ${i < roundNumber ? 'completed' : ''} ${i === roundNumber - 1 ? 'current' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ResultScreen;
