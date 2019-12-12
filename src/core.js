var canvas = document.getElementById("webglCanvas");

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

function isPowerOfTwo(val){
    return (val & (val - 1)) == 0;
}

function loadTexture(gl, image, activeTexture) {
        // Create the texture.
        // Step 1: Create the texture object and bind it to the given active texture
        gl.activeTexture(activeTexture);

        var texture = gl.createTexture();
        // Step 2: Bind the texture object to the "target" TEXTURE_2D
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
        //         so that we don't have to deal with flipping the y-coordinate.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // Step 4: Download the image data to the GPU.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Step 5: Creating a mipmap so that the texture can be anti-aliased.
        if(isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
}

// Sky box - Used this page: https://learnopengl.com/Advanced-OpenGL/Cubemaps
// Images should be in order: posX, negX, posY, negY, posZ, negZ
function createCubeMapTexture(gl, images) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    var texTargets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    for(var i = 0; i < 6; i++) {
        gl.texImage2D(texTargets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    return texture;
}

function createBox(gl, sizeX, sizeY) {
    var shape = {};
    var scale = Math.max(sizeX, sizeY)*0.5;

    var positions = [
        -0.5*scale, -0.5*scale, -0.5*scale,
         0.5*scale, -0.5*scale, -0.5*scale,
        -0.5*scale,  0.5*scale, -0.5*scale,
         0.5*scale,  0.5*scale, -0.5*scale,

        -0.5*scale, -0.5*scale,  0.5*scale,
         0.5*scale, -0.5*scale,  0.5*scale,
        -0.5*scale,  0.5*scale,  0.5*scale,
         0.5*scale,  0.5*scale,  0.5*scale
    ];

    var indices = [
        // Front
        2, 3, 7,
        2, 7, 6,

        // Back
        0, 4, 5,
        0, 5, 1,

        // Right
        1, 7, 3,
        1, 5, 7,

        // Left
        0, 2, 6,
        0, 6, 4,

        // Top
        4, 7, 5,
        4, 6, 7,

        // Bottom
        0, 1, 3,
        0, 3, 2
    ];

    var vertexData = [];
    var vertexCount = positions.length / 3;
    for (var i = 0; i < vertexCount; i++) {
        vertexData.push(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
    }
    var vertexArray = new Float32Array(vertexData);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexArray = new Uint16Array(indices);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    shape.vertexBuffer = vertexBuffer;
    shape.indexBuffer = indexBuffer;
    shape.size = indices.length;
    shape.stride = 4 * 3;
    shape.positionOffset = 4 * 0;
    return shape;
}

function createShape(gl, geometry) {
    let shape = {};

    let vertexData = [];
    let vertexCount = geometry.vertices.length;

    let hasNormals = geometry.normals.length > 0;
    let hasUVs = geometry.uvs.length > 0;

    for (let i = 0; i < vertexCount; i++) {
        vertexData.push(geometry.vertices[i][0], geometry.vertices[i][1], geometry.vertices[i][2]);
        
        if(hasNormals) {
            vertexData.push(geometry.normals[i][0], geometry.normals[i][1], geometry.normals[i][2]);
        }

        if(hasUVs) {
            vertexData.push(geometry.uvs[i][0], geometry.uvs[i][1]);
        }
    }

    let vertexArray = new Float32Array(vertexData);
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    let indices = [];
    let faceCount = geometry.faces.length;
    for (let i = 0; i < faceCount; i++) {
        indices.push(geometry.faces[i].indices[0], geometry.faces[i].indices[1], geometry.faces[i].indices[2]);
    }
    let indexArray = new Uint16Array(indices);
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    shape.vertexBuffer = vertexBuffer;
    shape.indexBuffer = indexBuffer;
    shape.size = indexArray.length;
    shape.stride = 4 * (3 + (hasNormals ? 3 : 0) + (hasUVs ? 2 : 0))
    shape.positionOffset = 4 * 0;

    if(hasNormals) shape.normalOffset = 4 * 3;
    if (hasUVs) shape.texCoordOffset = 4 * (3 + (hasNormals ? 3 : 0));

    shape.hasNormals = hasNormals;
    shape.hasUVs = hasUVs;

    return shape;
}

function createShapeOG(gl, shapeData) {
    var shape = {};

    var vertexData = [];
    var vertexCount = shapeData.positions.length / 3;
    for (var i = 0; i < vertexCount; i++) {
        vertexData.push(shapeData.positions[3 * i], shapeData.positions[3 * i + 1], shapeData.positions[3 * i + 2]);
        vertexData.push(shapeData.normals[3 * i], shapeData.normals[3 * i + 1], shapeData.normals[3 * i + 2]);
        vertexData.push(shapeData.texCoords[2 * i], shapeData.texCoords[2 * i + 1]);
    }
    var vertexArray = new Float32Array(vertexData);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexArray = new Uint16Array(shapeData.indices);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    shape.vertexBuffer = vertexBuffer;
    shape.indexBuffer = indexBuffer;
    shape.size = shapeData.indices.length;
    shape.stride = 4 * (3 + 3 + 2);
    shape.positionOffset = 4 * 0;
    shape.normalOffset = 4 * 3;
    shape.texCoordOffset = 4 * (3 + 3);
    return shape;
}

function draw(gl, program, shape, initialize) {
    gl.useProgram(program);

    initialize();

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);

    gl.enableVertexAttribArray(program.vert_position);
    gl.vertexAttribPointer(program.vert_position, 3, gl.FLOAT, false, shape.stride, shape.positionOffset);

    if(shape.hasNormals) {
        gl.enableVertexAttribArray(program.vert_normal);
        gl.vertexAttribPointer(program.vert_normal, 3, gl.FLOAT, false, shape.stride, shape.normalOffset);
    }

    if(shape.hasUVs) {
        gl.enableVertexAttribArray(program.vert_texCoord);
        gl.vertexAttribPointer(program.vert_texCoord, 2, gl.FLOAT, false, shape.stride, shape.texCoordOffset);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
    gl.drawElements(gl.TRIANGLES, shape.size, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // gl.useProgram(null);
};

function setupTexture(gl, program, texture, activeTexture, textureIdx) {
    // Step 1: Activate texture unit associated with this texture
    gl.activeTexture(activeTexture);
    // Step 2: Bind the texture you want to use:
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Step 3: Set the texture uniform to the "index" of the texture unit you just activated
    var textureLocation = gl.getUniformLocation(program, "texture1");
    gl.uniform1i(textureLocation, textureIdx);
}

var xAxis = vec3.fromValues(1, 0, 0);
var yAxis = vec3.fromValues(0, 1, 0);
var zAxis = vec3.fromValues(0, 0, 1);

function getModel(transform) {
    // translate
    let T = mat4.create();
    mat4.fromTranslation(T, transform.position);

    // rotate
    let R = mat4.create();
    // XYZ Order
    mat4.rotate(R, R, transform.rotation[0], xAxis);
    mat4.rotate(R, R, transform.rotation[1], yAxis);
    mat4.rotate(R, R, transform.rotation[2], zAxis);

    // ZYX Order
    // mat4.rotate(R, R, transform.rotation[2], zAxis);
    // mat4.rotate(R, R, transform.rotation[1], yAxis);
    // mat4.rotate(R, R, transform.rotation[0], xAxis);

    // scale
    let S = mat4.create();
    mat4.fromScaling(S, transform.localScale);

    let M = mat4.create();

    // TRS order
    mat4.mul(M, M, T);
    mat4.mul(M, M, R);
    mat4.mul(M, M, S);

    return M;
}

function getView(camera) {
    let lookPoint = vec3.create();
    vec3.add(lookPoint, camera.transform.position, camera.getCamDir());

    let viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, camera.transform.position, lookPoint, camera.camUp);

    return viewMatrix;
}

function getProjection(camera) {
    let projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, camera.fieldOfView, camera.aspectRatio, camera.near, camera.far);

    return projectionMatrix;
}

function getNormalMatrix(model, view) {
    let normalMat = mat3.create();
    let modelView = mat4.create();
    mat4.mul(modelView, view, model);
    mat3.normalFromMat4(normalMat, model);
    return normalMat;
}

// function getMVP(modelMatrix, viewMatrix, projectionMatrix) {
//     let mvpMatrix = mat4.create();
//     mat4.multiply(mvpMatrix, mvpMatrix, projectionMatrix);
//     mat4.multiply(mvpMatrix, mvpMatrix, viewMatrix);
//     mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);

//     return mvpMatrix;
// }

function updateMVP(gl, program, transform, camera) {
    let modelMatrix = getModel(transform);
    let viewMatrix = getView(camera);
    let projectionMatrix = getProjection(camera);
    let normalMatrix = getNormalMatrix(modelMatrix, viewMatrix);

    var modelLocation = gl.getUniformLocation(program, "model");
    var viewLocation = gl.getUniformLocation(program, "view");
    var projectionLocation = gl.getUniformLocation(program, "projection");
    var normalMatLocation = gl.getUniformLocation(program, "normalMat");

    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
    gl.uniformMatrix3fv(normalMatLocation, false, normalMatrix);
}

/*
numLights is the number of lights, to be sent to the shader
lightColors must be an array of 3 x numLights elements, where each set of 3
    values are a vec3 representing the color (and power) of that light source.
    It does NOT need to be normalized. (Larger values means a brighter light)
lightPositions must be an array of 3 x numLights elements, where each set of 3
    values are a vec3 representing the position of that light source in space
*/
function updateLights(gl, program, numLights, lightColors, lightPositions) {
    var numLightsLocation = gl.getUniformLocation(program, "numLights");
    var lightColorsLocation = gl.getUniformLocation(program, "lightColors");
    var lightPositionsLocation = gl.getUniformLocation(program, "lightPositions");

    gl.uniform1i(numLightsLocation, numLights);
    gl.uniform3fv(lightColorsLocation, lightColors);
    gl.uniform3fv(lightPositionsLocation, lightPositions);
}

// function storeLocations(gl, program) {
//     program.vert_position = gl.getAttribLocation(program, "vert_position");
//     program.vert_normal = gl.getAttribLocation(program, "vert_normal");
//     program.vert_texCoord = gl.getAttribLocation(program, "vert_texCoord");
//     program.model = gl.getUniformLocation(program, "model");
//     program.view = gl.getUniformLocation(program, "view");
//     program.projection = gl.getUniformLocation(program, "projection");
//     program.normalMat = gl.getUniformLocation(program, "normalMat");
// }

function lerpf(a, b, t) {
    return a + (b -a) * t;
}

function doCubeMarchingStuff() {
    let cubeMarhcer = new MarchingCubes();
}

// Give camera default values for now
var camTransform = new Transform(vec3.create(), vec3.create(), vec3.fromValues(1, 1, 1));
var camera = new Camera("Main Camera", camTransform, Math.PI / 4, 800/600, 0.1, 100);
var scene = new Scene(camera);

window.addEventListener("keydown", function (event) {
  let speed = 0.4;
  let turnSpeed = 0.05;
  if (event.which == 87 || event.which == 38) { //w or up arrow, move forward
    scene.camera.goForward(speed);
  }
  if (event.which == 83 || event.which == 40) { //s or down arrow, move backwards
    scene.camera.goBackward(speed);
  }
  if (event.which == 65 || event.which == 37) { //a or left arrow, move left
    scene.camera.turnLeft(turnSpeed);
  }
  if (event.which == 68 || event.which == 39) { //d or right arrow, move right
    scene.camera.turnRight(turnSpeed);
  }
},false);

var timeElapsed = 0;
var currently_moving = false;
var counter =0;

var mouseisDown = false;

// Start and Run WebGL
function startWebGL() {
    noise.seed(0);

    // get all images
    var queue = new createjs.LoadQueue(true);
    queue.loadFile({ id: "floor", src: "data/floor.jpg", type: "image" });
    queue.loadFile({ id: "wall", src: "data/wall.jpg", type: "image" });

    var path = "data/field-skyboxes/Meadow/";

    queue.loadFile({ id: "skyPosX", src: (path + "posx.jpg"), type: "image" });
    queue.loadFile({ id: "skyNegX", src: (path + "negx.jpg"), type: "image" });
    queue.loadFile({ id: "skyPosY", src: (path + "posy.jpg"), type: "image" });
    queue.loadFile({ id: "skyNegY", src: (path + "negy.jpg"), type: "image" });
    queue.loadFile({ id: "skyPosZ", src: (path + "posz.jpg"), type: "image" });
    queue.loadFile({ id: "skyNegZ", src: (path + "negz.jpg"), type: "image" });

    queue.on("complete", function () {
        scene.images.floorImage = queue.getResult("floor");
        scene.images.wallImage = queue.getResult("wall");
        runWebGL(queue);
    }, this);
}

function runWebGL(queue) {
    // BEGIN CUBE MARCHING
    doCubeMarchingStuff();
    // END CUBE MARCHING

    var gl = initializeWebGL($("#webglCanvas"));

    var surfaceShader = new Shader(
        gl,
        "surfaceVertexShader",
        "surfaceFragmentShader"
    );

    var lightShader = new Shader(
        gl,
        "lightVertexShader",
        "lightFragmentShader"
    );

    // var program = createGlslProgram(gl, "vertexShader", "fragmentShader");
    // var program = surfaceShader.program;
    // storeLocations(gl, program);

    // Set up lights
    let numLights = 3; // Currently, shader only allows for 8

    let lightColors = [
        100.0, 100.0, 100.0,
        75.0, 0.0, 0.0,
        0.0, 25.0, 50.0,
    ];
    let lightPositions = [
        0.0, 0.0, 10.0,
        0.0, 10.0, 10.0,
        10.0, 0.0, 10.0,
    ];



    //Sky Box stuff
    // var box = createBox(gl, 100, 100);
    // var textures = [];
    // textures.push(queue.getResult("skyPosX", false));
    // textures.push(queue.getResult("skyNegX", false));
    // textures.push(queue.getResult("skyPosZ", false));
    // textures.push(queue.getResult("skyNegZ", false));
    // textures.push(queue.getResult("skyNegY", false)); // Switched order
    // textures.push(queue.getResult("skyPosY", false));

    // var cubeMap = createCubeMapTexture(gl, textures);
    // var skyBoxProgram = createGlslProgram(gl, "vertexShaderSkyBox", "fragmentShaderSkyBox");
    // skyBoxProgram.texture = gl.getUniformLocation(skyBoxProgram, "texture");
    // skyBoxProgram.vert_position = gl.getAttribLocation(skyBoxProgram, "vert_position");
    // skyBoxProgram.xform_projMat = gl.getUniformLocation(skyBoxProgram, "xform_projMat");
    // skyBoxProgram.xform_viewMat = gl.getUniformLocation(skyBoxProgram, "xform_viewMat");
    // skyBoxProgram.xform_modelMat = gl.getUniformLocation(skyBoxProgram, "xform_modelMat");
    // skyBoxProgram.vert_position = gl.getAttribLocation(skyBoxProgram, "vert_position");

    // skyBoxProgram.draw = function (gl, shape, initialize) {
    //     gl.useProgram(skyBoxProgram);

    //     initialize();

    //     gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    //     gl.enableVertexAttribArray(skyBoxProgram.vert_position);
    //     gl.vertexAttribPointer(skyBoxProgram.vert_position, 3, gl.FLOAT, false, shape.stride, shape.positionOffset);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
    //     gl.drawElements(gl.TRIANGLES, shape.size, gl.UNSIGNED_SHORT, 0);
    //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    //     // gl.useProgram(null);
    // };

    // setup shaders
    let floorImage = scene.images.floorImage;
    let wallImage = scene.images.wallImage;
    var floorTexture = loadTexture(gl, floorImage, gl.TEXTURE0);
    var wallTexture = loadTexture(gl, wallImage, gl.TEXTURE1);

    // make camera and add it to the scene
    let fov = Math.PI / 4;
    let aspectRatio = canvas.width / canvas.height;
    let near = 0.1;
    let far = 100;

    let camTransform = new Transform(vec3.create(), vec3.create(), vec3.fromValues(1, 1, 1));
    scene.camera = new Camera("Main Camera", camTransform, fov, aspectRatio, near, far);

    // ADD STUFF TO SCENE

    // let quad = getQuadMesh(vec3.fromValues(3, 0, 0), vec3.fromValues(0, Math.PI / 2, 0), 1, 1);
    // quad.material.texture = floorTexture;
    // scene.addSceneObject(quad);

    let surface = makeSurface(200, 256, vec3.fromValues(0, 0, -0.5), surfaceShader);
    // surface.material.texture = floorTexture;
    scene.addSceneObject(surface);

    // STOP ADDING STUFF TO THE SCENE

    // setup time stuff
    var lastTime = jQuery.now();
    var deltaTime = 0;

    function updateWebGl() {
        // Time STUFF
        deltaTime = jQuery.now() - lastTime;
        lastTime = jQuery.now();

        let drawBox = function(box, tex, proj, view, model) {
            skyBoxProgram.draw(gl, box, function () {
                if (skyBoxProgram.xform_projMat != null) {
                    gl.uniformMatrix4fv(skyBoxProgram.xform_projMat, false, proj);
                }
                if (skyBoxProgram.xform_viewMat != null) {
                    gl.uniformMatrix4fv(skyBoxProgram.xform_viewMat, false, view);
                }
                if (skyBoxProgram.xform_modelMat != null) {
                    gl.uniformMatrix4fv(skyBoxProgram.xform_modelMat, false, model);
                }
                if (skyBoxProgram.texture != null) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
                    gl.uniform1i(skyBoxProgram.texture, 0);
                }
            });
        }

        // Draw skybox before depth testing
        gl.clearDepth(1.0);
        gl.clearColor(0.3, 0.7, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);

        // Because the project uses coordinate system with Z going up/down
        // var skyBoxModel = mat4.create();
        // var rotationAxis = vec3.fromValues(1.0, 0.0, 0.0);
        // mat4.fromRotation(skyBoxModel, -Math.PI / 2.0, rotationAxis);
        //
        // var skyBoxView = mat4.create();
        // var skyBoxEye = vec3.fromValues(0.0, 0.0, 0.0);
        // mat4.lookAt(skyBoxView, skyBoxEye, scene.camera.transform.position, scene.camera.defaultCamDir);
        //
        // var skyBoxProj = getProjection(fov, aspectRatio, near, far);
        //
        // drawBox(box, cubeMap, skyBoxProj, skyBoxView, skyBoxModel);

        gl.enable(gl.DEPTH_TEST);

        let drawMesh = function(mesh) {
            let shader = mesh.material.shader;
            let program = shader.program;

            if (mesh.material.textureIdx > -1) {
                setupTexture(gl, program, mesh.material.texture, mesh.material.textureIdx + gl.TEXTURE0, mesh.material.textureIdx);
            }

            // TODO: Don't assume that you're drawing a quad
            let shape = createShape(gl, mesh.geometry);

            scene.camera.landHeight = 0.5; // getHeight(scene.camera.transform.position[0], scene.camera.transform.position[1]);
            
            if(shader == surfaceShader) {
                updateMVP(gl, program, mesh.transform, scene.camera);

                gl.uniform1i(gl.getUniformLocation(program, "numLights"), numLights);
                gl.uniform3fv(gl.getUniformLocation(program, "lightColors"), lightColors);
                gl.uniform3fv(gl.getUniformLocation(program, "lightPositions"), lightPositions);

            } else if(shader == lightShader) {
                updateMVP(gl, program, mesh.transform, scene.camera);
                
                gl.uniform3f(gl.getUniformLocation(program, "lightColor"), mesh.material.color)

            }

            draw(gl, program, shape, () => {});
        }

        // draw all scene objects
        // TODO: Don't assume a single texture for each object, don't assume it's stored in a variable called "texture1"
        // TODO: Don't assume the same program for every mesh, use program defined by mesh material
        
        // if (gl.getUniformLocation(program, "texture1") != null) {
        for (let i = 0; i < scene.meshObjects.length; i++) {
            drawMesh(scene.meshObjects[i]);
        }
        // }

        requestAnimationFrame(updateWebGl);
    }

    requestAnimationFrame(updateWebGl);
}

startWebGL();

// window.addEventListener("keydown", function (event) {
//   let speed = 0.1;
//   let currentPos = scene.camera.transform.position;
//   let moveAmount = vec3.create();

//   if (event.which == 87 || event.which == 38) { //w or up arrow, move forward
//     vec3.scale(moveAmount, scene.camera.defaultCamDir, speed);
//     vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
//   }

// if (event.which == 83 || event.which == 40) { //s or down arrow, move backwards
//   vec3.scale(moveAmount, scene.camera.defaultCamDir, speed);
//   vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
// }
// if (event.which == 65 || event.which == 37) { //a or left arrow, move left
//   let dir = vec3.create();
//   vec3.copy(dir,scene.camera.defaultCamDir);
//   vec3.cross(dir, dir, scene.camera.camUp);
//   vec3.scale(moveAmount, dir, speed);
// //   vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
// }
// if (event.which == 68 || event.which == 39) { //d or right arrow, move right
//   let dir = vec3.create();
//   vec3.copy(dir,scene.camera.defaultCamDir);
//   vec3.cross(dir, dir, scene.camera.camUp);
//   vec3.scale(moveAmount, dir, speed);
// //   vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
// }
// },false);
