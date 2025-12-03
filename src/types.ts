export interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

export class Line implements Drawable {
  private points: { x: number; y: number }[] = [];
  private thickness: number;
  private color: string;

  constructor(
    initialX: number,
    initialY: number,
    thickness: number = 1,
    color: string = "black",
  ) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}
