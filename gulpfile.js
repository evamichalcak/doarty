var gulp = require('gulp');
var csv2json = require('gulp-csv2json');
var rename = require('gulp-rename');
var convert = require('gulp-convert');
var exec = require('child_process').exec;
var convertEncoding = require('gulp-convert-encoding');


var dir = '2017\\04-1';
var predir= './data/';

/*
dir = 'ZH\\2017\\03-1';
predir= './data/';
//*/

 
gulp.task('csv2json', function(){
  gulp.src([predir+dir+'/raw/*.csv'])
    .pipe(convert({
      from: 'csv',
      to: 'json'
     }))
    .pipe(gulp.dest(predir+dir+'/json/'));
});


gulp.task('createDir', ['csv2json'], function (cb) {
  var cmdString = "IF exist data\\" + dir + "\\processed ( echo data\\" + dir + "\\processed  exists ) ELSE ( mkdir data\\" + dir + "\\processed  && echo data\\" + dir + "\\processed  created)";
  exec(cmdString, function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    console.log(process.env.MYAPP);
    cb(err);
  });
});

// gulp.task('createDir', function (cb) {
//   exec('mkdir '+ ' data\\'+  dir + '\\processed', function (err, stdout, stderr) {
//     console.log(stdout);
//     console.log(stderr);
//     cb(err);
//   });
// });

gulp.task('processJson', ['csv2json', 'createDir'], function (cb) {
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


gulp.task('encode', ['csv2json', 'processJson', 'json2csv'], function () {
    return gulp.src([predir+dir+'/csv/*.csv'])
        .pipe(convertEncoding({to: 'utf8'}))
        .pipe(gulp.src([predir+dir+'/csv/*.csv']));
});


 
gulp.task('default', ['csv2json', 'processJson', 'json2csv', 'encode']);

