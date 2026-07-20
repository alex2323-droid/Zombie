export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public size: number;
  public color: string;
  public active: boolean = true;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    
    // Velocidad y dirección aleatorias para el efecto de explosión
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 150 + 50;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    // Tiempo de vida aleatorio entre 0.1 y 0.3 segundos
    this.maxLife = Math.random() * 0.2 + 0.1;
    this.life = this.maxLife;
    
    // Tamaño aleatorio
    this.size = Math.random() * 4 + 2;
    this.color = color;
  }

  public update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Fade out a medida que la partícula muere
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    // Cuadrados pequeños estilo pixel art
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.restore();
  }
}
