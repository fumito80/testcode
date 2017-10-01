const gulp = require('gulp');
// const newer = require("gulp-newer");
const ts = require('gulp-typescript');
const child = require('child_process');

function getNotifier() {
  if (process.platform === 'win32') {
    const WindowsBalloon = require('node-notifier').WindowsBalloon;
    return new WindowsBalloon({
      withFallback: false, // Try Windows Toast and Growl first? 
      customPath: void 0 // Relative/Absolute path if you want to use your fork of notifu 
    });
  }
  return require('node-notifier');
}

const notifier = getNotifier();

gulp.task('tsc:w', function () {
  let error = false;
  const tsProject = ts.createProject("./tsconfig.json");
  return tsProject
    .src()
    .pipe(tsProject())
    .on('error', (err) => {
      error = true;
      const message = err.message.replace(/\u001b\[\d+m?/g, '');
      notifier.notify({
        type: 'error',
        title: err.name,
        message
      });
    })
    .pipe(gulp.dest('./dist'))
    .on('finish', () => {
      if (!error) {
        notifier.notify({
          type: 'info',
          title: "Done!",
          message: "TypeScript compile"
        });
      }
    });
});

gulp.task('watch', () => {
  gulp.watch('./src/*.ts', ['tsc:w']);
});

gulp.task('default', ['tsc']);
