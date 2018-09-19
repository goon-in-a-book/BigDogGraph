let PromiseDrawLines = (gl, program, offset, sliceSize, numPoints) => {
  return new Promise(resolve => {
    setTimeout(() => {
      let triangleVertices = [];
      for (let i = 0; i < sliceSize; i++) {
        triangleVertices.push((i / numPoints + offset) * 2 - 1);
        triangleVertices.push((i / numPoints + offset) * 2 - 1);
      }

      let bufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(triangleVertices),
        gl.STATIC_DRAW
      );

      let positionAttribLocation = gl.getAttribLocation(
        program,
        'vertPosition'
      );
      gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        2 * Float32Array.BYTES_PER_ELEMENT,
        0
      );
      gl.enableVertexAttribArray(positionAttribLocation);

      gl.useProgram(program);
      gl.drawArrays(gl.LINE_STRIP, 0, sliceSize);
      resolve(null);
    }, 200);
  });
};

function workerFunction() {
  let vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec2 vertPosition;',
    '',
    'void main()',
    '{',
    '  gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '  gl_PointSize = 2.0;',
    '}'
  ].join('\n');

  let fragmentShaderText = [
    'precision mediump float;',
    '',
    'void main()',
    '{',
    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  let DrawLines = (gl, program, offset, sliceSize, numPoints) => {
    let triangleVertices = [];
    for (let i = 0; i < sliceSize; i++) {
      triangleVertices.push((i / numPoints + offset) * 2 - 1);
      triangleVertices.push((i / numPoints + offset) * Math.random() * 2 - 1);
    }

    let bufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferObject);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(triangleVertices),
      gl.DYNAMIC_DRAW
    );

    let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(
      positionAttribLocation,
      2,
      gl.FLOAT,
      gl.FALSE,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    gl.enableVertexAttribArray(positionAttribLocation);

    gl.useProgram(program);
    gl.drawArrays(gl.LINE_STRIP, 0, sliceSize);
  };

  onmessage = async function(event) {
    let gl = event.data.canvas.getContext('webgl', {
      preserveDrawingBuffer: true
    });
    if (!gl) {
      console.log('WebGL is not supported, falling back on experimental-webgl');
      gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
      alert('Your browser does not support WebGL');
    }

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(
        'ERROR compiling vertex shader!',
        gl.getShaderInfoLog(vertexShader)
      );
      return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(
        'ERROR compiling fragment shader!',
        gl.getShaderInfoLog(fragmentShader)
      );
      return;
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ERROR linking program!', gl.getProgramInfoLog(program));
      return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      console.error('ERROR validating program!', gl.getProgramInfoLog(program));
      return;
    }
    let startTime = Date.now();
    let numPoints = 1000000000;
    let sliceSize = 100000;
    let c = 0;
    let numPieces = numPoints / sliceSize;
    for (let c = 0; c < numPieces; c++) {
      let offset = c * (sliceSize / numPoints);
      DrawLines(gl, program, offset, sliceSize, numPoints);
    }
    console.log('Time: ' + (Date.now() - startTime) / 1000);
  };
}

function InitDemo() {
  let canvas = document.getElementById('graph-canvas');
  if (!('transferControlToOffscreen' in canvas)) {
    throw new Error('webgl in worker unsupported');
  }

  var offscreen = canvas.transferControlToOffscreen();
  let worker = new Worker(
    URL.createObjectURL(
      new Blob(['(' + workerFunction.toString() + ')()'], {
        type: 'text/javascript'
      })
    )
  );
  worker.postMessage({ canvas: offscreen }, [offscreen]);
}
