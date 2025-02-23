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

// 10x25 그리드 생성 (각 사과에 1~9의 랜덤 숫자 부여)
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

  // 타이머: 게임 시작 후 1초마다 감소
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

  // 드래그 시작
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

  // 드래그 중: 선택 영역 업데이트
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

  // 사각형과 사과의 바운딩 박스가 교차하는지 검사하는 함수
  const isIntersecting = (
    appleLeft: number,
    appleTop: number,
    appleRight: number,
    appleBottom: number,
    selLeft: number,
    selTop: number,
    selRight: number,
    selBottom: number
  ) => {
    return appleLeft < selRight &&
           appleRight > selLeft &&
           appleTop < selBottom &&
           appleBottom > selTop;
  };

  // 드래그 종료: 선택 영역 내의 사과들 처리
  const handleMouseUp = () => {
    if (!selectionRect.visible || !gameStarted || isGameOver) return;
    const { startX, startY, currentX, currentY } = selectionRect;
    const selLeft = Math.min(startX, currentX);
    const selTop = Math.min(startY, currentY);
    const selRight = Math.max(startX, currentX);
    const selBottom = Math.max(startY, currentY);
    
    let selectedIds: string[] = [];
    let selectedSum = 0;
    
    grid.forEach((row, rowIndex) => {
      row.forEach((apple, colIndex) => {
        if (apple.removed) return;
        const appleLeft = colIndex * cellSize + cellMargin;
        const appleTop = rowIndex * cellSize + cellMargin;
        const appleRight = appleLeft + appleSize;
        const appleBottom = appleTop + appleSize;
        if (isIntersecting(appleLeft, appleTop, appleRight, appleBottom, selLeft, selTop, selRight, selBottom)) {
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
    
    // 선택 영역 초기화
    setSelectionRect({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      visible: false,
    });
  };

  // 드래그 선택 사각형 스타일
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

  // 시간바
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
      backgroundColor: '#f0f0f0',
    }}>
      <h2>사과 게임</h2>
      {gameStarted && (
  <div
    style={{
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
    }}
  >
    <div>
      남은 시간: {timeLeft}초 {isGameOver && " - 게임 오버"}
    </div>
    <div
      style={{
        width: timeBarWidth,
        height: 20,
        border: '1px solid #000',
        background: '#e0e0e0',
      }}
    >
      <div
        style={{
          width: timeBarFillWidth,
          height: '100%',
          background: 'green',
        }}
      ></div>
    </div>
    <div>점수: {score}</div>
  </div>
)}

      
      <div
        style={{
          position: 'relative',
          width: COLS * cellSize,
          height: ROWS * cellSize,
          border: '1px solid #ccc',
        }}
      >
        {/* 그리드 영역: 게임 시작 전에는 블러 처리 */}
        <div
          style={{
            filter: gameStarted ? 'none' : 'blur(5px)',
            transition: 'filter 0.3s',
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
              // 사과의 바운딩 박스
              const appleLeft = left;
              const appleTop = top;
              const appleRight = left + appleSize;
              const appleBottom = top + appleSize;
              let isSelected = false;
              if (selectionRect.visible) {
                const selLeft = Math.min(selectionRect.startX, selectionRect.currentX);
                const selTop = Math.min(selectionRect.startY, selectionRect.currentY);
                const selRight = Math.max(selectionRect.startX, selectionRect.currentX);
                const selBottom = Math.max(selectionRect.startY, selectionRect.currentY);
                isSelected = isIntersecting(appleLeft, appleTop, appleRight, appleBottom, selLeft, selTop, selRight, selBottom);
              }
              return (
                <div
                  key={apple.id}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width: appleSize,
                    height: appleSize,
                    backgroundImage: isSelected
                      ? `url('/apple-green.png')`
                      : `url('/apple.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '60%', // 숫자를 더 아래로 이동 (원하는 위치에 맞춰 조정)
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
        
        {/* 시작 오버레이 */}
        {!gameStarted && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}>
            <button onClick={handleStartGame}>시작</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
