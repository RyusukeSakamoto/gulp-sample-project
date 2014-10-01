var gulp = require('gulp'),
    $    = require('gulp-load-plugins')(),
    streamqueue = require('streamqueue'),
    runSequence = require('run-sequence'),
    nib  = require('nib');

var dev = !$.util.env.release,
    csscheck = $.util.env.csscheck;

var errorHandler = {errorHandler: $.notify.onError('<%= error.message %>')};


gulp.task('watch', ['default'], function() {
    gulp.watch('src/**/*.html', ['html']);
    gulp.watch('src/css/**/*.{css,styl,stylus}', ['css']);
    gulp.watch('src/js/**/*.js', ['js']);
});


gulp.task('default', function(callback) {
    runSequence(['html', 'css', 'js'], callback);
});


gulp.task('html', function() {
    return gulp.src('src/**/*.html')
            .pipe($.cached('html'))
            .pipe($.plumber(errorHandler))
            .pipe($.htmlhint({
                'doctype-first': false
            }))
            .pipe($.htmlhint.reporter())
            .pipe($.minifyHtml({
                empty: true,
                spare: true,
                quotes: true
            }))
            .pipe(gulp.dest('www/'));
});


gulp.task('css', function() {
    return streamqueue(
            {objectMode: true},
            gulp.src(['src/css/**/*.{css,styl,stylus}'])
                .pipe($.plumber(errorHandler))
                .pipe($.stylus({use: [nib()]}))
                .pipe($.autoprefixer('> 1%, last 2 versions, Android, iOS, Chrome'))
                .pipe($.cached('csslint'))
                .pipe($.csslint({
                    gradients: false,
                    'box-sizing': false,
                    'adjoining-classes': false,
                    'compatible-vendor-prefixes': false
                }))
                .pipe($.csslint.reporter())
                .pipe($.remember('csslint'))
                .pipe($.if(csscheck, gulp.dest('csscheck/')))
        )
            .pipe($.concat('build.css'))
            .pipe($.minifyCss())
            .pipe(gulp.dest('www/css/'));
});


gulp.task('js', function() {
    return gulp.src('src/js/**/*.js')
            .pipe($.plumber(errorHandler))
            .pipe($.cached('jshint'))
            .pipe($.jshint())
            .pipe($.jshint.reporter('jshint-stylish'))
            .pipe($.ngAnnotate())
            .pipe($.tap(function(file) {
                file.contents = Buffer.concat([
                    new Buffer("(function(){\n"),
                    new Buffer("'use strict';\n"),
                    file.contents,
                    new Buffer("})();")
                ]);
            }))
            .pipe($.remember('jshint'))
            .pipe($.if(dev, $.sourcemaps.init()))
            .pipe($.concat('build.js'))
            .pipe($.uglify())
            .pipe($.if(dev, $.sourcemaps.write()))
            .pipe(gulp.dest('www/js/'));
});