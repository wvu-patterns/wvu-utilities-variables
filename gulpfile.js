'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    prefix = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    del = require("del"),
    runSequence = require('run-sequence'),
    scsslint = require('gulp-scss-lint'),
    handlebars = require('gulp-compile-handlebars'),
    extend = require('gulp-extend'),
    browserSync = require('browser-sync');


gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: "./build/",
    },
    open: false,
    logConnections: true,
    logSnippet: false
  });
});

gulp.task('clean', function(cb){
  return del([
    'build/**'
  ], cb);
});

gulp.task('move-dependecies', function() {

});

gulp.task('scss-lint', function() {
  return gulp.src('./src/scss/*.scss')
    .pipe(scsslint({
      'config': '.scss-lint.yml'
    }))
    .pipe(scsslint.failReporter());
});

gulp.task('compile-scss', function(){
  return gulp.src([
      './bower_components/wvu-patterns-masthead-logo/src/scss/*.scss',
      './bower_components/wvu-patterns-masthead-links/src/scss/*.scss',
      './src/scss/*.scss'
    ])
    .pipe(rename(function (path) {
      path.basename = path.basename.substring(1)
    }))
    .pipe(sass({
      includePaths: ['scss'],
      outputStyle: 'expanded'
    }))
    .pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7", { cascade: true }))
    .pipe(gulp.dest('./build/css/'));
});

gulp.task('build-json',function(){
  return gulp.src([
    './src/handlebars/data/*.json',
    './bower_components/wvu-patterns-masthead-**/src/handlebars/data/*.json'
    ])
  .pipe(extend('_wvu-masthead.json',true,2))
  .pipe(gulp.dest("./build/data"));
})

gulp.task('compile', ['build-json','scss-lint','compile-scss'], function () {

  var templateData = require('./build/data/_wvu-masthead.json');

  var options = {
    batch : [
      './bower_components/wvu-patterns-masthead-logo/src/handlebars/partials',
      './bower_components/wvu-patterns-masthead-links/src/handlebars/partials',
      './src/handlebars/partials'
    ]
  }
  return gulp.src('./test/index.hbs')
        .pipe(handlebars(templateData, options))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('./build'));
});

gulp.task('build',function(cb){
  runSequence('clean','move-dependecies','compile',cb);
});

gulp.task('test',['build','browser-sync']);
gulp.task('ci',['scss-lint']);
