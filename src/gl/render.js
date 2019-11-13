// These global variables should be updated every frame from the core loop.

// Camera data structure which contains camera info and stuff
var camera;
// a Scene data structure which contains all of the Renderable SceneObjects
// which we want to render
var scene;

// Initializes webgl object. Handles errors related to this.
// @param {html canvas element} canvas - The canvas of the webpage.
// @return {gl} the WebGl data structure which will contain webgl functionality
function initializeWebGL(canvas) {
    var gl = null;
    try {
        gl = canvas[0].getContext("experimental-webgl");
        if (!gl) {
            gl = canvas[0].getContext("webgl");
        }
    } catch (error) {
        // NO-OP
    }
    if (!gl) {
        alert("Could not get WebGL context!");
        throw new Error("Could not get WebGL context!");
    }
    return gl;
}

// Creates webgl shader from given script id.
// @param gl - The webgl object.
// @param shaderScriptId - The id of the shader script in the html page.
function createShader(gl, shaderScriptId) {
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

// Attaches given shaders to the webgl object, then creates and validates the
// program.
// @param gl - webgl object.
// @param vertexShaderId - The id of the vertex shader in the html page.
// @param fragmentShaderId - The id of the fragment shader in the html page.
function createGlslProgram(gl, vertexShaderId, fragmentShaderId) {
    var program = gl.createProgram();
    
    gl.attachShader(program, createShader(gl, vertexShaderId));
    gl.attachShader(program, createShader(gl, fragmentShaderId));
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("An error occurred linking the program: " + infoLog);
    } else {
        return program;
    }
}

// Begins the process of loading an image.
// @param {string} - imageSrc - the file path to the image to be loaded
// @return {Image} returns image data structure, may not be loaded fully
function getImage(imageSrc) {
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    // Will not be instantly loaded
    return image; 
}

// Handles main rendering animation loop. Calls itself every frame.
function runWebGl() {
    var gl = initializeWebGL($("#webGlCanvas"));
    
    // Tell WebGL to test the depth when drawing
    gl.enable(gl.DEPTH_TEST);
    // cull back-facing triangles
    gl.enable(gl.CULL_FACE);

    // TODO: Get list of all renderable objects from the scene.
    // TODO: Update view & projection matrices based on camera info.
    // TODO: For each renderable object...
        // TODO: Create a program for it's material (load its shaders, set its attributes/uniforms from given data)
        // TODO: Update model matrix based on transform
        // TODO: Draw the dang thing
    // TODO: Have some way of handling which textures are assigned to which WebGL texture int thing
}