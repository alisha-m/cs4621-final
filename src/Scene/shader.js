class Shader {
  /**
   * Creates a shader object
   * 
   * @raises Throws an error if an error occurs compiling or linking the shader
   * 
   * @param gl The webGL context
   * @param vertexShaderId The name of the vertex shader ID in HTML
   * @param fragmentShaderId The name of the fragment shader ID in HTML
   * @param update A function to be called every frame, when the shader is used
   *               for drawing. The function must take in at least 2 parameters,
   *               the transform object for the item being drawn and the current
   *               camera. This function should be used to update all of the
   *               uniforms. This program should call updateMVP. Note: to use
   *               the current program, simply write "this.program" in the
   *               function
   */
  constructor(gl, vertexShaderId, fragmentShaderId, hasVertAttrib = true, hasNormAttrib = true, hasUVAttrib = true) {
    this.program = gl.createProgram();
    this.uniforms = [];

    var createShader = function(gl, shaderScriptId) {
      var shaderScript = $("#" + shaderScriptId);
      var shaderSource = shaderScript[0].text;
      var shaderType = null;
      if (shaderScript[0].type == "x-shader/x-vertex") {
        shaderType = gl.VERTEX_SHADER;
      } else if (shaderScript[0].type == "x-shader/x-fragment") {
        shaderType = gl.FRAGMENT_SHADER;
      } else {
        throw new Error("Invalid shader type: " + shaderScript[0].type)
      }
      var shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("An error occurred compiling the shader: " + infoLog);
      } else {
        return shader;
      }
    }

    gl.attachShader(this.program, createShader(gl, vertexShaderId));
    gl.attachShader(this.program, createShader(gl, fragmentShaderId));
    gl.linkProgram(this.program);
    gl.validateProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      var infoLog = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      throw new Error("An error occurred linking the program: " + infoLog);
    }

    if (hasVertAttrib) {
      this.program.vert_position = gl.getAttribLocation(this.program, "vert_position");
    }
    if (hasNormAttrib) {
      this.program.vert_normal = gl.getAttribLocation(this.program, "vert_normal");
    }
    if (hasUVAttrib) {
      this.program.vert_texCoord = gl.getAttribLocation(this.program, "vert_texCoord");
    }

    // this.update = update;
  }

  use = function(gl) {
    gl.useProgram(this.program);
  }
}