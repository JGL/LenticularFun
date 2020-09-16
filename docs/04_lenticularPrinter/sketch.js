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

let imgFileFromDrop;

let gifP5ImageFromImgFileFromDrop;

function setup() {
  pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
  textAlign(CENTER, CENTER); //https://p5js.org/reference/#/p5/textAlign

  canvas = createCanvas(windowWidth, windowHeight);
  // canvas.position(0, 0);
  // canvas.style("z-index", "-1");
  // canvas.style("width", "100%");
  // canvas.style("height", "100%");
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
  gui.addGlobals("backgroundColour", "paperChoice", "dpi");

  //https://p5js.org/reference/#/p5.Element/drop
  canvas.drop(gotFile);
  text("Please drop an animated gif file on me!", 100, 100);
}

function draw() {
  if (oldDpi != dpi || oldPaperChoice != paperChoice) {
    createPrintCanvas();
  }

  if (imgFileFromDrop) {
    if (gifP5ImageFromImgFileFromDrop) {
      // console.log("gifP5ImageFromImgFileFromDrop is NOT null, as it exists now!");
    } else {
      // console.log("gifFileFromImgFileFromDrop is null");
      //so a file has been dropped and it exists and has been loaded, but still only a dom element, we need a p5.Image object in order to be able to use it properly
      //it's null and it hasn't been made, let's try making it
      // https://p5js.org/reference/#/p5/loadImage
      // - critical part is "You can also pass in a string of a base64 encoded image as an alternative to the file path. Remember to add "data: image / png; base64, " in front of the string."
      gifP5ImageFromImgFileFromDrop = loadImage(
        imgFileFromDrop.elt.src,
        successImgToImage,
        failImgToImage
      );
    }
  } else {
    //wait for a file to be dropped...
  }

  if (
    imgFileFromDrop &&
    gifP5ImageFromImgFileFromDrop &&
    gifP5ImageFromImgFileFromDrop.width > 1
  ) {
    //then a img has been dropped and a p5.image has been made from said img (img means dom element, image means p5.image, which is what we need to be able to look at the number of frames and the like)
    // we also need this check: gifP5ImageFromImgFileFromDrop.width > 1 to make sure the image has actually been loaded
    printCanvas.clear();
    printCanvas.background(backgroundColour);

    gifP5ImageFromImgFileFromDrop.pause();

    //safe to assume that all the frames of animation have the same width and height
    let gifFrameWidth = gifP5ImageFromImgFileFromDrop.width;
    let gifFrameHeight = gifP5ImageFromImgFileFromDrop.height;

    // let lpi = 20; //hard coding 20 lpi at the moment
    // one inch is 25.4mm see https://en.wikipedia.org/wiki/Inch
    let startFrame = 0;
    // let totalFrames = gifP5ImageFromImgFileFromDrop.numFrames();
    let totalFrames = 2; // 11/9/2020 trying two frames input

    let numberOfPixelsInGif = gifFrameWidth; //split it into every pixel of the image, max result
    let gifFramePixelX = 0;
    let gifFramePixelY = 0;
    let gifFramePixelWidth = 1; //1 pixel wide
    let gifFramePixelHeight = gifFrameHeight;
    let canvasX = 0;
    let canvasY = 0;
    let canvasScaledGifPixelWidth = printCanvas.width / numberOfPixelsInGif;
    let canvasScaledGifPixelHeight = printCanvas.height;
    let canvasScaledFrameWidth = canvasScaledGifPixelWidth / totalFrames; //TODO: change to be affected by LPI
    let canvasScaledFrameHeight = printCanvas.height; //TODO: change to be affected by LPI

    let counterForCanvasStartPosition = 0;
    for (
      let currentFrame = startFrame; currentFrame < totalFrames; currentFrame++
    ) {
      gifP5ImageFromImgFileFromDrop.setFrame(currentFrame);

      for (
        let currentGifPixelIndex = 0; currentGifPixelIndex < numberOfPixelsInGif; currentGifPixelIndex++
      ) {
        //https://p5js.org/reference/#/p5.Image/copy
        //copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
        printCanvas.copy(
          gifP5ImageFromImgFileFromDrop,
          gifFramePixelX,
          gifFramePixelY,
          gifFramePixelWidth,
          gifFramePixelHeight,
          canvasX,
          canvasY,
          canvasScaledFrameWidth,
          canvasScaledFrameHeight
        );
        gifFramePixelX += gifFramePixelWidth; //move right in the source image, by exactly a pixel
        canvasX += canvasScaledGifPixelWidth; //move right in the destination canvas, by a scaled pixel
      }

      gifFramePixelX = 0; //reset back to 0 to start from the left again
      counterForCanvasStartPosition++; //move along with where we are placing content on the canvas
      canvasX = counterForCanvasStartPosition * canvasScaledFrameWidth;
    }

    //https://p5js.org/reference/#/p5/createGraphics
    image(printCanvas, 0, 0, windowWidth, windowHeight);
    noLoop(); //trying to see if this improves performance...
  }

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
      // used to be newPixelsPerMM = 300 * 25.4; bug!
      newPixelsPerMM = 300 / 25.4;
      break;
    case "600dpi":
      // used to be newPixelsPerMM = 600 * 25.4; bug!
      newPixelsPerMM = 600 / 25.4;
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

  // want to https://p5js.org/reference/#/p5/round NOT int(), as it always rounds down
  console.log(`About to create a new printCanvas of ${round(newPrintCanvasWidth)} pixels wide by ${round(newPrintCanvasHeight)} pixels high, paperChoice is ${paperChoice} and dpi is ${dpi}.`);

  printCanvas = createGraphics(round(newPrintCanvasWidth), round(newPrintCanvasHeight));
  printCanvas.pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
}

function gotFile(file) {
  imgFileFromDrop = createImg(file.data, "").hide();
}

function successImgToImage() {
  console.log("Success img to p5.image!");
  draw();
}

function failImgToImage() {
  console.log("Fail img to p5.image!");
}
