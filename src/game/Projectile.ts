export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public speed: number = 600; // Alta velocidad para las balas
  public radius: number = 3;
  public active: boolean = true;
  public color: string = '#fffb00'; // Bala brillante amarilla/neón
  
  constructor(x: number, y: number, dirX: number, dirY: number, isVector: boolean = false) {
    this.x = x;
    this.y = y;
    
    if (isVector) {
      const distance = Math.sqrt(dirX * dirX + dirY * dirY);
      this.vx = distance > 0 ? (dirX / distance) * this.speed : 0;
      this.vy = distance > 0 ? (dirY / distance) * this.speed : 0;
    } else {
      const dx = dirX - x;
      const dy = dirY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.vx = (dx / distance) * this.speed;
      this.vy = (dy / distance) * this.speed;
    }
  }

  public update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    
    // Rastro (Trail) simple para efecto visual
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05); // Línea pequeña detrás
    ctx.strokeStyle = 'rgba(255, 251, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
