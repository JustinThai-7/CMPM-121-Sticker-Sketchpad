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
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// sketching logic
let isDrawing = false;
let lastX: number = 0;
let lastY: number = 0;

// --- Event listeners ---
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY]; // update for next line segment
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// clear
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});
document.body.appendChild(clearButton);
