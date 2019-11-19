import {Camera} from '../Scene/camera'
import {Scene} from '../Scene/scene'
import { MeshObject } from '../Scene/mesh-object';
import { vec3, mat4 } from 'gl-matrix';

// Initializes webgl object. Handles errors related to this.
// @param {html canvas element} canvas - The canvas of the webpage.
// @return {gl} the WebGl data structure which will contain webgl functionality
function initializeWebGL(canvas: JQuery<HTMLCanvasElement>) {
    var gl: WebGLRenderingContext = null;
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
function createShader(gl: WebGLRenderingContext, shaderScriptId: string) {
    var shaderScript = <JQuery<HTMLScriptElement>> $("#" + shaderScriptId);
    var shaderSource = shaderScript[0].text;
    var shaderType: number = null;
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
function createGlslProgram(gl: WebGLRenderingContext, 
    vertexShaderId : string, fragmentShaderId: string): WebGLProgram {

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

function getViewMat(camPos: vec3, camDir: vec3, camUp: vec3)  {
    let lookPoint = vec3.create();
    vec3.add(lookPoint, camPos, camDir);

    let viewMat = mat4.create();
    mat4.lookAt(viewMat, camPos, lookPoint, camUp);

    return viewMat;
}

function getProjectionMat(fieldOfView: number, aspectRatio: number, near: number, far: number) {
    let projectionMat = mat4.create();
    mat4.perspective(projectionMat, fieldOfView, aspectRatio, near, far);

    return projectionMat;
}

function getMVP(viewMatrix: mat4, projectionMatrix: mat4) {
    let mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, mvpMatrix, projectionMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, viewMatrix);

    return mvpMatrix;
}

interface ProjectionInfo {
    fieldOfView: number;
    aspectRatio: number;
    near: number;
    far: number;
}

interface ViewInfo {
    camPos: vec3;
    camDir: vec3;
    camUp: vec3;
}

function updateMVP(
    gl: WebGLRenderingContext, program: WebGLProgram,
    projInfo: ProjectionInfo, viewInfo: ViewInfo
) {
    let viewMat = getViewMat(viewInfo.camPos, viewInfo.camDir, viewInfo.camUp);
    let projectionMat = getProjectionMat(
        projInfo.fieldOfView, projInfo.aspectRatio, projInfo.near, projInfo.far);

    let mvp = getMVP(viewMat, projectionMat);

    // TODO: Don't just hardcode this lmao
    let mvpLocation = gl.getUniformLocation(program, "modelViewProjection");

    gl.uniformMatrix4fv(mvpLocation, false, mvp);
}

// Begins process of loading an image 
// @param {string} - imageSrc - the file path to the image to be loaded
// @return {Image} returns image data structure, may not be loaded fully
function loadImage(imageSrc: string) {
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    return image;
}

// Handles main rendering animation loop. Calls itself every frame.
function runWebGl(scene: Scene) {
    var gl = initializeWebGL(<JQuery<HTMLCanvasElement>>$("#webGlCanvas"));
    
    // Tell WebGL to test the depth when drawing
    gl.enable(gl.DEPTH_TEST);
    // cull back-facing triangles
    gl.enable(gl.CULL_FACE);


    let camera = scene.getCamera();

    function updateWebGl() {
        // Get list of all renderable objects from the scene.
        let meshObjects: MeshObject[] = scene.getMeshObjects();
        // Get info to update view & projection matrices based on camera.
        let projInfo: ProjectionInfo = {
            fieldOfView: camera.fieldOfView,
            aspectRatio: camera.aspectRatio,
            near: camera.near,
            far: camera.far
        };
        let viewInfo: ViewInfo = {
            camPos: camera.transform.position,
            camDir: camera.getCamDir(),
            camUp: camera.getCamUp()
        };

        // TODO: For each renderable object...
        for (let i = 0; i < meshObjects.length; i++) {
            // TODO: Create a program for it's material 
            // (load its shaders, set its attributes/uniforms from given data)
            // For now, just hardcode in the default shader
            var program = createGlslProgram(gl, "vertexShader", "fragmentShader");
            // TODO: Get shape data
            // Update model matrix based on transform
            updateMVP(gl, program, projInfo, viewInfo);
            // TODO: Draw the dang thing
        }
        // TODO: Have some way of handling which textures are assigned to which WebGL texture int thing

        requestAnimationFrame(updateWebGl);
    }

    requestAnimationFrame(updateWebGl);
}