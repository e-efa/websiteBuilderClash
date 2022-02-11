var gulp = require("gulp"),
    autoPrefixer = require("gulp-autoprefixer"),
    argv = require('minimist')(process.argv.slice(2)),
    browserSync = require("browser-sync").create(),
    reload = browserSync.reload,
    sass = require("gulp-sass"),
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
    nunjucks = require( 'gulp-nunjucks' ) ,
    rendeNun = require('gulp-nunjucks-render'),
    data = require('gulp-data'),
    lineec = require('gulp-line-ending-corrector'),
    purgecss = require('gulp-purgecss'),
    filter = require('gulp-filter');


const destination = (argv.clean) ? 'dist/demo/' : (argv.pub) ? 'dist/publish/' : 'dist/';
const port = (argv.demo) ? 4002 : (argv.pub) ? 4003 : 4001;

var sourcemap = (argv.demo) ? false : (argv.pub) ? true : true;
var minImg = (argv.demo) ? false : (argv.pub) ? true : false;
// All Path
const path = {
    root:'./',
    temp:'./app/temp/',
    html: './app/*.+(html|njk)',
    _partialFiles: './app/partials/**/*.+(htm|njk)',
    _partial: './app/partials/',
    fonts: './app/assets/fonts/**/*.*',
    js: './app/assets/js/*.*',
    scss: './app/assets/scss/**/*.scss',
    img: './app/assets/images/**/*.+(png|jpg|gif|ico|svg|webp)',
    data:'./app/data/data.json',
    plugins: './app/plugins/**/*.*',
    pluginCss: './app/plugins/**/*.css',
    bootstrap: {
        css:'./app/plugins/bootstrap/css/bootstrap.min.css',
        js:'./app/plugins/bootstrap/js/bootstrap.bundle.min.js'
    },
    pluginJs: './app/plugins/**/*.js',

    plugin :{
        js: './app/plugin/js/*.js',
        css: './app/plugin/css/*.css'
    }
};


const dest = {
    css : destination + 'css/',
    scss : destination + 'scss/',
    js : destination + 'js/',
    fonts : destination + 'fonts/',
    img : destination + 'image/',
    plugins : destination + 'plugins/',
    temp : destination + 'temp/',
    bundle: {
        css:'bundled/css/',
        js: 'bundled/js/'
    }
}

const watchSrc = [path.html, path.js, path.php, path.img, path.fonts, path.plugin.css,path.plugin.css,path.plugin];



/* =====================================================
   BrowserSync
===================================================== */
function browserReload(done) {
    browserSync.init({
      server: {
        baseDir: destination + '/'
      },
      port: port
    });
    done();
  }
  



/* =====================================================
    CLEAN
===================================================== */
function clean() {
    return del([destination]);
}


/*--------------------------------------
    Gulp Custom Notifier
----------------------------------------*/
function customPlumber([errTitle]) {
    return plumber({
        errorHandler: notify.onError({
            title: errTitle || "Error running Gulp",
            message: "Error: <%= error.message %>",
            sound: "Glass"
        })
    });
}


/* =====================================================
    HTML
===================================================== */
    function html () {
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

/* =====================================================
    css
===================================================== */
    function scss() {
        return gulp.src([path.scss])
            .pipe(gulpif(sourcemap, sourcemaps.init()))
            .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
            .pipe(autoPrefixer())
            .pipe(gulpif(argv.demo, csso({
                restructure: false,
                sourceMap: true,
                debug: true
            })))
            .pipe(gulpif(sourcemap, sourcemaps.write('./maps/')))
            .pipe(lineec())
            .pipe(gulp.dest(dest.css))
            .pipe(browserSync.reload({
                stream: true
            }));
    };


/* =====================================================
    Bundeling JS & CSS
===================================================== */
function cleanTemp() {
    return del([path.temp]);
}

function concatPluginCss() {
    return gulp.src([path.pluginCss, "!./app/plugins/bootstrap/css/bootstrap.min.css"])
        .pipe(concat('plugins.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(path.temp))
}
function concatCssFinal() {
    return gulp.src([path.bootstrap.css, path.temp + "plugins.css"],{ allowEmpty: true })
            .pipe(concat('plugins.min.css'))
            .pipe(lineec())
            .pipe(gulp.dest(dest.bundle.css))
}

function concatPluginJs() {
    
    return gulp.src([path.pluginJs, "!./app/plugins/bootstrap/js/bootstrap.bundle.min.js",'!app/plugins/jquery/jquery.min.js',"!app/plugins/jquery/jquery-migrate.min.js"])
        .pipe(concat('plugins.min.js' ))
        .pipe(uglify())
        .pipe(gulp.dest(path.temp))
}
function concatJsFinal() {
    return gulp.src([
        "./app/plugins/jquery/jquery.min.js",
        "./app/plugins/jquery/jquery-migrate.min.js",
        path.bootstrap.js, 
        path.temp + "plugins.min.js",
    ],{ allowEmpty: true })
            .pipe(concat('plugins.min.js'))
            .pipe(uglify())
            .pipe(lineec())
            .pipe(gulp.dest(dest.bundle.js))
}

const pluginCss = gulp.series(concatPluginCss,concatCssFinal);
const pluginJs = gulp.series(concatPluginJs,concatJsFinal);
const pluginminify = gulp.series(gulp.parallel(pluginCss,pluginJs), cleanTemp);

/* =====================================================
    Copy SCSS Folder
===================================================== */
function sassCopy() {
    return gulp.src([path.scss])
        .pipe(gulpif(argv.pub, gulp.dest(dest.scss)))
};

/* =====================================================
    Image
===================================================== */
function imgmin(){
    return gulp.src([path.img])
        .pipe(changed(dest.img))
        .pipe(gulpif(minImg, imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.jpegtran({ progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 })
        ])))
        .pipe(gulp.dest(dest.img))
        .pipe(browserSync.reload({
            stream: true
        }));
}
/* =====================================================
    Javascript
===================================================== */
function javascript() {
    return gulp.src([path.js])
        .pipe(changed(dest.js))
        .pipe(beautify())
        .pipe(lineec())
        .pipe(gulp.dest(dest.js));
}

/* =====================================================
    fonts
===================================================== */
function fonts() {
    return gulp.src([path.fonts])
    .pipe(changed(dest.fonts))
        .pipe(gulp.dest(dest.fonts));
}


/* =====================================================
    Plugin Folder Copy
===================================================== */
function plugins() {
    return gulp.src([path.plugins])
    .pipe(changed(dest.plugins))
        .pipe(gulp.dest(dest.plugins));
}



/* =====================================================
    Purge Css
===================================================== */
gulp.task('distroy', () => {
    return gulp.src('dist/css/**/*.css')
        .pipe(purgecss({
            content: ['dist/**/*.html']
        }))
        .pipe(gulp.dest('dist/css/purged'))
})

function sassCopy() {
    return gulp.src([path.scss])
        .pipe(gulpif(argv.pub, gulp.dest(dest.scss)))
};



function watchFiles() {
    gulp.watch(path.html, html);
    gulp.watch(path._partial, html);
    gulp.watch([path.plugin.js,path.js,path.fonts,path.img], copyAssets);
    gulp.watch(path.scss, scss);
    gulp.watch(path.root, gulp.series(clean,build));
  }



const copyAssets = gulp.parallel(fonts, javascript, sassCopy, plugins,imgmin);
const build = gulp.series(clean, html, gulp.parallel(scss, copyAssets));
const buildWatch = gulp.series(build,browserReload, gulp.parallel(watchFiles));




exports.html = html;
exports. browserReload =  browserReload;
exports.pluginJs = pluginJs;
exports.pluginCss = pluginCss;
exports.scss = scss;
exports.clean = clean;
exports.build = build;
exports.buildWatch = buildWatch;
exports.watchFiles =  watchFiles;
exports.watchSrc = watchSrc;
exports.default = buildWatch;
exports.copyAssets = copyAssets;
exports.pluginminify = pluginminify;






