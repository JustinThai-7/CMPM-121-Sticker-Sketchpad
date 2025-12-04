import "./style.css";

// ui / controls
const app = document.createElement("div");
app.id = "app";
document.body.appendChild(app);

// title
const headingText = "Sticker Sketchpad";
const heading = document.createElement("h1");
heading.textContent = headingText;
app.appendChild(heading);

// init canvas
const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 512;
canvas.height = 512;
app.appendChild(canvas);

const ctx = canvas.getContext("2d");
if (!ctx) { //ctx error check
  console.error("Failed to get 2D rendering context");
  throw new Error("Canvas 2D context not supported");
}

import { Drawable, Line, Sticker, ToolPreview } from "./types.ts";

// global state
const displayList: Drawable[] = [];
const redoList: Drawable[] = [];
let currentLine: Line | null = null;
let currentThickness = 2;
let currentEmoji: string | null = null;
let currentColor = "black"; // Default color
let currentRotation = 0; // Default rotation
let toolPreview: ToolPreview | Sticker | null = null;

// observer / events
const drawingChanged = new Event("drawing-changed");
const toolMoved = new Event("tool-moved");

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

canvas.addEventListener("tool-moved", () => {
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

  if (toolPreview) {
    toolPreview.display(ctx!);
  }
}

// event listeners
canvas.addEventListener("mousedown", (e) => {
  if (currentEmoji) {
    currentLine = new Sticker(
      e.offsetX,
      e.offsetY,
      currentEmoji,
      currentRotation,
    ) as unknown as Line; // Cast to satisfy type for now, or update type
    
    // Randomize rotation for the next sticker
    currentRotation = Math.random() * 360;
    
    // Actually, Sticker is Drawable, but currentLine is Line | null.
    // We need to update currentLine type or use a generic currentCommand.
    // Let's fix the type of currentLine to be Drawable | null in the next step if needed,
    // but for now let's assume we can treat it as the "active command".
    // Wait, Line has drag(), Sticker has drag(). Drawable does NOT have drag().
    // We need to update Drawable interface to include drag? Or cast.
  } else {
    currentLine = new Line(
      e.offsetX,
      e.offsetY,
      currentThickness,
      currentColor,
    );
  }
  toolPreview = null;
  canvas.dispatchEvent(toolMoved);
});

canvas.addEventListener("mousemove", (e) => {
  if (!currentLine) {
    if (currentEmoji) {
      toolPreview = new Sticker(
        e.offsetX,
        e.offsetY,
        currentEmoji,
        currentRotation,
      );
    } else {
      toolPreview = new ToolPreview(
        e.offsetX,
        e.offsetY,
        currentThickness,
        currentColor,
      );
    }
    canvas.dispatchEvent(toolMoved);
  } else {
    currentLine.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(drawingChanged);
  }
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
  toolPreview = null;
  canvas.dispatchEvent(toolMoved);
  if (currentLine) {
    displayList.push(currentLine);
    currentLine = null;
    redoList.length = 0;
    canvas.dispatchEvent(drawingChanged);
  }
});

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
  currentThickness = 2;
  currentEmoji = null;
  // Randomize color
  currentColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
  updateSelectedTool(thinButton);
  canvas.dispatchEvent(toolMoved);
});

const thickButton = createButton("Thick", () => {
  currentThickness = 4;
  currentEmoji = null;
  // Randomize color
  currentColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
  updateSelectedTool(thickButton);
  canvas.dispatchEvent(toolMoved);
});

// sticker buttons
const stickers = ["😊", "⭐", "🦕"];
const stickerButtons: HTMLButtonElement[] = [];

function addSticker(emoji: string) {
  const btn = createButton(emoji, () => {
    currentEmoji = emoji;
    // Randomize rotation
    currentRotation = Math.random() * 360;
    updateSelectedTool(btn);
    canvas.dispatchEvent(toolMoved);
  });
  stickerButtons.push(btn);
  return btn;
}

// Initialize default stickers
for (const emoji of stickers) {
  addSticker(emoji);
}

// Custom sticker button
createButton("Custom Sticker", () => {
  const text = prompt("Custom sticker text", "🧽");
  if (text) {
    const btn = addSticker(text);
    // Automatically select the new sticker
    currentEmoji = text;
    currentRotation = Math.random() * 360; // Randomize rotation
    updateSelectedTool(btn);
    canvas.dispatchEvent(toolMoved);
  }
});

function updateSelectedTool(selectedBtn: HTMLButtonElement) {
  thinButton.classList.remove("selected");
  thickButton.classList.remove("selected");
  for (const btn of stickerButtons) {
    btn.classList.remove("selected");
  }
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

// export button
createButton("Export", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");

  if (exportCtx) {
    exportCtx.scale(2, 2); // Scale 512 -> 1024
    exportCtx.fillStyle = "white";
    exportCtx.fillRect(0, 0, 512, 512); // Fill background relative to scale

    for (const item of displayList) {
      item.display(exportCtx);
    }

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  }
});

// initial draw
canvas.dispatchEvent(drawingChanged);
