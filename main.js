var PSD = require('psd');
// var psd = PSD.fromFile("./1.psd");
// psd.parse();

// console.log(psd.tree().export());
// console.log(psd.tree().childrenAtPath('A/B/C')[0].export());

// You can also use promises syntax for opening and parsing
PSD.open("./1.psd").then(function (psd) {
  // 输出每个图层
  const tree = psd.tree().descendants()
  tree.forEach(element => {
    console.log(element)
    element.layer.image.saveAsPng(`./output/${element.name}.png`)
  })
  // console.log(psd.tree().descendants()[0].layer.image.saveAsPng('./output.png'))
  // return psd.image.saveAsPng('./output.png');
}).then(function () {
  console.log("Finished!");
});