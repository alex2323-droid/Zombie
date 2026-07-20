export interface Joystick {
  active: boolean;
  identifier: number | null;
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
  dirX: number;
  dirY: number;
}

export class InputManager {
  public keys: { [key: string]: boolean } = {};
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isMouseDown: boolean = false;

  public moveJoystick: Joystick = { active: false, identifier: null, baseX: 0, baseY: 0, knobX: 0, knobY: 0, dirX: 0, dirY: 0 };
  public aimJoystick: Joystick = { active: false, identifier: null, baseX: 0, baseY: 0, knobX: 0, knobY: 0, dirX: 0, dirY: 0 };
  private maxRadius = 40;

  private canvas: HTMLCanvasElement;

  private handleKeyDown = (e: KeyboardEvent) => { this.keys[e.key.toLowerCase()] = true; };
  private handleKeyUp = (e: KeyboardEvent) => { this.keys[e.key.toLowerCase()] = false; };
  
  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
  };
  
  private handleMouseDown = () => { this.isMouseDown = true; };
  private handleMouseUp = () => { this.isMouseDown = false; };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // Prevenir scroll o gestos predeterminados del navegador
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const x = (t.clientX - rect.left) * scaleX;
      const y = (t.clientY - rect.top) * scaleY;

      // Mitad izquierda para mover, mitad derecha para apuntar/disparar
      if (x < this.canvas.width / 2 && !this.moveJoystick.active) {
        this.moveJoystick.active = true;
        this.moveJoystick.identifier = t.identifier;
        this.moveJoystick.baseX = x;
        this.moveJoystick.baseY = y;
        this.moveJoystick.knobX = x;
        this.moveJoystick.knobY = y;
      } else if (x >= this.canvas.width / 2 && !this.aimJoystick.active) {
        this.aimJoystick.active = true;
        this.aimJoystick.identifier = t.identifier;
        this.aimJoystick.baseX = x;
        this.aimJoystick.baseY = y;
        this.aimJoystick.knobX = x;
        this.aimJoystick.knobY = y;
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const x = (t.clientX - rect.left) * scaleX;
      const y = (t.clientY - rect.top) * scaleY;

      if (this.moveJoystick.active && this.moveJoystick.identifier === t.identifier) {
        this.updateJoystick(this.moveJoystick, x, y);
      } else if (this.aimJoystick.active && this.aimJoystick.identifier === t.identifier) {
        this.updateJoystick(this.aimJoystick, x, y);
      }
    }
  };

  private updateJoystick(joystick: Joystick, x: number, y: number) {
    const dx = x - joystick.baseX;
    const dy = y - joystick.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.maxRadius) {
      joystick.knobX = joystick.baseX + (dx / dist) * this.maxRadius;
      joystick.knobY = joystick.baseY + (dy / dist) * this.maxRadius;
    } else {
      joystick.knobX = x;
      joystick.knobY = y;
    }
    
    // Normalizar dirección entre -1 y 1
    const dirDist = Math.min(dist, this.maxRadius);
    joystick.dirX = dist > 0 ? (dx / dist) * (dirDist / this.maxRadius) : 0;
    joystick.dirY = dist > 0 ? (dy / dist) * (dirDist / this.maxRadius) : 0;
  }

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (this.moveJoystick.active && this.moveJoystick.identifier === t.identifier) {
        this.resetJoystick(this.moveJoystick);
      } else if (this.aimJoystick.active && this.aimJoystick.identifier === t.identifier) {
        this.resetJoystick(this.aimJoystick);
      }
    }
  };

  private resetJoystick(joystick: Joystick) {
    joystick.active = false;
    joystick.identifier = null;
    joystick.dirX = 0;
    joystick.dirY = 0;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}
