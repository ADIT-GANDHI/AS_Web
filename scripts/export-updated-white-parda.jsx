/**
 * Export White_parda_asset_480x1660_updated.ai → public/songs-assets/
 * PNG (transparent) + SVG for web comparison. Does not modify the .ai.
 */
#target illustrator

var root = new Folder('D:/Mihir_Avni/Ajab_New/ajabshar-main');
var src = new File(root.fsName + '/White_parda_asset_480x1660_updated.ai');
var outDir = new Folder(root.fsName + '/public/songs-assets');

if (!src.exists) {
  alert('Missing source AI:\n' + src.fsName);
} else {
  var doc = app.open(src);

  var pngFile = new File(outDir.fsName + '/song_filter_white_480x1660_updated.png');
  var pngOpts = new ExportOptionsPNG24();
  pngOpts.transparency = true;
  pngOpts.artBoardClipping = true;
  pngOpts.antiAliasing = true;
  /* 200% → crisp at 360px drawer (source art ~480 wide). */
  pngOpts.horizontalScale = 200;
  pngOpts.verticalScale = 200;
  doc.exportFile(pngFile, ExportType.PNG24, pngOpts);

  var svgFile = new File(outDir.fsName + '/song_filter_white_480x1660_updated.svg');
  var svgOpts = new ExportOptionsSVG();
  svgOpts.embedRasterImages = true;
  svgOpts.coordinatePrecision = 3;
  svgOpts.fontType = SVGFontType.OUTLINEFONT;
  svgOpts.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
  doc.exportFile(svgFile, ExportType.SVG, svgOpts);

  doc.close(SaveOptions.DONOTSAVECHANGES);
}
