function InitDemo() {
  let bigArray = [];
  let length = 1024 * 1024;
  for (let i = 0; i < length; i++) {
    bigArray.push(Math.random());
  }
  let startTime = performance.now();
  bigArray.sort();
  let endTime = performance.now();
  console.log(endTime - startTime);
}
