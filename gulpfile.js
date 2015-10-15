'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');

var notify = require('gulp-notify');

var argv = require('yargs').argv;

// sass
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer-core');
var postcss = require('gulp-postcss');
var sourcemaps = require('gulp-sourcemaps');

// BrowserSync
var browserSync = require('browser-sync');
var htmlInjector = require("bs-html-injector");

// js
var watchify = require('watchify');
var browserify = require('browserify');

// image optimization
var imagemin = require('gulp-imagemin');

// gulp build --production
var production = !!argv.production;
// determine if we're doing a build
// and if so, bypass the livereload
var build = argv._.length ? argv._[0] === 'build' : false;
var watch = argv._.length ? argv._[0] === 'watch' : true;


// Error notification

var handleError = function (task) {
    return function (err) {

        notify.onError({
            message: task + ' failed, check the logs..',
            sound: false
        })(err);

        gutil.log(gutil.colors.bgRed(task + ' error:'), gutil.colors.red(err));
    };
};

var tasks = {
    // --------------------------
    // Delete build folder
    // --------------------------
    clean: function (cb) {
        del(['build/'], cb);
    },
    // --------------------------
    // Copy static assets
    // --------------------------
    assets: function () {
        return gulp.src('./client/assets/**/*')
            .pipe(gulp.dest('build/assets/'));
    },
    // --------------------------
    // SASS (libsass)
    // --------------------------
    sass: function () {
        return gulp.src('./scss/**/*.scss')
            // sourcemaps + sass + error handling
            .pipe(gulpif(!production, sourcemaps.init()))
            .pipe(sass({
                sourceComments: !production,
                outputStyle: production ? 'compressed' : 'nested'
            }))
            .on('error', handleError('SASS'))
            // generate .maps
            .pipe(gulpif(!production, sourcemaps.write({
                'includeContent': false,
                'sourceRoot': '.'
            })))
            // autoprefixer
            .pipe(gulpif(!production, sourcemaps.init({
                'loadMaps': true
            })))
            .pipe(postcss([autoprefixer({browsers: ['last 2 versions']})]))
            // we don't serve the source files
            // so include scss content inside the sourcemaps
            .pipe(sourcemaps.write({
                'includeContent': true
            }))
            // write sourcemaps to a specific directory
            // give it a file and save
            .pipe(gulp.dest('./css'))
            .pipe(browserSync.stream());
    }
};

gulp.task('browser-sync', function () {

    browserSync.use(htmlInjector, {
        files: "./*.html"
    });

    browserSync({
        port: process.env.PORT || 3000,
        proxy: "awesome.dev"
    });
});

gulp.task('reload-sass', ['sass'], function () {
    browserSync.reload();
    gutil.log(gutil.colors.bgGreen('Reloading SASS...'));
});

gulp.task('reload-js', function(){
    browserSync.reload();
    gutil.log(gutil.colors.bgGreen('Reloading JS...'));
});

gulp.task('sass', tasks.sass);

// --------------------------
// DEV/WATCH TASK
// --------------------------
gulp.task('watch', ['sass', 'browser-sync'], function () {

    // --------------------------
    // watch:sass
    // --------------------------
    gulp.watch('./scss/**/*.scss', ['reload-sass']);

    // --------------------------
    // watch:js
    // --------------------------
    gulp.watch('./js/**/*.js', ['reload-js']);

    gulp.watch('./*.html', htmlInjector);


    gutil.log(gutil.colors.bgGreen('Watching for changes...'));
});

gulp.task('default', ['watch']);
