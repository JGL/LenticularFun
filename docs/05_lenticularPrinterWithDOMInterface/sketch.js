//duplicated by JGL from https://editor.p5js.org/ml5/sketches/PoseNet_webcam
//also using https://github.com/CodingTrain/website/blob/master/Q_and_A/Q_6_p5_background/sketch.js
//via; https://www.youtube.com/watch?v=OIfEHD3KqCg
//and https://github.com/processing/p5.js/wiki/Beyond-the-canvas

let canvas;
let horizontalRatio;
let verticalRatio;

// GUI controls, now using DOM elements
let paperChoiceSelect; //the kind (a3 or a4) and orientation (portrait or landscape) that we are emulating
let dpiSelect; //the dpi of the printer
let gifFileInput; //the DOM element that allows you to load in a gif
let saveButton; //the button that is enabled when the interlacing has occurred
let lpiSelect; // the lpi of the lenticular sheet

let numberOfFramesSelect; //how many frames should I use for the lenticular image? This is dependent on dpi and lpi
let startFrameSlider; //which frame should I start with for the lenticular image? TODO: add an option to skip frames? Or is this better to do in the editing of gifs

let printCanvas; // the canvas of the printable object see https://p5js.org/reference/#/p5/createGraphics

let imgFileFromFileInput; //the dom image that is created when someone selects a file to upload
let gifP5ImageFromImgFileFromFileInput; //the p5.image that is created from the imgFileFromDrop dom image, it needs to be a p5.image so I can access the frames of the animated gif

// one inch is 25.4mm see https://en.wikipedia.org/wiki/Inch
const MMPERINCH = 25.4;

let filenameWithoutExtension;

function createFileGUIElements() {
  //https://p5js.org/reference/#/p5/createFileInput
  gifFileInput = createFileInput(handleFileInput);

  saveButton = createButton("Save Lenticular Image");
  saveButton.mousePressed(saveLenticularImage);
  saveButton.hide(); // only show it when there is a file to save
}

function removeNonFileDOMGUIElements() {
  if (paperChoiceSelect && lpiSelect && numberOfFramesSelect && startFrameSlider) {
    //https://p5js.org/reference/#/p5.Element/remove
    paperChoiceSelect.remove();
    //used to be GUI element, no longer
    // dpiSelect.remove();
    lpiSelect.remove();
    numberOfFramesSelect.remove();
    startFrameSlider.remove();
  } else {
    console.log("Trying to remove elements that haven't been created, in removeNonFileDOMGUIElements, this should happen precisely once per session.");
  }

}

function createNonFileDOMGUIElements() {
  if (gifP5ImageFromImgFileFromFileInput &&
    gifP5ImageFromImgFileFromFileInput.width > 1) {
    //then we have a p5.image file to start using 

    //https://p5js.org/reference/#/p5/createSelect
    paperChoiceSelect = createSelect();
    paperChoiceSelect.option("A4_Portrait");
    paperChoiceSelect.option("A4_Landscape");
    // only A4 options for now
    // paperChoiceSelect.option("A3_Portrait");
    // paperChoiceSelect.option("A3_Landscape");
    paperChoiceSelect.selected("A4_Portrait");
    paperChoiceSelect.changed(createPrintCanvasAndReRenderLenticular);

    let paperChoiceLabel = createP('Choose the paper orientation: ');
    paperChoiceLabel.child(paperChoiceSelect);

    //https://p5js.org/reference/#/p5/createSelect
    // only working at 600 dpi now
    // dpiSelect = createSelect();
    // dpiSelect.option("300_dpi");
    // dpiSelect.option("600_dpi");
    // dpiSelect.selected("600_dpi");
    // dpiSelect.changed(createPrintCanvas);
    // dpiSelect.hide();

    let totalNumberOfFramesInGIF = gifP5ImageFromImgFileFromFileInput.numFrames();
    //https://p5js.org/reference/#/p5/createSlider - createSlider(min, max, [value], [step])
    startFrameSlider = createSlider(0, totalNumberOfFramesInGIF - 1, 0, 1);
    startFrameSlider.changed(createLenticular);

    let startFramesLabel = createP('Choose your starting frame: ');
    startFramesLabel.child(startFrameSlider);

    //https://p5js.org/reference/#/p5/createSelect
    lpiSelect = createSelect();
    lpiSelect.option("20_lpi");
    lpiSelect.option("40_lpi");
    lpiSelect.selected("20_lpi");
    lpiSelect.changed(lpiChanged);

    let lpiLabel = createP('Choose LPI: ');
    lpiLabel.child(lpiSelect);

    lpiChanged(); //work out the right values to put into the numberOfFramesSelect GUI element and create it
  } else {
    //https://developer.mozilla.org/en-US/docs/Web/API/Console/error
    console.error("Trying to make a lpi selector and number of frames slider and start frames slider for a gif that hasn't been converted into a p5.image or has a width < 1 pixels");
  }
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

  dpiSelect = "600_dpi"; //used to be a GUI element, now it's locked to 600 dpi

  //make only the File GUI elements, saving the others for when a file has been created
  createFileGUIElements();
  filenameWithoutExtension = "noFileLoadedYet";
}

function draw() {
  if (printCanvas) {
    image(printCanvas, 0, 0, width, height);
  }


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

    //let dpi = dpiSelect.value(); used to be a GUI element that you could choice the DPI that you were outputting to, no longer
    let dpi = dpiSelect;
    let paperChoice = paperChoiceSelect.value();
    let lpi = lpiSelect.value();
    let selectedNumberOfFramesSelect = numberOfFramesSelect.value();
    let startFrame = startFrameSlider.value();

    let niceFileName =
      moment().format("YYYY_MM_DD_HH_mm_ss") +
      "_" +
      filenameWithoutExtension +
      "_" +
      paperChoice +
      "_" +
      dpi +
      "_" +
      lpi +
      "_" +
      selectedNumberOfFramesSelect +
      "_startFrame_" +
      startFrame +
      "_.png";
    save(printCanvas, niceFileName);
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
  var newPrintCanvasWidth = 100;
  var newPrintCanvasHeight = 100;
  var newPixelsPerMM = 100;

  //let dpi = dpiSelect.value(); used to be a GUI element that you could choice the DPI that you were outputting to, no longer
  let dpi = dpiSelect;

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  switch (dpi) {
    case "300_dpi":
      // used to be newPixelsPerMM = 300 * 25.4; horrible logic bug! Line below too
      newPixelsPerMM = 300 / MMPERINCH;
      break;
    case "600_dpi":
      newPixelsPerMM = 600 / MMPERINCH;
      break;
    default:
      //printing variables using ES6 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      console.error(`Unknown dpi ${dpi} in createPrintCanvas.`);
  }

  let paperChoice = paperChoiceSelect.value();

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
      console.error(`Unknown paperChoice ${paperChoice} in createPrintCanvas.`);
  }

  // want to https://p5js.org/reference/#/p5/round NOT int(), as it always rounds down
  console.log(`About to create a new printCanvas of ${round(newPrintCanvasWidth)} pixels wide by ${round(newPrintCanvasHeight)} pixels high, paperChoice is ${paperChoice} and dpi is ${dpi}.`);

  printCanvas = createGraphics(round(newPrintCanvasWidth), round(newPrintCanvasHeight));
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

    //https://stackoverflow.com/questions/4250364/how-to-trim-a-file-extension-from-a-string-in-javascript
    filenameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
  } else {
    console.error("Non animated gif image file attempted failed to load");
    imgFileFromFileInput = null;
  }
}


function successImgToImage() {
  console.log("Success img to p5.image!");
  //remove non file dom GUI elements
  removeNonFileDOMGUIElements();
  //create non file dom GUI elements
  createNonFileDOMGUIElements();
  // make the canvas
  createPrintCanvas();
  //render the new lencticular image
  createLenticular();
  //display the save button as you can save your lenticular file out now
  saveButton.show();
}

function failImgToImage() {
  console.error("Fail img to p5.image!");
}

function createLenticular() {
  printCanvas.clear();
  //https://p5js.org/reference/#/p5/background
  printCanvas.background(255); //clear to white background

  gifP5ImageFromImgFileFromFileInput.pause();

  //safe to assume that all the frames of animation have the same width and height
  let gifFrameWidth = gifP5ImageFromImgFileFromFileInput.width;
  let gifFrameHeight = gifP5ImageFromImgFileFromFileInput.height;

  let startFrame = startFrameSlider.value();

  let selectedNumberOfFramesSelect = numberOfFramesSelect.value();
  let numberOfFramesToUse = 3; //3 is the default as it works for both 20 and 40 lpi at 600 dpi

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  switch (selectedNumberOfFramesSelect) {
    case "2_frames":
      numberOfFramesToUse = 2;
      break;
    case "3_frames":
      numberOfFramesToUse = 3;
      break;
    case "5_frames":
      numberOfFramesToUse = 5;
      break;
    case "6_frames":
      numberOfFramesToUse = 6;
      break;
    case "10_frames":
      numberOfFramesToUse = 10;
      break;
    default:
      //printing variables using ES6 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      console.error(`Unknown number of frames to use ${selectedNumberOfFramesSelect} in createLenticular.`);
  }

  let gifFramePixelX = 0;
  let gifFramePixelY = 0;
  let gifFramePixelWidth = 1; //1 pixel wide
  let gifFramePixelHeight = gifFrameHeight;
  let canvasX = 0;
  let canvasY = 0;

  let canvasScaledGifPixelWidth;
  let lpi = lpiSelect.value();

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  switch (lpi) {
    case "20_lpi":
      // working at 600 dpi and 20 lpi
      // 1/20 inch is one lenticule
      // 1/600 inch is one pixel
      // Therefore 30 pixels per lenticule - (600/20)
      canvasScaledGifPixelWidth = 30;
      break;
    case "40_lpi":
      // working at 600 dpi and 40 lpi
      // 1/40 inch is one lenticule
      // 1/600 inch is one pixel
      // Therefore 15 pixels per lenticule - (600/40)
      canvasScaledGifPixelWidth = 15;
      break;
    default:
      //printing variables using ES6 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      console.error(`Unknown lpi ${lpi} in createGIFDependentGUIElements.`);
  }

  let totalNumberOfFramesInGIF = gifP5ImageFromImgFileFromFileInput.numFrames();
  let canvasScaledFrameWidth = canvasScaledGifPixelWidth / numberOfFramesToUse; //TODO: round this?
  let canvasScaledFrameHeight = printCanvas.height;
  let counterForCanvasStartPosition = 0;
  let counterForFramesUsed = 0;
  for (
    let currentFrame = startFrame; counterForFramesUsed < numberOfFramesToUse; currentFrame++
  ) {
    //the user may want to use more frames of animation than there are, so use modulo to select the correct current frame
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    let theFrameToUse = currentFrame % totalNumberOfFramesInGIF;
    gifP5ImageFromImgFileFromFileInput.setFrame(theFrameToUse);

    for (
      let currentGifPixelIndex = 0; currentGifPixelIndex < gifFrameWidth; currentGifPixelIndex++
    ) {
      //https://p5js.org/reference/#/p5.Image/copy
      //copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
      printCanvas.copy(
        gifP5ImageFromImgFileFromFileInput,
        gifFramePixelX,
        gifFramePixelY,
        gifFramePixelWidth,
        gifFramePixelHeight,
        canvasX, //TODO, casting this to int() reduces errors but makes visible boundaries, should use round?
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
    counterForFramesUsed++; //keep track of the number of frames we've used to make lenticular content with 
  }
}

function lpiChanged() {
  let lpi = lpiSelect.value();

  if (numberOfFramesSelect) {
    //if it exists, remove it, and it's label, which is it's parent
    //https://p5js.org/reference/#/p5.Element/remove
    numberOfFramesSelect.parent().remove();
  }

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  // lpi selection dictates the number of frames we could possibly use
  switch (lpi) {
    case "20_lpi":
      // working at 600 dpi and 20 lpi
      // 1/20 inch is one lenticule
      // 1/600 inch is one pixel
      // Therefore 30 pixels per lenticule - (600/20)
      // splitting 30 pixels into 2 frames gives 15 pixels for each frame
      // splitting 30 pixels into 3 frames gives 10 pixels for each frame
      // splitting 30 pixels into 5 frames gives 6 pixels for each frame
      // splitting 30 pixels into 6 frames gives 5 pixels for each frame
      // splitting 30 pixels into 10 frames gives 3 pixels for each frame
      //https://p5js.org/reference/#/p5/createSelect
      numberOfFramesSelect = createSelect();
      numberOfFramesSelect.option("2_frames");
      numberOfFramesSelect.option("3_frames");
      numberOfFramesSelect.option("5_frames");
      numberOfFramesSelect.option("6_frames");
      numberOfFramesSelect.option("10_frames");
      numberOfFramesSelect.selected("2_frames");
      numberOfFramesSelect.changed(createLenticular);
      break;
    case "40_lpi":
      // working at 600 dpi and 40 lpi
      // 1/40 inch is one lenticule
      // 1/600 inch is one pixel
      // Therefore 15 pixels per lenticule - (600/40)
      // splitting 15 pixels into 3 frames gives 5 pixels for each frame
      // splitting 15 pixels into 5 frames gives 3 pixels for each frame
      //https://p5js.org/reference/#/p5/createSelect
      numberOfFramesSelect = createSelect();
      numberOfFramesSelect.option("3_frames");
      numberOfFramesSelect.option("5_frames");
      numberOfFramesSelect.selected("3_frames");
      numberOfFramesSelect.changed(createLenticular);
      break;
    default:
      //printing variables using ES6 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      console.error(`Unknown lpi ${lpi} in lpiChanged().`);
  }

  let numberOfFramesLabel = createP('Choose number of frames to use in lenticular: ');
  numberOfFramesLabel.child(numberOfFramesSelect);

  if (printCanvas) {
    createLenticular();
  } else {
    //we are at initialisation step and createLenticular will be called later
  }
}

function createPrintCanvasAndReRenderLenticular() {
  createPrintCanvas();
  createLenticular();
}
