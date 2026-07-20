import { useEffect, useRef, useState } from 'react';
import { GameManager } from './game/GameManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !started) return;
    
    // Configurar el tamaño interno del canvas (Resolución base para el pixel art)
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;

    const manager = new GameManager(canvas);
    manager.start();
    gameManagerRef.current = manager;

    return () => {
      manager.destroy();
      gameManagerRef.current = null;
    };
  }, [started]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center font-mono text-neutral-300">
      <div className="w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        
        {!started ? (
          <div className="flex flex-col items-center gap-8 text-center animate-fade-in mt-12">
            <h1 className="text-4xl md:text-6xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              OUTBREAK SURVIVAL
            </h1>
            
            <div className="border border-red-900/50 bg-black/50 p-8 rounded-sm flex flex-col items-center gap-8 shadow-[0_0_30px_rgba(220,38,38,0.1)] w-full max-w-md">
              <button 
                onClick={() => setStarted(true)}
                className="px-8 py-4 bg-red-700 hover:bg-red-500 text-white text-xl font-bold tracking-widest rounded-sm border-b-4 border-red-900 hover:border-red-700 transition-all active:border-b-0 active:translate-y-1"
              >
                PRESS START
              </button>

              <div className="text-sm text-neutral-500 flex flex-col items-center gap-2 border-t border-neutral-800 pt-6 w-full">
                <p className="text-red-400/80 mb-2 font-bold">/// SYS_CONTROLS</p>
                <div className="flex gap-4">
                  <div className="bg-neutral-900 px-3 py-1 rounded border border-neutral-700">W</div>
                  <div className="bg-neutral-900 px-3 py-1 rounded border border-neutral-700">A</div>
                  <div className="bg-neutral-900 px-3 py-1 rounded border border-neutral-700">S</div>
                  <div className="bg-neutral-900 px-3 py-1 rounded border border-neutral-700">D</div>
                </div>
                <p className="mt-2 text-xs text-center">PC: WASD to Move<br/>MOBILE: Left Screen Joystick</p>
                
                <div className="mt-4 flex flex-col items-center">
                  <p className="bg-neutral-900 px-4 py-2 rounded border border-neutral-700 text-center">MOUSE L-CLICK / RIGHT JOYSTICK</p>
                  <p className="mt-2 text-xs">AIM & FIRE</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="w-full h-[70vh] sm:h-auto sm:aspect-[4/3] max-w-[800px] border-4 border-neutral-800 bg-[#000] rounded-sm overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.1)] relative"
            style={{ cursor: 'crosshair', touchAction: 'none' }}
          >
            <canvas 
              ref={canvasRef} 
              className="w-full h-full block"
              style={{ imageRendering: 'pixelated', touchAction: 'none' }}
            />
            
            {/* UI Overlay Buttons */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                gameManagerRef.current?.triggerReload();
              }}
              className="absolute top-16 right-4 sm:top-14 sm:right-6 bg-black/60 hover:bg-neutral-800 text-white font-bold py-2 px-4 border-2 border-neutral-600 rounded shadow-md pointer-events-auto active:bg-neutral-700 active:scale-95 transition-transform"
            >
              RELOAD [R]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
