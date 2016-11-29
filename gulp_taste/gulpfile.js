"use strict";

var gulp = require('gulp');
var gp_autoprefixer = require('gulp-autoprefixer');
var gp_changed = require('gulp-changed');
var gp_concat = require('gulp-concat');
var gp_copy = require('gulp-copy');
var gp_cleanCSS = require('gulp-clean-css');
var gp_del = require('del');
var gp_iconfont = require('gulp-iconfont');
var gp_imagemin = require('gulp-imagemin');
var gp_jshint = require('gulp-jshint');
var gp_minifyCSS = require('gulp-minify-css'); // deprecated
var gp_plugins = require('gulp-load-plugins');
var gp_plumber = require('gulp-plumber');
var gp_rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var gp_uglify = require('gulp-uglify');


gulp.task('default', ['combine'], function(){

});

gulp.task('combine', function(){
    return gulp.src('pre_js/*.js')
        .pipe(plumber())
        .pipe(gp_concat('concat.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('compress-images', function() {
    return gulp.src('pre-images/*.png')
        .pipe(imagemin({ progressive: true, optimizationLevel: 10 }))
        .pipe(gulp.dest())

})