var gulp = require('gulp');
var csv2json = require('gulp-csv2json');
var rename = require('gulp-rename');
var convert = require('gulp-convert');
var exec = require('child_process').exec;


var dir = '20150603';
var predir= './data/';

 
gulp.task('csv2json', function(){
  gulp.src([predir+dir+'/raw/*.csv'])
    .pipe(convert({
      from: 'csv',
      to: 'json'
     }))
    .pipe(gulp.dest(predir+dir+'/json/'));
});


gulp.task('processJson', ['csv2json'], function (cb) {
  exec('node processfiles.js '+ predir +  dir + '/', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});
 
gulp.task('json2csv', ['csv2json', 'processJson'], function(){
  gulp.src([predir+dir+'/processed/*.json'])
    .pipe(convert({
      from: 'json',
      to: 'csv'
     }))
    .pipe(gulp.dest(predir+dir+'/csv/'));
});
 
gulp.task('default', ['csv2json', 'processJson', 'json2csv']);

