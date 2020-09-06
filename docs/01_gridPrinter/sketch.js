//duplicated by JGL from https://editor.p5js.org/ml5/sketches/PoseNet_webcam
//also using https://github.com/CodingTrain/website/blob/master/Q_and_A/Q_6_p5_background/sketch.js
//via; https://www.youtube.com/watch?v=OIfEHD3KqCg
//and https://github.com/processing/p5.js/wiki/Beyond-the-canvas

let canvas;
let horizontalRatio;
let verticalRatio;

// GUI controls: https://github.com/bitcraftlab/p5.gui
// p5.gui wants var variables NOT let variables? But not on the examples on the github. ???
var gui;
var guiVisible;
var backgroundColour;
var gridLineColour;
var gridLineWidth;
var gridLineWidthMin;
var gridLineWidthMax;
var gridLineWidthStep;
var gridLineSeparation;
var gridLineSeparationMin;
var gridLineSeparationMax;
var gridLineSeparationStep;
var paperChoice;
var borderSize;
var borderSizeMin;
var borderSizeMax;
var borderSizeStep;
var dpi; //the dpi of the printer

//let from now on thank you, TODO: fix strange let/var bug for p5.gui above
let printCanvas; // the canvas of the printable object see https://p5js.org/reference/#/p5/createGraphics
//two variables used to check if the dpi or paper choice has changed since the last draw call
let oldPaperChoice;
let oldDpi;

function setup() {
  pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
  textAlign(CENTER, CENTER); //https://p5js.org/reference/#/p5/textAlign

  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');
  canvas.style('width', '100%');
  canvas.style('height', '100%');
  /* via https://github.com/CodingTrain/website/blob/master/Q_and_A/Q_6_p5_background/sketch.js and https://www.youtube.com/watch?v=OIfEHD3KqCg */
  //https://github.com/processing/p5.js/wiki/Beyond-the-canvas
  // canvas.parent("p5jsSketch");

  //GUI setup below
  guiVisible = true;
  backgroundColour = [255, 255, 255]; // white
  gridLineColour = [0, 0, 0]; //black
  gridLineWidth = 1;
  gridLineWidthMin = 0;
  gridLineWidthMax = 42;
  gridLineWidthStep = 1;

  gridLineSeparation = 100;
  gridLineSeparationMin = 10;
  gridLineSeparationMax = 200;
  gridLineSeparationStep = 10;

  paperChoice = ['A4 portrait', 'A4 landscape', 'A3 portrait', 'A3 landscape'];

  borderSize = 0;
  borderSizeMin = 0;
  borderSizeMax = 420;
  borderSizeStep = 10;

  dpi = ['300dpi', '600dpi'];

  // Create Layout GUI
  gui = createGui('Press g to hide or show me, all measurements are in pixels, press s to save a png');
  gui.addGlobals('backgroundColour', 'gridLineColour', 'gridLineWidth', 'gridLineSeparation', 'paperChoice', 'borderSize', 'dpi');

  printCanvas = createGraphics(1000, 1000);
  printCanvas.pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
}

function draw() {
  if ((oldDpi != dpi) || (oldPaperChoice != paperChoice)) {
    createPrintCanvas();
  }

  drawGrid();

  //printCanvas.circle(printCanvas.width / 2, printCanvas.height / 2, 100); // draw a circle in the centre at 100 radius

  //https://p5js.org/reference/#/p5/createGraphics
  image(printCanvas, 0, 0, windowWidth, windowHeight);

  //saving old variables so that I can change the size of the canvas if either dpi or paperChoice are changed
  oldDpi = dpi;
  oldPaperChoice = paperChoice;
}

// A function to draw ellipses over the detected keypoints
function drawKeypointsScaled() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        let d = shapeRadius;
        let x = keypoint.position.x * horizontalRatio;
        let y = keypoint.position.y * verticalRatio;

        // pick a shape
        switch (shapeToDraw) {

          case 'circle':
            ellipse(x, y, d, d);
            break;

          case 'square':
            //rectMode(CENTER);
            rect(x, y, d, d);
            break;

          case 'triangle':
            ngon(3, x, y, d);
            break;

          case 'pentagon':
            ngon(5, x, y, d);
            break;

          case 'star':
            star(9, x, y, d / sqrt(3), d);
            break;

        }
      }
    }
  }
}

// check for keyboard events
function keyPressed() {
  switch (key) {
    case 'g':
      guiVisible = !guiVisible;
      if (guiVisible) {
        gui.show();
      } else {
        gui.hide();
      }
      break;
    case 's':
      save(printCanvas, 'renameMe.png');
      //TODO use year and month and day to make this more user friendly
      break;
  }
}

function windowResized() {
  console.log("Resize!");
  resizeCanvas(windowWidth, windowHeight);
}

// draw a regular n-gon with n sides - stolen from https://github.com/bitcraftlab/p5.gui/blob/master/examples/quicksettings-1/sketch.js
function ngon(n, x, y, d) {
  beginShape();
  for (var i = 0; i < n; i++) {
    var angle = TWO_PI / n * i;
    var px = x + sin(angle) * d / 2;
    var py = y - cos(angle) * d / 2;
    vertex(px, py);
  }
  endShape(CLOSE);
}

// draw a regular n-gon with n sides - stolen from https://github.com/bitcraftlab/p5.gui/blob/master/examples/quicksettings-1/sketch.js
function star(n, x, y, d1, d2) {
  beginShape();
  for (var i = 0; i < 2 * n; i++) {
    var d = (i % 2 === 1) ? d1 : d2;
    var angle = PI / n * i;
    var px = x + sin(angle) * d / 2;
    var py = y - cos(angle) * d / 2;
    vertex(px, py);
  }
  endShape(CLOSE);
}

function createPrintCanvas() {
  //this function creates the printable canvas according to dpi and paperChoice variables
  var pixelsPerMM = 100;
  var newPrintCanvasWidth = 100;
  var newPrintCanvasHeight = 100;
  var newPixelsPerMM = 100;

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  switch (dpi) {
    // one inch is 25.4mm see https://en.wikipedia.org/wiki/Inch
    case '300dpi':
      newPixelsPerMM = 300 * 25.4;
      break;
    case '600dpi':
      newPixelsPerMM = 600 * 25.4;
      break;
    default:
      //printing variables using ES6 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      console.log(`Unknown dpi ${dpi} in createPrintCanvas.`);
  }

  //https://en.wikipedia.org/wiki/Paper_size#A_series
  switch (paperChoice) {
    case 'A4 portrait':
      //A4 portrait is 210mm wide by 297mm high
      newPrintCanvasWidth = 210 * newPixelsPerMM;
      newPrintCanvasHeight = 297 * newPixelsPerMM;
      break;
    case 'A4 landscape':
      //A4 landscape is 297mm wide by 210mm high
      newPrintCanvasWidth = 297 * newPixelsPerMM;
      newPrintCanvasHeight = 210 * newPixelsPerMM;
      break;
    case 'A3 portrait':
      //A3 portrait is 297mm wide by 420mm high
      newPrintCanvasWidth = 297 * newPixelsPerMM;
      newPrintCanvasHeight = 420 * newPixelsPerMM;
      break;
    case 'A3 landscape':
      //A3 landscape is 420mm wide by 297mm high
      newPrintCanvasWidth = 420 * newPixelsPerMM;
      newPrintCanvasHeight = 297 * newPixelsPerMM;
      break;
    default:
      console.log(`Unknown paperChoice ${paperChoice} in createPrintCanvas.`);
  }

  console.log(`About to create a new printCanvas of ${newPrintCanvasWidth} pixels wide by ${newPrintCanvasHeight} pixels high, paperChoice is ${paperChoice} and dpi is ${dpi}.`);

  // printCanvas = createGraphics(newPrintCanvasWidth, newPrintCanvasHeight);
  // printCanvas.pixelDensity(1);
}

function drawGrid() {
  //console.log(`printCanvas is ${printCanvas.width} pixels wide by ${printCanvas.height} pixels high.`);

  // clear all
  //https://p5js.org/reference/#/p5/createGraphics
  //https://p5js.org/examples/structure-create-graphics.html
  printCanvas.clear();
  printCanvas.background(backgroundColour);

  // set fill style
  printCanvas.noFill();

  // set stroke style
  //https://p5js.org/reference/#/p5/stroke
  printCanvas.stroke(gridLineColour);
  printCanvas.strokeWeight(gridLineWidth);

  //lets do horizontals first
  let startGridLineX = borderSize;
  let endGridLineX = printCanvas.width - borderSize;
  let gridLineY = borderSize;

  while (gridLineY < (printCanvas.height - borderSize)) {
    printCanvas.line(startGridLineX, gridLineY, endGridLineX, gridLineY);
    gridLineY += gridLineSeparation;
  }

  //now verticals
  let startGridLineY = borderSize;
  let endGridLineY = printCanvas.height - borderSize;
  let gridLineX = borderSize;

  while (gridLineX < (printCanvas.width - borderSize)) {
    printCanvas.line(gridLineX, startGridLineY, gridLineX, endGridLineY);
    gridLineX += gridLineSeparation;
  }
}
