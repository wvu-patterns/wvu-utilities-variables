'use strict';

var gulp = require('gulp'),
    fs = require('fs'),
    sass = require('gulp-sass'),
    scsslint = require('gulp-scss-lint'),
    sourcemaps = require('gulp-sourcemaps'),
    prefix = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    handlebars = require('gulp-compile-handlebars'),
    a11y = require('gulp-a11y'),
    cheerio = require('gulp-cheerio'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;


gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: "./build",
    },
    open: false,
    logConnections: true,
    logSnippet: false
  });
});

gulp.task('build-test-styles', function(){
  var templateData = JSON.parse(fs.readFileSync('./data/_wvu-variables.json'));

  var options = {};

  return gulp.src('./test/partials/_styles.scss.hbs')
    .pipe(handlebars(templateData, options))
    .pipe(rename('_generated-styles.scss'))
    .pipe(gulp.dest('./test/scss'));
});

gulp.task('compile-scss', ['scss-lint'], function(){
  return gulp.src([
      './test/scss/_generated-styles.scss',
      './test/scss/styles.scss'
    ])
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: ['scss'],
      outputStyle: 'expanded'
    }))
    .pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7", { cascade: true }))
    .pipe(sourcemaps.write('maps', {
      includeContent: false,
      sourceRoot: './build/css/'
    }))
    .pipe(gulp.dest('./build/css/'));
});

gulp.task('build', ['compile-scss'], function () {

  var templateData = JSON.parse(fs.readFileSync('./data/_wvu-variables.json'));
  templateData.wvu_variables.colors_dup = templateData.wvu_variables.colors;

  //console.log(templateData);

  var options = {};

  return gulp.src('./test/index.hbs')
        .pipe(handlebars(templateData, options))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('./build'));
});

gulp.task('scss-lint', ['build-test-styles'], function(){
  return gulp.src('./src/scss/*.scss')
    .pipe(scsslint({
      'config': '.scss-lint.yml'
    }))
    .pipe(scsslint.failReporter());
});

gulp.task('audit', function() {
  return gulp.src('./build/**/*.html')
    .pipe(a11y({
      verbose: true,
      export: './build/report.json'
    }));
});

gulp.task('non-accessible-colors', ['audit'], function(){

  var reportData = JSON.parse(fs.readFileSync('./build/report.json'));

  var elements_string = reportData['audit'].filter(function(item){
    return item['code'] == 'AX_COLOR_01'
  });

  var elements_array = elements_string[0]['elements'].split('\n');
  elements_array.shift();


  return gulp.src(['./build/**/*.html'])
    .pipe(cheerio(function ($, file) {
    // Each file will be run through cheerio and each corresponding `$` will be passed here.
    // `file` is the gulp file object
      $(elements_array).each(function () {
        var el = $(this);
        el.addClass('accessibility-failure');
      });
    }))
    .pipe(gulp.dest('./build/'));

});

gulp.task('ci',['build']);

gulp.task('default',['build','browser-sync'], function(){
  gulp.watch(["./src/*.scss","./test/scss/*.scss"],["build"]);
  gulp.watch(["./test/**/*.hbs","./data/*.json"],["build"]);
  gulp.watch("./build/**/*.html").on('change',reload);
  gulp.watch("./build/css/*.css").on('change',reload);
});
