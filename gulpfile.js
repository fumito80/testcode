const gulp = require('gulp');
// const newer = require("gulp-newer");
const ts = require('gulp-typescript');
const child = require('child_process');

let taskFlag = false;

gulp.task('default', function () {
  taskFlag = true;
  const tsProject = ts.createProject("./tsconfig.json");
  return tsProject.src()
    .pipe(tsProject())
    .on('error', (err) => {
      const title = `"${err.name}"`;
      const msg = `"${err.message.replace(/\u001b\[\d+m?/g, '')}"`;
      child.execFileSync('powershell', ['./build.ps1', '0', title, msg, 'Error']);
      process.exit(1);
    })
    .pipe(gulp.dest('./dist'));
  // return result;
});

process.on('exit', exitCode => {
  if (taskFlag && exitCode === 0) {
    const title = '"Done!"';
    const msg = '"TypeScript compile"';
    child.execFileSync('powershell', ['./build.ps1', '20000', title, msg]);
  }
  process.nextTick(() => {
    process.exit(exitCode);
  });
});
