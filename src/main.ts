import "./style.css";

// title
const headingText = "Sticker Sketchpad";
const heading = document.createElement("h1");
heading.textContent = headingText;
document.body.appendChild(heading);

// init canvas
const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
if (!ctx) { //ctx error check
  console.error("Failed to get 2D rendering context");
  throw new Error("Canvas 2D context not supported");
}

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

class Line implements Drawable {
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

// global state
const displayList: Drawable[] = [];
const redoList: Drawable[] = [];
let currentLine: Line | null = null;

// observer / events
const drawingChanged = new Event("drawing-changed");

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

function redraw() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  ctx!.fillStyle = "white";
  ctx!.fillRect(0, 0, canvas.width, canvas.height);

  for (const item of displayList) {
    item.display(ctx!);
  }

  if (currentLine) {
    currentLine.display(ctx!);
  }
}

// event listeners
canvas.addEventListener("mousedown", (e) => {
  currentLine = new Line(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!currentLine) return;
  currentLine.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mouseup", () => {
  if (currentLine) {
    displayList.push(currentLine);
    currentLine = null;
    redoList.length = 0;
    canvas.dispatchEvent(drawingChanged);
  }
});

canvas.addEventListener("mouseleave", () => {
  if (currentLine) {
    displayList.push(currentLine);
    currentLine = null;
    redoList.length = 0;
    canvas.dispatchEvent(drawingChanged);
  }
});

// ui / controls
const app = document.createElement("div");
app.id = "app";
document.body.appendChild(app);

// button helper
function createButton(text: string, onClick: () => void) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  app.appendChild(btn);
  return btn;
}

// buttons
// clear
createButton("Clear", () => {
  displayList.length = 0;
  redoList.length = 0;
  canvas.dispatchEvent(drawingChanged);
});
// undo button
createButton("Undo", () => {
  if (displayList.length > 0) {
    const lastItem = displayList.pop();
    if (lastItem) {
      redoList.push(lastItem);
      canvas.dispatchEvent(drawingChanged);
    }
  }
});
// redo button
createButton("Redo", () => {
  if (redoList.length > 0) {
    const nextItem = redoList.pop();
    if (nextItem) {
      displayList.push(nextItem);
      canvas.dispatchEvent(drawingChanged);
    }
  }
});

// initial draw
canvas.dispatchEvent(drawingChanged);
