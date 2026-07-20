export type ZombieState = 'IDLE' | 'WALK' | 'RUN' | 'ATTACK' | 'HURT' | 'DEAD' | 'JUMP';

interface AnimConfig {
  startX: number; // Coordenada X inicial en píxeles de la fila
  startY: number; // Coordenada Y inicial en píxeles
  frames: number; // Fotogramas en esta animación
  speed: number;  // Tiempo por fotograma
}

export class Zombie {
  public x: number;
  public y: number;
  public width: number = 32; // Hitbox ajustada al centro
  public height: number = 48;
  public speed: number = 50; 
  public active: boolean = true;
  public hp: number = 100;

  // --- SISTEMA DE ANIMACIÓN 16-BIT ---
  public state: ZombieState = 'WALK';
  private image: HTMLImageElement;
  
  // Ajustes específicos del SpriteSheet que has subido.
  // Modifica spriteWidth y spriteHeight para el tamaño individual exacto de un zombie.
  // Las coordenadas proporcionadas (startX, startY) son aproximadas según el layout de tu imagen.
  private spriteWidth: number = 110; 
  private spriteHeight: number = 140; 
  
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private facingLeft: boolean = false;

  // Mapa de sprites (Basado en la estructura visual proporcionada)
  private animations: Record<ZombieState, AnimConfig> = {
    'IDLE':   { startX: 110, startY: 40,   frames: 4, speed: 0.2 },
    'HURT':   { startX: 110, startY: 210,  frames: 5, speed: 0.1 },
    'DEAD':   { startX: 110, startY: 380,  frames: 5, speed: 0.15 }, // Usando la 1ra fila de "DEAD"
    'WALK':   { startX: 110, startY: 740,  frames: 6, speed: 0.12 },
    'JUMP':   { startX: 580, startY: 130,  frames: 6, speed: 0.1 },
    'RUN':    { startX: 580, startY: 340,  frames: 6, speed: 0.08 },
    'ATTACK': { startX: 580, startY: 760,  frames: 6, speed: 0.1 }
  };

  constructor(x: number, y: number, img: HTMLImageElement) {
    this.x = x;
    this.y = y;
    this.image = img;
    // Variaciones aleatorias de velocidad base
    this.speed = this.speed + (Math.random() * 20 - 10);
  }

  public update(dt: number, targetX: number, targetY: number, walls: {x: number, y: number, w: number, h: number}[] = []) {
    if (this.state === 'DEAD') return;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Voltear sprite según dirección
    if (dx < 0) this.facingLeft = true;
    else if (dx > 0) this.facingLeft = false;

    // Máquina de estados rudimentaria (Comportamiento de IA Zombi)
    if (distance < 45) {
      if (this.state !== 'ATTACK') this.setAnimation('ATTACK');
    } else if (distance < 250) {
      if (this.state !== 'RUN') {
        this.setAnimation('RUN');
        this.speed = 120;
      }
    } else {
      if (this.state !== 'WALK') {
        this.setAnimation('WALK');
        this.speed = 50;
      }
    }

    // Aplicar Movimiento
    if (this.state === 'WALK' || this.state === 'RUN') {
      if (distance > 0) {
        let newX = this.x + (dx / distance) * this.speed * dt;
        let newY = this.y + (dy / distance) * this.speed * dt;

        // Check Wall Collisions
        for (const wall of walls) {
          // X collision
          if (
            newX + this.width / 2 > wall.x &&
            newX - this.width / 2 < wall.x + wall.w &&
            this.y + this.height / 2 > wall.y &&
            this.y - this.height / 2 < wall.y + wall.h
          ) {
            newX = this.x;
          }
          
          // Y collision
          if (
            this.x + this.width / 2 > wall.x &&
            this.x - this.width / 2 < wall.x + wall.w &&
            newY + this.height / 2 > wall.y &&
            newY - this.height / 2 < wall.y + wall.h
          ) {
            newY = this.y;
          }
        }

        this.x = newX;
        this.y = newY;
      }
    }

    // Actualizar Fotogramas
    const anim = this.animations[this.state];
    this.frameTimer += dt;
    if (this.frameTimer >= anim.speed) {
      this.frameTimer = 0;
      this.currentFrame++;
      
      if (this.currentFrame >= anim.frames) {
        if (this.state === 'ATTACK') this.setAnimation('IDLE'); // Termina ataque
        else this.currentFrame = 0; // Loop normal de caminar/correr
      }
    }
  }

  private setAnimation(newState: ZombieState) {
    this.state = newState;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Fallback de retroceso si la imagen no carga o no se encuentra
    if (!this.image || !this.image.complete || this.image.naturalWidth === 0) {
      ctx.fillStyle = '#ff0044';
      ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
      return;
    }

    const anim = this.animations[this.state];
    // Calcula la posición X exacta en el spritesheet para este fotograma
    const sourceX = anim.startX + (this.currentFrame * this.spriteWidth);
    const sourceY = anim.startY;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Flip horizontal si camina a la izquierda usando una matriz de escala negativa
    if (this.facingLeft) {
      ctx.scale(-1, 1);
    }

    // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    ctx.drawImage(
      this.image,
      sourceX, sourceY, this.spriteWidth, this.spriteHeight, // Rectángulo Origen (Recorte Pixel Art)
      -this.width / 2 - 20, -this.height / 2 - 30, // Offset Destino (Centrado sobre hitbox)
      this.spriteWidth * 0.7, this.spriteHeight * 0.7 // Escala de renderizado en el juego
    );

    ctx.restore();
  }
}
