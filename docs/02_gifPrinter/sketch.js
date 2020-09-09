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
var paperChoice;
var dpi; //the dpi of the printer

//let from now on thank you, TODO: fix strange let/var bug for p5.gui above
let printCanvas; // the canvas of the printable object see https://p5js.org/reference/#/p5/createGraphics
//two variables used to check if the dpi or paper choice has changed since the last draw call
let oldPaperChoice = -1;
let oldDpi = -1;

let gifFile;

function preload() {
  gifFile = loadImage("../gifs/perfectBlueRedNoodleLoop.gif");
}

function setup() {
  pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
  textAlign(CENTER, CENTER); //https://p5js.org/reference/#/p5/textAlign

  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("z-index", "-1");
  canvas.style("width", "100%");
  canvas.style("height", "100%");
  /* via https://github.com/CodingTrain/website/blob/master/Q_and_A/Q_6_p5_background/sketch.js and https://www.youtube.com/watch?v=OIfEHD3KqCg */
  //https://github.com/processing/p5.js/wiki/Beyond-the-canvas

  //GUI setup below
  guiVisible = true;
  backgroundColour = [255, 255, 255]; // white

  paperChoice = ["A4_Portrait", "A4_Landscape", "A3_Portrait", "A3_Landscape"];

  dpi = ["300dpi", "600dpi"];

  // Create Layout GUI
  gui = createGui(
    "Press g to hide or show me, all measurements are in pixels, press s to save a png"
  );
  gui.addGlobals(
    "backgroundColour",
    "paperChoice",
    "dpi"
  );

  gifFile.pause();
}

function draw() {
  if (oldDpi != dpi || oldPaperChoice != paperChoice) {
    createPrintCanvas();
  }

  // clear all
  //https://p5js.org/reference/#/p5/createGraphics
  //https://p5js.org/examples/structure-create-graphics.html
  printCanvas.clear();
  printCanvas.background(backgroundColour);

  //lets start drawing the grid of frames from the topleft
  let currentFrameTopLeftX = 0;
  let currentFrameTopLeftY = 0;
  //safe to assume that all the frames of animation have the same width and height
  let currentFrameWidth = gifFile.width;
  let currentFrameHeight = gifFile.height;

  for (let i = 0; i < gifFile.numFrames(); i++) {
    gifFile.setFrame(i);
    printCanvas.image(gifFile, currentFrameTopLeftX, currentFrameTopLeftY, currentFrameWidth, currentFrameHeight);
    //add the width to the x position to keep moving right
    currentFrameTopLeftX += currentFrameWidth;

    if ((currentFrameTopLeftX + currentFrameWidth) > printCanvas.width) {
      //if the next draw would overlap the edge of the canvas, then rest the currentFrameTopLeftX to 0
      currentFrameTopLeftX = 0;
      //and increment the currentFrameTopLeftY by currentFrameHeight
      currentFrameTopLeftY += currentFrameHeight;
    }
  }

  //https://p5js.org/reference/#/p5/createGraphics
  image(printCanvas, 0, 0, windowWidth, windowHeight);

  //saving old variables so that I can change the size of the canvas if either dpi or paperChoice are changed
  oldDpi = dpi;
  oldPaperChoice = paperChoice;
}

// check for keyboard events
function keyPressed() {
  switch (key) {
    case "g":
      guiVisible = !guiVisible;
      if (guiVisible) {
        gui.show();
      } else {
        gui.hide();
      }
      break;
    case "s":
      //thanks https://momentjs.com/
      let niceFileName =
        moment().format("YYYY_MM_DD_HH_mm_ss") +
        "_" +
        paperChoice +
        "_" +
        dpi +
        "_.png";
      save(printCanvas, niceFileName);
      break;
    case "p": //for please work
      saveGif();
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
    var angle = (TWO_PI / n) * i;
    var px = x + (sin(angle) * d) / 2;
    var py = y - (cos(angle) * d) / 2;
    vertex(px, py);
  }
  endShape(CLOSE);
}

// draw a regular n-gon with n sides - stolen from https://github.com/bitcraftlab/p5.gui/blob/master/examples/quicksettings-1/sketch.js
function star(n, x, y, d1, d2) {
  beginShape();
  for (var i = 0; i < 2 * n; i++) {
    var d = i % 2 === 1 ? d1 : d2;
    var angle = (PI / n) * i;
    var px = x + (sin(angle) * d) / 2;
    var py = y - (cos(angle) * d) / 2;
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
    case "300dpi":
      newPixelsPerMM = 300 * 25.4;
      break;
    case "600dpi":
      newPixelsPerMM = 600 * 25.4;
      break;
    default:
      //printing variables using ES6 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      console.log(`Unknown dpi ${dpi} in createPrintCanvas.`);
  }

  //https://en.wikipedia.org/wiki/Paper_size#A_series
  switch (paperChoice) {
    case "A4_Portrait":
      //A4 portrait is 210mm wide by 297mm high
      newPrintCanvasWidth = 210 * newPixelsPerMM;
      newPrintCanvasHeight = 297 * newPixelsPerMM;
      break;
    case "A4_Landscape":
      //A4 landscape is 297mm wide by 210mm high
      newPrintCanvasWidth = 297 * newPixelsPerMM;
      newPrintCanvasHeight = 210 * newPixelsPerMM;
      break;
    case "A3_Portrait":
      //A3 portrait is 297mm wide by 420mm high
      newPrintCanvasWidth = 297 * newPixelsPerMM;
      newPrintCanvasHeight = 420 * newPixelsPerMM;
      break;
    case "A3_Landscape":
      //A3 landscape is 420mm wide by 297mm high
      newPrintCanvasWidth = 420 * newPixelsPerMM;
      newPrintCanvasHeight = 297 * newPixelsPerMM;
      break;
    default:
      console.log(`Unknown paperChoice ${paperChoice} in createPrintCanvas.`);
  }

  console.log(
    `About to create a new printCanvas of ${newPrintCanvasWidth} pixels wide by ${newPrintCanvasHeight} pixels high, paperChoice is ${paperChoice} and dpi is ${dpi}.`
  );

  let scaleFactor = 1000;

  newPrintCanvasWidth /= scaleFactor; //scale down by scaleFactor
  newPrintCanvasHeight /= scaleFactor;

  console.log(
    `Scaled down by ${scaleFactor} to a new printCanvas of ${int(
      newPrintCanvasWidth
    )} pixels wide by ${int(
      newPrintCanvasHeight
    )} pixels high, paperChoice is ${paperChoice} and dpi is ${dpi}.`
  );

  printCanvas = createGraphics(
    int(newPrintCanvasWidth),
    int(newPrintCanvasHeight)
  );
  printCanvas.pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
}
