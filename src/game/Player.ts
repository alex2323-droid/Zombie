export class Player {
  public x: number;
  public y: number;
  public width: number = 24; // Hitbox más pequeña que el sprite
  public height: number = 24;
  public speed: number = 200; // pixels por segundo
  public color: string = '#00ff00';
  public hp: number = 100;

  // Variables preparadas para spritesheets
  public frameX: number = 0;
  public frameY: number = 0;
  // public image?: HTMLImageElement; // Aquí cargarás tu .png de pixel art, ej: new Image(); image.src = '/assets/player.png';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(dt: number, keys: { [key: string]: boolean }, moveJoystick?: { dirX: number, dirY: number }, walls: {x: number, y: number, w: number, h: number}[] = []) {
    let dx = 0;
    let dy = 0;
    
    // Joystick priority
    if (moveJoystick && (moveJoystick.dirX !== 0 || moveJoystick.dirY !== 0)) {
      dx = moveJoystick.dirX;
      dy = moveJoystick.dirY;
    } else {
      // Keyboard fallback
      if (keys['w']) dy -= 1;
      if (keys['s']) dy += 1;
      if (keys['a']) dx -= 1;
      if (keys['d']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
      }
    }

    let newX = this.x + dx * this.speed * dt;
    let newY = this.y + dy * this.speed * dt;

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

  public draw(ctx: CanvasRenderingContext2D) {
    // Cuando integres tu Sprite, comenta el bloque "else" y descomenta este:
    /*
    if (this.image) {
      // Dibujar frame de animación:
      // ctx.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    } else {
    */
      // Marcador de posición temporal (rectángulo verde neón)
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
      
      // Indicador visual de dirección (opcional)
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x - 2, this.y - this.height/2, 4, 10);
    // }
  }
}
