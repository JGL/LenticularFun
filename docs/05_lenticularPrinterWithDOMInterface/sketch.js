//duplicated by JGL from https://editor.p5js.org/ml5/sketches/PoseNet_webcam
//also using https://github.com/CodingTrain/website/blob/master/Q_and_A/Q_6_p5_background/sketch.js
//via; https://www.youtube.com/watch?v=OIfEHD3KqCg
//and https://github.com/processing/p5.js/wiki/Beyond-the-canvas

let canvas;
let horizontalRatio;
let verticalRatio;

// GUI controls, now using DOM elements
let paperChoiceSelect; //the kind (a3 or a4) and orietation (portrait or landscape) that we are emulating
let dpiSelect; //the dpi of the printer
let gifFileInput; //the DOM element that allows you to load in a gif
let saveButton; //the button that is enabled when the interlacing has occurred
let numberOfFramesSlider; //the DOM slider element that selects the number of frames to render

let printCanvas; // the canvas of the printable object see https://p5js.org/reference/#/p5/createGraphics

let imgFileFromFileInput; //the dom image that is created when someone selects a file to upload
let gifP5ImageFromImgFileFromFileInput; //the p5.image that is created from the imgFileFromDrop dom image, it needs to be a p5.image so I can access the frames of the animated gif

function setup() {
  pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
  textAlign(CENTER, CENTER); //https://p5js.org/reference/#/p5/textAlign

  canvas = createCanvas(210, 297); //portrait a4 ratio for now

  //https://p5js.org/reference/#/p5/createSelect
  paperChoiceSelect = createSelect();
  paperChoiceSelect.option("A4_Portrait");
  paperChoiceSelect.option("A4_Landscape");
  paperChoiceSelect.option("A3_Portrait");
  paperChoiceSelect.option("A3_Landscape");
  paperChoiceSelect.selected("A4_Portrait");
  paperChoiceSelect.changed(createPrintCanvas);

  //https://p5js.org/reference/#/p5/createSelect
  dpiSelect = createSelect();
  dpiSelect.option("300_dpi");
  dpiSelect.option("600_dpi");
  dpiSelect.selected("300_dpi");
  dpiSelect.changed(createPrintCanvas);

  //https://p5js.org/reference/#/p5/createFileInput
  gifFileInput = createFileInput(handleFileInput);

  //https://p5js.org/reference/#/p5/createSlider - createSlider(min, max, [value], [step])
  numberOfFramesSlider = createSlider(2, 8, 2, 1);
  numberOfFramesSlider.changed(handleSliderChange);

  saveButton = createButton("Save Lenticular Image");
  saveButton.mousePressed(saveLenticularImage);
  saveButton.hide();

  //make the canvas right away
  createPrintCanvas();
}

function draw() {
  image(printCanvas, 0, 0, width, height);
}

// check for keyboard events
function keyPressed() {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  switch (key) {
    case "j":
      console.log("Hi Joel!");
      break;
    default:
      break;
  }
}

function saveLenticularImage() {
  if (gifP5ImageFromImgFileFromFileInput &&
    gifP5ImageFromImgFileFromFileInput.width > 1) {
    //thanks https://momentjs.com/

    let dpi = dpiSelect.value();
    let paperChoice = paperChoiceSelect.value();

    let niceFileName =
      moment().format("YYYY_MM_DD_HH_mm_ss") +
      "_" +
      paperChoice +
      "_" +
      dpi +
      "_.png";
    save(printCanvas, niceFileName);
  }
}

function windowResized() {
  console.log("Resize!");
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
  var newPrintCanvasWidth = 100;
  var newPrintCanvasHeight = 100;
  var newPixelsPerMM = 100;

  let dpi = dpiSelect.value();
  let paperChoice = paperChoiceSelect.value();

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  switch (dpi) {
    // one inch is 25.4mm see https://en.wikipedia.org/wiki/Inch
    case "300_dpi":
      newPixelsPerMM = 300 * 25.4;
      break;
    case "600_dpi":
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

  //https://p5js.org/reference/#/p5/createGraphics
  //https://p5js.org/examples/structure-create-graphics.html
  printCanvas = createGraphics(
    int(newPrintCanvasWidth),
    int(newPrintCanvasHeight)
  );
  printCanvas.pixelDensity(1); //https://p5js.org/reference/#/p5/pixelDensity
}

function handleFileInput(file) {
  print(file);
  if (file.type === 'image' && file.subtype === 'gif') {
    // console.log("Got an image in handleFileInput");
    imgFileFromFileInput = createImg(file.data, "");
    imgFileFromFileInput.hide();

    //so a file has been dropped and it exists and has been loaded, but still only a dom element, we need a p5.Image object in order to be able to use it properly
    //it's null and it hasn't been made, let's try making it
    // https://p5js.org/reference/#/p5/loadImage
    // - critical part is "You can also pass in a string of a base64 encoded image as an alternative to the file path. Remember to add "data: image / png; base64, " in front of the string."
    gifP5ImageFromImgFileFromFileInput = loadImage(
      imgFileFromFileInput.elt.src,
      successImgToImage,
      failImgToImage
    );
  } else {
    console.log("Non animated gif image file attempted failed to load");
    imgFileFromFileInput = null;
  }
}


function successImgToImage() {
  console.log("Success img to p5.image!");
  saveButton.show();
  createLenticular();
}

function failImgToImage() {
  console.log("Fail img to p5.image!");
}

function createLenticular() {
  printCanvas.clear();
  //https://p5js.org/reference/#/p5/background
  printCanvas.background(255); //clear to white background

  gifP5ImageFromImgFileFromFileInput.pause();

  //safe to assume that all the frames of animation have the same width and height
  let gifFrameWidth = gifP5ImageFromImgFileFromFileInput.width;
  let gifFrameHeight = gifP5ImageFromImgFileFromFileInput.height;

  // let lpi = 20; //hard coding 20 lpi at the moment
  // one inch is 25.4mm see https://en.wikipedia.org/wiki/Inch
  let startFrame = 0;
  // let totalFrames = gifP5ImageFromImgFileFromFileInput.numFrames();
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
    gifP5ImageFromImgFileFromFileInput.setFrame(currentFrame);

    for (
      let currentGifPixelIndex = 0; currentGifPixelIndex < numberOfPixelsInGif; currentGifPixelIndex++
    ) {
      //https://p5js.org/reference/#/p5.Image/copy
      //copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
      printCanvas.copy(
        gifP5ImageFromImgFileFromFileInput,
        gifFramePixelX,
        gifFramePixelY,
        gifFramePixelWidth,
        gifFramePixelHeight,
        canvasX, //TODO, casting this to int() reduces errors but makes visible boundaries
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
}

function handleSliderChange() {
  console.log(`Slider slide to ${numberOfFramesSlider.value()}`);
}
