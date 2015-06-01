var gulp = require('gulp');
var csv2json = require('gulp-csv2json');
var rename = require('gulp-rename');
var convert = require('gulp-convert');
var exec = require('child_process').exec;


var dir = 'test';

 
gulp.task('csv2json', function(){
  gulp.src(['raw/'+dir+'/*.csv'])
    .pipe(convert({
      from: 'csv',
      to: 'json'
     }))
    .pipe(gulp.dest('json/test3'));
});


gulp.task('processJson', ['csv2json'], function (cb) {
  exec('node processfiles.js '+ dir, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});
 
gulp.task('json2csv', ['csv2json', 'processJson'], function(){
  gulp.src(['json/'+dir+'/*.json'])
    .pipe(convert({
      from: 'json',
      to: 'csv'
     }))
    .pipe(gulp.dest('test/' + dir));
});
 
gulp.task('default', ['csv2json', 'processJson', 'json2csv']);

