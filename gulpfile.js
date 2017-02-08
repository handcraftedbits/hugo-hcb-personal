var cleanCss = require("gulp-clean-css");
var concat = require("gulp-concat");
var favicons = require("gulp-favicons");
var gulp = require("gulp");
var less = require("gulp-less");
var minify = require("gulp-minify");
var nodePath = require("path");
var rev = require("gulp-rev");
var rimraf = require("rimraf");
var svgSprite = require("gulp-svg-sprite");

var resourcesDir = outputDir("src-static");
var dataDir = outputDir("data");
var bowerDir = outputDir("bower_components");
var buildDir = outputDir("static");

var config = {
     color: {
          backgroundAppleIcon: "#FFFFFF",
          backgroundTile: "#325082"
     },

     dir: {
          output: {
               favicon: outputDir(buildDir("image/favicon")),
               image: outputDir(buildDir("image")),
               script: outputDir(buildDir("script")),
               style: outputDir(buildDir("style"))
          },

          resources: {
               favicon: outputDir(resourcesDir("image/favicon")),
               font: outputDir(resourcesDir("font")),
               image: outputDir(resourcesDir("image")),
               style: outputDir(resourcesDir("style"))
          }
     }
}

function outputDir(dir) {
     return function(path) {
          return nodePath.normalize(dir + (path ? "/" + path : ""));
     };
}

gulp.task("clean", function(done) {
     rimraf.sync(buildDir());
     rimraf.sync(dataDir());

     done();
});

gulp.task("less-to-css", function() {
     return gulp.src(config.dir.resources.style("*.less"))
          .pipe(less())
          .pipe(gulp.dest(config.dir.output.style()))
          .on("end", function() {
               rimraf.sync(config.dir.output.style("common.css"));
          });
});

gulp.task("concat-css", gulp.series("less-to-css", function() {
     var dependencies = [
          bowerDir("pure/base.css"),
          bowerDir("pure/grids-responsive.css"),
          bowerDir("pure/tables.css"),
          config.dir.resources.style("pygments.css"),
          config.dir.output.style("style.css")
     ];

     return gulp.src(dependencies)
          .pipe(concat("style.css"))
          .pipe(gulp.dest(config.dir.output.style()));
}));

gulp.task("copy-fonts", function() {
     return gulp.src(config.dir.resources.font("*"))
          .pipe(gulp.dest(buildDir("font")));
});

gulp.task("concat-js", function() {
     var dependencies = [
          bowerDir("svg4everybody/dist/svg4everybody.js")
     ];

     return gulp.src(dependencies)
          .pipe(concat("all.js"))
          .pipe(gulp.dest(buildDir("script")));
});

gulp.task("create-favicons-apple", function() {
     return gulp.src(config.dir.resources.favicon("icon-apple.svg"))
          .pipe(favicons({
               icons: {
                    android: false,
                    appleIcon: true,
                    appleStartup: false,
                    coast: false,
                    favicons: false,
                    firefox: false,
                    windows: false,
                    yandex: false
               },
               background: config.color.backgroundAppleIcon,
               online: false,
          }))
          .pipe(gulp.dest(config.dir.output.favicon()))
          .on("end", function() {
               rimraf.sync(config.dir.output.favicon("apple-touch-icon.png"));
               rimraf.sync(config.dir.output.favicon("apple-touch-icon-precomposed.png"));
          });
});

gulp.task("create-favicons-normal", function() {
     return gulp.src(config.dir.resources.image("logo.svg"))
          .pipe(favicons({
               icons: {
                    android: false,
                    appleIcon: false,
                    appleStartup: false,
                    coast: false,
                    favicons: true,
                    firefox: false,
                    windows: false,
                    yandex: false
               },
               online: false,
          }))
          .pipe(gulp.dest(config.dir.output.favicon()))
          .on("end", function() {
               // Clean up deprecated files.

               rimraf.sync(config.dir.output.favicon("favicon.ico"));
          });
});

gulp.task("create-favicons-tile-medium-wide-large", function() {
     return gulp.src(config.dir.resources.favicon("tile-medium-wide-large.svg"))
          .pipe(favicons({
               icons: {
                    android: false,
                    appleIcon: false,
                    appleStartup: false,
                    coast: false,
                    favicons: false,
                    firefox: false,
                    windows: true,
                    yandex: false
               },
               background: config.color.backgroundTile,
               online: false,
               path: "/image/favicon"
          }))
          .pipe(gulp.dest(config.dir.output.favicon()));
});

gulp.task("create-favicons-tile-small", function() {
     return gulp.src(config.dir.resources.favicon("tile-small.svg"))
          .pipe(favicons({
               icons: {
                    android: false,
                    appleIcon: false,
                    appleStartup: false,
                    coast: false,
                    favicons: false,
                    firefox: false,
                    windows: true,
                    yandex: false
               },
               background: config.color.backgroundTile,
               online: false,
               path: "/image/favicon"
          }))
          .pipe(gulp.dest(config.dir.output.image("tile-small")));
});

gulp.task("create-favicons-tile", gulp.parallel("create-favicons-tile-medium-wide-large", gulp.series
     ("create-favicons-tile-small", function() {
          return gulp.src(config.dir.output.image("tile-small/mstile-70x70.png"))
               .pipe(gulp.dest(config.dir.output.favicon()))
               .on("end", function() {
                    rimraf.sync(config.dir.output.image("tile-small"));
               });
})));

gulp.task("create-favicons", gulp.parallel("create-favicons-normal", "create-favicons-apple", "create-favicons-tile"));

gulp.task("create-svg-sprite", function() {
     return gulp.src(config.dir.resources.image("*.svg"))
          .pipe(svgSprite({
               mode: {
                    symbol: {
                         dest: "",
                         sprite: "sprites.svg"
                    }
               }
          }))
          .pipe(gulp.dest(config.dir.output.image()));
});

gulp.task("minify-css", gulp.series("concat-css", function() {
     return gulp.src(config.dir.output.style("style.css"))
          .pipe(cleanCss({
               level: {
                    1: {
                         specialComments: "none"
                    },
                    2: { }
               }
          }))
          .pipe(rev())
          .pipe(gulp.dest(config.dir.output.style()))
          .pipe(rev.manifest("rev_manifest_css.json"))
          .pipe(gulp.dest(dataDir()))
          .on("end", function() {
               rimraf.sync(config.dir.output.style("style.css"));
          });
}));

gulp.task("minify-js", gulp.series("concat-js", function() {
     return gulp.src(config.dir.output.script("all.js"))
          .pipe(minify({ noSource: true }))
          .pipe(rev())
          .pipe(gulp.dest(config.dir.output.script()))
          .pipe(rev.manifest("rev_manifest_js.json"))
          .pipe(gulp.dest(dataDir()))
          .on("end", function() {
               rimraf.sync(config.dir.output.script("all.js"));
          });
}));

gulp.task("default", gulp.series("clean", gulp.parallel("copy-fonts", "create-svg-sprite", "minify-css", "minify-js",
     "create-favicons")));

gulp.task("dev", gulp.series("default", function() {
     gulp.watch([ bowerDir("**/*.css"), config.dir.resources.style("*.css"), config.dir.resources.style("*.less") ],
          gulp.series("minify-css"));
     gulp.watch(config.dir.resources.font("*"), gulp.series("copy-fonts"));
     gulp.watch(bowerDir("**/*.js"), gulp.series("minify-js"));
     gulp.watch(config.dir.resources.image("*.svg"), gulp.series("create-svg-sprite"));
}));

