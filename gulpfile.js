"use strict";

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************
const gulp = require("gulp"),
    tslint = require("gulp-tslint"),
    tsc = require("gulp-typescript"),
    mocha = require("gulp-mocha"),
    istanbul = require("gulp-istanbul"),
    sourcemaps = require("gulp-sourcemaps"),
    del = require('del');

//******************************************************************************
//* CLEAN
//******************************************************************************
gulp.task("clean", function () {
    return del([
        "src/**/*.js",
        "test/**/*.test.js",
        "src/*.js",
        "test/*.test.js",
        "lib",
        "es",
        "amd"
    ]);
});

//******************************************************************************
//* LINT
//******************************************************************************
gulp.task("lint", function () {

    const config = {
        fornatter: "verbose",
        emitError: (process.env.CI) ? true : false
    };

    return gulp.src([
        "src/**/**.ts",
        "test/**/**.test.ts"
    ])
        .pipe(tslint(config))
        .pipe(tslint.report());
});

//******************************************************************************
//* SOURCE
//******************************************************************************
const tsLibProject = tsc.createProject("tsconfig.json", {
    module: "commonjs"
});

gulp.task("build-lib", function () {
    return gulp.src([
        "src/**/*.ts"
    ])
        .pipe(tsLibProject())
        .on("error", function (err) {
            process.exit(1);
        })
        .js.pipe(gulp.dest("lib/"));
});

const tsEsProject = tsc.createProject("tsconfig.json", {
    module: "es2015"
});

gulp.task("build-es", function () {
    return gulp.src([
        "src/**/*.ts"
    ])
        .pipe(tsEsProject())
        .on("error", function (err) {
            process.exit(1);
        })
        .js.pipe(gulp.dest("es/"));
});

const tsDtsProject = tsc.createProject("tsconfig.json", {
    declaration: true,
    noResolve: false
});

gulp.task("build-dts", function () {
    return gulp.src([
        "src/**/*.ts"
    ])
        .pipe(tsDtsProject())
        .on("error", function (err) {
            process.exit(1);
        })
        .dts.pipe(gulp.dest("dts"));

});

//******************************************************************************
//* TESTS
//******************************************************************************
const tstProject = tsc.createProject("tsconfig.json");

gulp.task("build-src", function () {
    return gulp.src([
        "src/**/*.ts"
    ])
        .pipe(sourcemaps.init())
        .pipe(tstProject())
        .on("error", function (err) {
            process.exit(1);
        })
        .js.pipe(sourcemaps.write(".", {
            sourceRoot: function (file) {
                return file.cwd + '/src';
            }
        }))
        .pipe(gulp.dest("src/"));
});

const tsTestProject = tsc.createProject("tsconfig.json");
gulp.task("build-test", function () {
    return gulp.src([
        "test/**/*.ts"
    ])
        .pipe(sourcemaps.init())
        .pipe(tsTestProject())
        .on("error", function (err) {
            process.exit(1);
        })
        .js.pipe(sourcemaps.write(".", {
            sourceRoot: function (file) {
                return file.cwd + '/test';
            }
        }))
        .pipe(gulp.dest("test/"));;
});

gulp.task("mocha", function () {
    return gulp.src([
        "node_modules/reflect-metadata/Reflect.js",
        "test/**/*.test.js"
    ])
        .pipe(mocha({
            ui: "bdd"
        }))
        .pipe(istanbul.writeReports());
});

gulp.task("istanbul:hook", function () {
    return gulp.src(["src/**/*.js"])
        // Covering files
        .pipe(istanbul())
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task("test", gulp.series(
    "istanbul:hook",
    "mocha",
));

gulp.task("build",
    gulp.series(
        "lint",
        gulp.parallel(
            "build-src"
            , "build-test"
            , "build-es"
            , "build-lib"
            , "build-dts"
        ),

    )
);

//******************************************************************************
//* DEFAULT
//******************************************************************************
gulp.task("default", gulp.series(
    "build",
    "test",
));
