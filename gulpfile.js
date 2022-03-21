const {
    Concat
} = require("nunjucks/src/nodes");

var gulp = require("gulp"),
    mergeStream = require('merge-stream'),
    minimist = require('minimist'),
    count = require('gulp-count'),
    gulpCopy = require('gulp-copy'),
    replace = require('gulp-string-replace'),
    rename = require("gulp-rename"),
    autoPrefixer = require("gulp-autoprefixer"),
    argv = require('minimist')(process.argv.slice(2)),
    browserSync = require("browser-sync").create(),
    reload = browserSync.reload,
    sass = require("gulp-sass"),
    sourcemaps = require('gulp-sourcemaps'),
    cleanCSS = require("gulp-clean-css"),
    csso = require('gulp-csso'),
    del = require("del");
gulpif = require('gulp-if'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    imagemin = require('gulp-imagemin'),
    changed = require('gulp-changed'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    beautify = require('gulp-beautify-code'),
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    purgecss = require('gulp-purgecss'),
    nunjucks = require('gulp-nunjucks'),
    rendeNun = require('gulp-nunjucks-render'),
    data = require('gulp-data'),
    lineec = require('gulp-line-ending-corrector'),
    purgecss = require('gulp-purgecss'),
    filter = require('gulp-filter');


var argv = process.argv.slice(1);
console.log(argv);
const pageName = argv[2];
console.log(pageName);
var inputPageLayoutThemeStr = argv[4].replace(/'/g, '"');
console.log(inputPageLayoutThemeStr);
const inputPageLayoutTheme = JSON.parse(inputPageLayoutThemeStr);
console.log(inputPageLayoutTheme);
console.log(inputPageLayoutTheme.sectionDetails.length);


const destination = (argv.clean) ? 'dist/demo/' : (argv.pub) ? 'dist/publish/' : 'dist/';
const port = (argv.demo) ? 4002 : (argv.pub) ? 4003 : 4001;

var sourcemap = (argv.demo) ? false : (argv.pub) ? true : true;
var minImg = (argv.demo) ? false : (argv.pub) ? true : false;

const path = {
    root: './',
    temp: './app/temp/',
    html: './app/generated/*.+(html|njk)',
    mainPage: '/app/page-template',
    _partialFiles: './app/partials/**/*.+(htm|njk)',
    _partial: './app/partials/',
    fonts: './app/assets/fonts/**/*.*',
    js: './app/assets/js/*.*',
    scss: './app/assets/scss/**/*.scss',
    img: './app/assets/images/**/*.+(png|jpg|gif|ico|svg|webp)',
    data: './app/data/data.json',
    plugins: './app/plugins/**/*.*',
    pluginCss: './app/plugins/**/*.css',
    bootstrap: {
        css: './app/plugins/bootstrap/css/bootstrap.min.css',
        js: './app/plugins/bootstrap/js/bootstrap.bundle.min.js'
    },
    pluginJs: './app/plugins/**/*.js',

    plugin: {
        js: './app/plugin/js/*.js',
        css: './app/plugin/css/*.css'
    }
};


const dest = {
    css: destination + 'css/',
    theme: destination + 'css/theme/',
    scss: destination + 'scss/',
    js: destination + 'js/',
    fonts: destination + 'fonts/',
    img: destination + 'css/image/',
    plugins: destination + 'plugins/',
    temp: destination + 'temp/',
    mainPageDist: destination + 'page/',
    bundle: {
        css: 'bundled/css/',
        js: 'bundled/js/'
    }
}

// fonts
function fonts() {
    return gulp.src([path.fonts])
        .pipe(changed(dest.fonts))
        .pipe(gulp.dest(dest.fonts));
}

// js
function javascript() {
    return gulp.src([path.js])
        .pipe(changed(dest.js))
        .pipe(beautify())
        .pipe(lineec())
        .pipe(gulp.dest(dest.js));
}

// sassCopy
function sassCopy() {
    return gulp.src([path.scss])
        .pipe(gulpif(argv.pub, gulp.dest(dest.scss)))
};

// plugins
function plugins() {
    return gulp.src([path.plugins])
        .pipe(changed(dest.plugins))
        .pipe(gulp.dest(dest.plugins));
}

// imgmin
function imgmin() {
    return gulp.src([path.img])
        .pipe(changed(dest.img))
        .pipe(gulpif(minImg, imagemin([
            imagemin.gifsicle({
                interlaced: true
            }),
            imagemin.jpegtran({
                progressive: true
            }),
            imagemin.optipng({
                optimizationLevel: 5
            })
        ])))
        .pipe(gulp.dest(dest.img))
        .pipe(browserSync.reload({
            stream: true
        }));
}

// clean
function clean() {
    return del([destination, "./app/generated/", "./app/assets/scss/themed/"]);
}

//generateScssSectionTemplates
function generateScssSectionTemplatesWithPush() {
    var tasks = [];
    for (let i = 0; i < inputPageLayoutTheme.sectionDetails.length; i++) {
        tasks.push(
            gulp.src("./app/assets/scss/style-scss-template")
            .pipe(rename(inputPageLayoutTheme.sectionDetails[i].sectionName + "-style.scss"))
            .pipe(gulp.dest("./app/assets/scss/themed/"))
            // .pipe(gulpCopy("./app/assets/scss/themed/"))
        );
        console.log(tasks.length);

    }
    return mergeStream(tasks);
}

// replacePlaceHolders
function replacePlaceHoldersStylesWithPush() {
    var tasks = [];
    for (let i = 0; i < inputPageLayoutTheme.sectionDetails.length; i++) {
        tasks.push(
            gulp.src("./app/assets/scss/themed/" + inputPageLayoutTheme.sectionDetails[i].sectionName + "-style.scss")
            .pipe(replace(new RegExp('@@sectionName@@', 'g'), inputPageLayoutTheme.sectionDetails[i].sectionName))
            .pipe(gulp.dest("./app/assets/scss/themed"))
        );

    }
    return mergeStream(tasks);
}

// compileScssTheme
function compileScssThemeWithPush() {
    var tasks = [];
    for (let i = 0; i < inputPageLayoutTheme.sectionDetails.length; i++) {
        tasks.push(
            gulp.src('./app/assets/scss/theme/' + inputPageLayoutTheme.sectionDetails[i].sectionName + '/' + inputPageLayoutTheme.theme + '.scss')
            .pipe(sourcemaps.init())
            .pipe(sass({
                outputStyle: 'expanded',
            }))
            .on('error', sass.logError)
            .pipe(sourcemaps.write())
            .pipe(rename(inputPageLayoutTheme.sectionDetails[i].sectionName + '.css'))
            // .pipe(concat('style.css'))
            .pipe(gulp.dest(dest.theme))
        );

    }
    return mergeStream(tasks);
}

function combineCssInDestFolder() {
    return gulp.src('./dist/css/theme/*.css')
        .pipe(concat('style.css'))
        .pipe(gulp.dest(dest.css));
}

//generateNunjucksSectionTemplates
function generateNunjucksSectionTemplates() {
    return gulp
        .src("./app/page-template.njk.temp")
        .pipe(rename(pageName + ".njk"))
        .pipe(gulp.dest("./app/generated/"));
}

// replacePlaceHoldersHtml
function replacePlaceHoldersHtml() {
    var nunjucksIncludeString = buildNunjucksImportStr(inputPageLayoutTheme);
    return gulp.src('./app/generated/*.njk')
        .pipe(replace(new RegExp('@@sectionContent@@', 'g'), nunjucksIncludeString))
        .pipe(gulp.dest('./app/generated'));
}

function buildNunjucksImportStr(inputPageLayoutTheme) {
    let pageNameNunString = "";
    for (let i = 0; i < inputPageLayoutTheme.sectionDetails.length; i++) {
        pageNameNunString += '{% include "_' + inputPageLayoutTheme.sectionDetails[i].sectionName + inputPageLayoutTheme.sectionDetails[i].sectionChoiceNumber + '.njk"%}' + "\n";
    }
    return pageNameNunString;
}

// html
function html() {
    return gulp.src([path.html])
        .pipe(rendeNun({
            path: [path._partial] // String or Array
        }))
        .pipe(customPlumber('Error Running Nunjucks'))
        .pipe(beautify({
            indent_size: 2,
            indent_char: ' ',
            max_preserve_newlines: 0,
            unformatted: ['code', 'pre', 'em', 'strong', 'span', 'i', 'b', 'br']
        }))
        .pipe(gulp.dest(destination))
        .pipe(browserSync.reload({
            stream: true
        }));

};

function customPlumber([errTitle]) {
    return plumber({
        errorHandler: notify.onError({
            title: errTitle || "Error running Gulp",
            message: "Error: <%= error.message %>",
            sound: "Glass"
        })
    });
}

const copyAssets = gulp.parallel(fonts, javascript, sassCopy, plugins, imgmin);
const generateStyles = gulp.series(generateScssSectionTemplatesWithPush, replacePlaceHoldersStylesWithPush, compileScssThemeWithPush, combineCssInDestFolder);
const generateHtml = gulp.series(generateNunjucksSectionTemplates, replacePlaceHoldersHtml, html);
const build = gulp.series(clean, gulp.parallel(generateStyles, generateHtml), copyAssets);

exports.default = build;