"use strict";

var gulp = require('gulp');
var gp_autoprefixer = require('gulp-autoprefixer');
var gp_concat = require('gulp-concat');
var gp_copy = require('gulp-copy');
var gp_cleanCSS = require('gulp-clean-css');
var gp_del = require('del');
var gp_minifyCSS = require('gulp-minify-css'); // deprecated
var gp_rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var gp_uglify = require('gulp-uglify');


gulp.task('default', ['combine'], function(){

});

gulp.task('combine', function(){
    return gulp.src('pre_js/*.js')
        .pipe(gp_concat('concat.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('dist'));
});