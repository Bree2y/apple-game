import React, { useState, useEffect } from 'react';

interface AppleData {
  id: string;
  value: number;
  removed: boolean;
}

const ROWS = 10;
const COLS = 25;
const appleSize = 40;
const cellMargin = 2;
const cellSize = appleSize + cellMargin * 2; // 44

// 10x25 그리드를 생성 (각 사과에 1~9의 랜덤 숫자 부여)
const generateGrid = (): AppleData[][] => {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => ({
      id: `${row}-${col}`,
      value: Math.floor(Math.random() * 9) + 1,
      removed: false,
    }))
  );
};

interface SelectionRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  visible: boolean;
}

const Game: React.FC = () => {
  const [grid, setGrid] = useState<AppleData[][]>(generateGrid());
  const [selectionRect, setSelectionRect] = useState<SelectionRect>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    visible: false,
  });
  
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2분 = 120초
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, timeLeft]);

  const isGameOver = gameStarted && timeLeft <= 0;

  const handleStartGame = () => {
    setGameStarted(true);
    setTimeLeft(120);
    setScore(0);
    setGrid(generateGrid());
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted || isGameOver) return;
    if (e.button !== 0) return; // 왼쪽 버튼만 처리
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setSelectionRect({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      visible: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectionRect.visible) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setSelectionRect(prev => ({
      ...prev,
      currentX,
      currentY,
    }));
  };

  const handleMouseUp = () => {
    if (!selectionRect.visible || !gameStarted || isGameOver) return;
    const { startX, startY, currentX, currentY } = selectionRect;
    const left = Math.min(startX, currentX);
    const right = Math.max(startX, currentX);
    const top = Math.min(startY, currentY);
    const bottom = Math.max(startY, currentY);
    
    let selectedIds: string[] = [];
    let selectedSum = 0;
    
    grid.forEach((row, rowIndex) => {
      row.forEach((apple, colIndex) => {
        if (apple.removed) return;
        const appleLeft = colIndex * cellSize;
        const appleTop = rowIndex * cellSize;
        const centerX = appleLeft + cellMargin + appleSize / 2;
        const centerY = appleTop + cellMargin + appleSize / 2;
        if (centerX >= left && centerX <= right && centerY >= top && centerY <= bottom) {
          selectedIds.push(apple.id);
          selectedSum += apple.value;
        }
      });
    });
    
    if (selectedSum === 10 && selectedIds.length > 0) {
      const newGrid = grid.map(row =>
        row.map(apple =>
          selectedIds.includes(apple.id) ? { ...apple, removed: true } : apple
        )
      );
      setGrid(newGrid);
      setScore(prev => prev + selectedIds.length);
    }
    
    setSelectionRect({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      visible: false,
    });
  };

  const getSelectionBoxStyle = () => {
    if (!selectionRect.visible) return { display: 'none' };
    const left = Math.min(selectionRect.startX, selectionRect.currentX);
    const top = Math.min(selectionRect.startY, selectionRect.currentY);
    const width = Math.abs(selectionRect.currentX - selectionRect.startX);
    const height = Math.abs(selectionRect.currentY - selectionRect.startY);
    return {
      position: 'absolute' as const,
      left,
      top,
      width,
      height,
      border: '1px dashed blue',
      background: 'rgba(173, 216, 230, 0.2)',
      pointerEvents: 'none' as const,
    };
  };

  const timeBarWidth = 300;
  const timeBarFillWidth = (timeLeft / 120) * timeBarWidth;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      userSelect: 'none',
      padding: 20,
      minHeight: '100vh',
      backgroundColor: '#f0f0f0', // 전체 배경 밝은 회색
    }}>
      <h2>사과 게임</h2>
      {!gameStarted && <button onClick={handleStartGame}>시작</button>}
      {gameStarted && (
        <div style={{ marginBottom: 10, textAlign: 'center' }}>
          <div style={{ marginBottom: 5 }}>
            남은 시간: {timeLeft}초 {isGameOver && " - 게임 오버"}
          </div>
          <div style={{
            width: timeBarWidth,
            height: 20,
            border: '1px solid #000',
            background: '#e0e0e0',
            margin: '0 auto'
          }}>
            <div style={{ width: timeBarFillWidth, height: '100%', background: 'green' }}></div>
          </div>
          <div>점수: {score}</div>
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: COLS * cellSize,
          height: ROWS * cellSize,
          backgroundColor: '#f0f0f0', // 게임 영역의 배경도 밝은 회색
          border: '1px solid #ccc',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {grid.map((row, rowIndex) =>
          row.map((apple, colIndex) => {
            if (apple.removed) return null;
            const left = colIndex * cellSize + cellMargin;
            const top = rowIndex * cellSize + cellMargin;
            return (
              <div
                key={apple.id}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: appleSize,
                  height: appleSize,
                  backgroundImage: `url('/apple.png')`, // 사과 이미지 그대로 유지
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontWeight: 'bold',
                  fontSize: 16,
                  color: 'white',
                  textShadow: '1px 1px 2px black',
                  userSelect: 'none',
                }}>
                  {apple.value}
                </div>
              </div>
            );
          })
        )}
        <div style={getSelectionBoxStyle()} />
      </div>
    </div>
  );
};

export default Game;
