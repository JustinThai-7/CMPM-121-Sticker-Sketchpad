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

import { Drawable, Line } from "./types.ts";

// global state
const displayList: Drawable[] = [];
const redoList: Drawable[] = [];
let currentLine: Line | null = null;
let currentThickness = 1;

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
  currentLine = new Line(e.offsetX, e.offsetY, currentThickness);
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

const buttonContainer = document.createElement("div");
buttonContainer.id = "buttons";
app.appendChild(buttonContainer);

// button helper
function createButton(text: string, onClick: () => void) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  buttonContainer.appendChild(btn);
  return btn;
}

// tool buttons
const thinButton = createButton("Thin", () => {
  currentThickness = 1;
  updateSelectedTool(thinButton);
});

const thickButton = createButton("Thick", () => {
  currentThickness = 5;
  updateSelectedTool(thickButton);
});

function updateSelectedTool(selectedBtn: HTMLButtonElement) {
  thinButton.classList.remove("selected");
  thickButton.classList.remove("selected");
  selectedBtn.classList.add("selected");
}

// set default selected tool
updateSelectedTool(thinButton);

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
