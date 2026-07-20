import { Player } from './Player';
import { Zombie } from './Zombie';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { InputManager } from './InputManager';

export class GameManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  
  private player: Player;
  private zombies: Zombie[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  
  private lastTime: number = 0;
  private animationId: number = 0;
  public isGameOver: boolean = false;
  private score: number = 0;

  private spawnTimer: number = 0;
  private spawnInterval: number = 1.0; // Spawnea 1 zombi por segundo
  
  private fireCooldown: number = 0;
  private fireRate: number = 0.2; // 0.2 segundos de cooldown entre disparos

  public maxAmmo: number = 15;
  public currentAmmo: number = 15;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public reloadDuration: number = 1.2;

  // Firebase integration placeholders:
  // private db: any = null; // import { getFirestore, doc, setDoc } from 'firebase/firestore';
  // private userId: string = 'guest';

  private zombieImg: HTMLImageElement;
  private mapImg: HTMLImageElement;
  
  // Rectángulos de colisión aproximados basados en el mapa subido
  // (Agua arriba con el barco, agua a la derecha con los botes pequeños)
  private mapWalls = [
    { x: 0, y: 0, w: 800, h: 170 }, // Barco superior y agua
    { x: 650, y: 0, w: 150, h: 600 }, // Agua derecha
    { x: 190, y: 250, w: 180, h: 160 }, // Contenedores centrales grandes
    { x: 0, y: 480, w: 180, h: 120 } // Contenedores izquierda abajo
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not get canvas context");
    this.ctx = context;
    
    this.input = new InputManager(canvas);
    this.player = new Player(canvas.width / 2, canvas.height / 2);

    // Precarga del Asset del Zombie
    // Nota: Deberás guardar la imagen proporcionada como "zombie.png" dentro de la carpeta /public
    this.zombieImg = new Image();
    this.zombieImg.src = '/zombie.png';
    
    // Precarga del Mapa
    this.mapImg = new Image();
    this.mapImg.src = '/map.jpg'; // El jugador deberá renombrar la imagen del mapa a map.jpg
  }

  public start() {
    this.lastTime = performance.now();
    this.isGameOver = false;
    this.score = 0;
    this.zombies = [];
    this.projectiles = [];
    this.particles = [];
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;
    
    this.loop(this.lastTime);
  }

  public destroy() {
    cancelAnimationFrame(this.animationId);
    this.input.destroy();
  }

  public triggerReload() {
    if (!this.isReloading && this.currentAmmo < this.maxAmmo) {
      this.isReloading = true;
      this.reloadTimer = 0;
    }
  }

  private loop = (timestamp: number) => {
    if (this.isGameOver) return;

    // Delta time en segundos
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Update Player
    this.player.update(dt, this.input.keys, this.input.moveJoystick, this.mapWalls);

    // Clamp player to canvas boundaries
    this.player.x = Math.max(this.player.width/2, Math.min(this.canvas.width - this.player.width/2, this.player.x));
    this.player.y = Math.max(this.player.height/2, Math.min(this.canvas.height - this.player.height/2, this.player.y));

    // 2. Shooting & Reload mechanic
    if (this.isReloading) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.reloadDuration) {
        this.isReloading = false;
        this.currentAmmo = this.maxAmmo;
        this.reloadTimer = 0;
      }
    } else {
      if (this.input.keys['r'] && this.currentAmmo < this.maxAmmo) {
        this.triggerReload();
      }

      if (this.fireCooldown > 0) {
        this.fireCooldown -= dt;
      }
      
      let tryingToShoot = false;
      let dirX = 0, dirY = 0;
      let isVector = false;

      if (this.input.aimJoystick.active && (Math.abs(this.input.aimJoystick.dirX) > 0.1 || Math.abs(this.input.aimJoystick.dirY) > 0.1)) {
        tryingToShoot = true;
        dirX = this.input.aimJoystick.dirX;
        dirY = this.input.aimJoystick.dirY;
        isVector = true;
      } else if (this.input.isMouseDown) {
        tryingToShoot = true;
        dirX = this.input.mouseX;
        dirY = this.input.mouseY;
        isVector = false;
      }

      if (tryingToShoot && this.fireCooldown <= 0) {
        if (this.currentAmmo > 0) {
          this.projectiles.push(new Projectile(this.player.x, this.player.y, dirX, dirY, isVector));
          this.currentAmmo--;
          this.fireCooldown = this.fireRate;
        } else {
          this.triggerReload();
        }
      }
    }

    // 3. Update Projectiles
    for (const p of this.projectiles) {
      p.update(dt);
      // Clean up si salen de pantalla
      if (p.x < -50 || p.x > this.canvas.width + 50 || p.y < -50 || p.y > this.canvas.height + 50) {
        p.active = false;
      }
    }
    this.projectiles = this.projectiles.filter(p => p.active);

    // 3.5 Update Particles
    for (const p of this.particles) {
      p.update(dt);
    }
    this.particles = this.particles.filter(p => p.active);

    // 4. Zombie Spawning (Fuera de la cámara/pantalla)
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnZombie();
      
      // Incrementar la dificultad ligeramente
      if (this.spawnInterval > 0.3) {
        this.spawnInterval -= 0.01;
      }
    }

    // 5. Update Zombies & Collisions
    for (const z of this.zombies) {
      z.update(dt, this.player.x, this.player.y, this.mapWalls);

      // Colisión Player - Zombie (Hitboxes simples)
      const dx = this.player.x - z.x;
      const dy = this.player.y - z.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < (this.player.width/2 + z.width/2 - 4)) {
        this.gameOver();
      }
    }

    // Colisión Projectile - Zombie
    for (const p of this.projectiles) {
      for (const z of this.zombies) {
        if (!p.active || !z.active) continue;

        const dx = p.x - z.x;
        const dy = p.y - z.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Hitbox collision
        if (dist < (p.radius + z.width/2)) {
          p.active = false;
          z.active = false;
          this.score += 100; // Increment score for zombie defeat
          
          // Spawn blood and smoke particles
          for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(z.x, z.y, '#ff0044')); // Sangre pixel
            this.particles.push(new Particle(z.x, z.y, '#333333')); // Humo/Pólvora
          }
        }
      }
    }

    this.zombies = this.zombies.filter(z => z.active);
  }

  private spawnZombie() {
    let x, y;
    // Determinar de qué lado de la pantalla spawnean (Top, Bottom, Left, Right)
    if (Math.random() > 0.5) {
      x = Math.random() > 0.5 ? -32 : this.canvas.width + 32;
      y = Math.random() * this.canvas.height;
    } else {
      x = Math.random() * this.canvas.width;
      y = Math.random() > 0.5 ? -32 : this.canvas.height + 32;
    }
    this.zombies.push(new Zombie(x, y, this.zombieImg));
  }

  private draw() {
    // Fondo de color oscuro para ambiente post-apocalíptico
    this.ctx.fillStyle = '#18181c'; 
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dibujar Mapa
    if (this.mapImg && this.mapImg.complete && this.mapImg.naturalWidth > 0) {
      this.ctx.drawImage(this.mapImg, 0, 0, this.canvas.width, this.canvas.height);
    }
    
    // (Opcional) Dibujar áreas de colisión para visualización (Modo Debug)
    /*
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    for (const wall of this.mapWalls) {
      this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
    */

    // Draw Entities
    for (const z of this.zombies) {
      z.draw(this.ctx);
    }
    for (const p of this.projectiles) {
      p.draw(this.ctx);
    }
    for (const p of this.particles) {
      p.draw(this.ctx);
    }
    this.player.draw(this.ctx);

    // Crosshair custom (opcional)
    this.ctx.strokeStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.input.mouseX, this.input.mouseY, 4, 0, Math.PI*2);
    this.ctx.stroke();

    // UI - Score
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 22, 32); // Sombra
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);

    // UI - Ammo
    this.ctx.textAlign = 'right';
    if (this.isReloading) {
      this.ctx.fillStyle = '#ffb300';
      this.ctx.fillText(`RELOADING...`, this.canvas.width - 20, 30);
      
      // Barra de progreso de recarga
      const barWidth = 120;
      const barHeight = 10;
      const px = this.canvas.width - 20 - barWidth;
      const py = 40;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(px, py, barWidth, barHeight);
      this.ctx.fillStyle = '#ffb300';
      this.ctx.fillRect(px, py, barWidth * (this.reloadTimer / this.reloadDuration), barHeight);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(px, py, barWidth, barHeight);
    } else {
      this.ctx.fillStyle = this.currentAmmo <= 3 ? '#ff2244' : '#fff';
      this.ctx.fillText(`AMMO: ${this.currentAmmo} / ${this.maxAmmo}`, this.canvas.width - 20, 30);
    }

    // Draw Joysticks
    this.drawJoystick(this.input.moveJoystick);
    this.drawJoystick(this.input.aimJoystick);
  }

  private drawJoystick(j: { active: boolean, baseX: number, baseY: number, knobX: number, knobY: number }) {
    if (!j.active) return;
    
    // Base
    this.ctx.beginPath();
    this.ctx.arc(j.baseX, j.baseY, 40, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fill();

    // Knob
    this.ctx.beginPath();
    this.ctx.arc(j.knobX, j.knobY, 15, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fill();
  }

  private gameOver() {
    this.isGameOver = true;
    
    // Draw Game Over Screen overlay
    this.ctx.fillStyle = 'rgba(20, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff2244';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("YOU DIED", this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    
    this.ctx.fillStyle = '#888';
    this.ctx.font = '16px monospace';
    this.ctx.fillText("Click anywhere to Restart", this.canvas.width / 2, this.canvas.height / 2 + 80);

    // Backend save score (Ejemplo Firebase)
    /*
    if (this.db) {
       setDoc(doc(this.db, "leaderboard", this.userId), { score: this.score }, { merge: true });
    }
    */

   // Handler para reiniciar
   const restartHandler = () => {
     this.canvas.removeEventListener('mousedown', restartHandler);
     this.start();
   };
   // Pequeño delay para no disparar reinicio en el click del disparo final
   setTimeout(() => {
     this.canvas.addEventListener('mousedown', restartHandler);
   }, 500);
  }
}
