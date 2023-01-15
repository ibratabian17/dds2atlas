var os = require('os');
const fs = require('fs'), { exec } = require("child_process"), settings = require("./settings.json");

const path = require('path');

const readFile = (...files) =>
  files.map((path) => {
    try {
      var unparse = fs.readFileSync(path).toString("utf-8").replace("\x00", "");
      try {
        var a = unparse.split('({');
        var b = a[1].split('})')[0]
        unparse = "{".concat(b, "}")
      } catch (err) {

      }
      return JSON.parse(unparse);
    } catch (err) {
      console.log(`Failed to read ${path}\n`);
      console.log(err)
      process.exit(1)
    }
  });

//Read Data Map
const jdnjson = readFile(`./${settings.default.inputDir}/map-input.json`);
const SongData = jdnjson[0];

console.log(`\n`)
console.log("==> Title    : ".concat(SongData.Title))
console.log("==> Artist   : ".concat(SongData.Artist))
console.log("==> Codename : ".concat(SongData.MapName))
console.log("==> Coach    : ".concat(SongData.NumCoach))
console.log(`\n`)

let width = 0;
let height = 0;
let originwidth = 256;
let originheight = 256;


//If the number of coaches is more than 1 then use 370
if(SongData.NumCoach > 1){
  console.log('=> d2a: MultiCoach detected')
  originwidth = 370;
}

var resolution = "".concat(originwidth, "x", originheight)
console.log("=> d2a: Sprite Res: ".concat(resolution))
var Pictos = {
  "imageSize": {
    "width": originwidth,
    "height": originheight
  }
};
var PictoArray = {};
var MissingTexture = [];
var InsidePictos = [];
var PictosPath = [];
let TotalPictos = 0;
let g = 0;
var te = "";

console.log('=> d2a: Indexing Atlas')
SongData["pictos"].forEach(x => {
  const PictoName = `${x.name}`;
  if (PictoArray.hasOwnProperty(PictoName) || !fs.existsSync("./input/pictos/".concat(PictoName.concat(".dds")))) {
    MissingTexture.push(PictoName.concat(g));
    return;
  }
  TotalPictos++;
  PictosPath.push(`./${settings.default.inputDir}/pictos/`.concat(PictoName.concat(".dds")));
  InsidePictos = [width, height];
  PictoArray[PictoName] = InsidePictos;
  width = width + originwidth;
  te = te.concat(` ./${settings.default.inputDir}/pictos/`, PictoName, ".dds");
  if (width % (originwidth * 10) === 0) {
    width = 0
    height = height + originheight;
  }
});
console.log('=> d2a: Indexed '.concat(TotalPictos, ' Files'))
Pictos['images'] = PictoArray;



console.log('=> Im: Generating Atlas Pictures')
var imArg = ` -geometry `.concat(resolution, `!+0+0 -tile 10x -background none ./${settings.default.outputDir}/pictos-atlas.png`);
var imagemagick = "montage ".concat(te, imArg);
if (os.platform() == 'win32') imagemagick = `${settings.default.Win32ImageMagickPath} montage `.concat(te, imArg);
exec(imagemagick, (error, stdout, stderr) => {
  if (error) {
    console.log(`=> Im: Failed To Generate Atlas: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`=> Im: ImageMagick Error:  ${stderr}`);
    return;
  }
  console.log(`=> Im: Done! ${stdout}`);
});

fs.writeFileSync(`./${settings.default.outputDir}/pictos-atlas.json`, JSON.stringify(Pictos, null, 4), function (err) {
  if (err) {
    return console.log(err);
  }
  console.log("The file was saved!");
});
fs.writeFileSync(`./${settings.default.outputDir}/missing-atlas.json`, JSON.stringify(MissingTexture, null, 4), function (err) {
  if (err) {
    return console.log(err);
  }
  console.log("The file was saved!");
}); 