var gulp = require('gulp');
var csv2json = require('gulp-csv2json');
var rename = require('gulp-rename');
 
gulp.task('default', function () {
    gulp.src('csv/**/*.csv')
        .pipe(csv2json())
        .pipe(rename({extname: '.json'}))
        .pipe(gulp.dest('json'));
});