let canvas = document.getElementById("webglCanvas");
var mouseInfo = {
  oldMouseX:0,
  oldMouseY:0,
  MouseX:0,
  MouseY:0,
  diffX:0,
  diffY:0
};
var toggle = true
let sqr = function(x) { return x * x; }

function initializeWebGL(canvas) {
    let gl = null;
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

    let texture = gl.createTexture();
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
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    let texTargets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    for(let i = 0; i < 6; i++) {
        gl.texImage2D(texTargets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    return texture;
}

function createBox(gl, sizeX, sizeY) {
    let shape = {};
    let scale = Math.max(sizeX, sizeY)*0.5;

    let positions = [
        -0.5*scale, -0.5*scale, -0.5*scale,
         0.5*scale, -0.5*scale, -0.5*scale,
        -0.5*scale,  0.5*scale, -0.5*scale,
         0.5*scale,  0.5*scale, -0.5*scale,

        -0.5*scale, -0.5*scale,  0.5*scale,
         0.5*scale, -0.5*scale,  0.5*scale,
        -0.5*scale,  0.5*scale,  0.5*scale,
         0.5*scale,  0.5*scale,  0.5*scale
    ];

    let indices = [
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

    let vertexData = [];
    let vertexCount = positions.length / 3;
    for (let i = 0; i < vertexCount; i++) {
        vertexData.push(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
    }
    let vertexArray = new Float32Array(vertexData);
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    let indexArray = new Uint16Array(indices);
    let indexBuffer = gl.createBuffer();
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
    let hasOtherCoords = geometry.otherCoords.length > 0;

    geometry.numOtherCoords = 1;

    for (let i = 0; i < vertexCount; i++) {
        vertexData.push(geometry.vertices[i][0], geometry.vertices[i][1], geometry.vertices[i][2]);

        if(hasNormals) {
            vertexData.push(geometry.normals[i][0], geometry.normals[i][1], geometry.normals[i][2]);
        }

        if(hasUVs) {
            vertexData.push(geometry.uvs[i][0], geometry.uvs[i][1]);
        }

        if(hasOtherCoords) {
            vertexData.push(geometry.otherCoords[i]);
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

    shape.hasNormals = hasNormals;
    shape.hasUVs = hasUVs;
    shape.hasOtherCoords = hasOtherCoords;
    if(hasOtherCoords) shape.numOtherCoords = 1; // geometry.numOtherCoords;

    shape.vertexBuffer = vertexBuffer;
    shape.indexBuffer = indexBuffer;
    shape.size = indexArray.length;
    shape.stride = 4 * (3 + (hasNormals ? 3 : 0) + (hasUVs ? 2 : 0) + (hasOtherCoords ? shape.numOtherCoords : 0))
    shape.positionOffset = 4 * 0;

    if(hasNormals) shape.normalOffset = 4 * 3;
    if(hasUVs) shape.texCoordOffset = 4 * (3 + (hasNormals ? 3 : 0));
    if(hasOtherCoords) shape.otherOffset = 4 * (3 + (hasNormals ? 3 : 0) + (hasUVs ? 2 : 0));

    return shape;
}

function createShapeOG(gl, shapeData) {
    let shape = {};

    let vertexData = [];
    let vertexCount = shapeData.positions.length / 3;
    for (let i = 0; i < vertexCount; i++) {
        vertexData.push(shapeData.positions[3 * i], shapeData.positions[3 * i + 1], shapeData.positions[3 * i + 2]);
        vertexData.push(shapeData.normals[3 * i], shapeData.normals[3 * i + 1], shapeData.normals[3 * i + 2]);
        vertexData.push(shapeData.texCoords[2 * i], shapeData.texCoords[2 * i + 1]);
    }
    let vertexArray = new Float32Array(vertexData);
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    let indexArray = new Uint16Array(shapeData.indices);
    let indexBuffer = gl.createBuffer();
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

    if(shape.hasOtherCoords) {
        gl.enableVertexAttribArray(program.vert_other);
        gl.vertexAttribPointer(program.vert_other, 1, gl.FLOAT, false, shape.stride, shape.otherOffset);
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
    let textureLocation = gl.getUniformLocation(program, "texture1");
    gl.uniform1i(textureLocation, textureIdx);
}

let xAxis = vec3.fromValues(1, 0, 0);
let yAxis = vec3.fromValues(0, 1, 0);
let zAxis = vec3.fromValues(0, 0, 1);

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
    mat3.normalFromMat4(normalMat, modelView);
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

    let modelLocation = gl.getUniformLocation(program, "model");
    let viewLocation = gl.getUniformLocation(program, "view");
    let projectionLocation = gl.getUniformLocation(program, "projection");
    let normalMatLocation = gl.getUniformLocation(program, "normalMat");

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
    let numLightsLocation = gl.getUniformLocation(program, "numLights");
    let lightColorsLocation = gl.getUniformLocation(program, "lightColors");
    let lightPositionsLocation = gl.getUniformLocation(program, "lightPositions");

    let ambientLightLocation = gl.getUniformLocation(program, "ambientLight");
    console.log(ambientLightLocation);

    gl.uniform1i(numLightsLocation, numLights);
    gl.uniform3fv(lightColorsLocation, lightColors);
    gl.uniform3fv(lightPositionsLocation, lightPositions);

    gl.uniform3f(ambientLightLocation, ambientLight[0], ambientLight[1], ambientLight[2]);
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
    let cubeMarcher = new MarchingCubes();
}

// Give camera default values for now
let camTransform = new Transform(vec3.create(), vec3.create(), vec3.fromValues(1, 1, 1));
let camera = new Camera("Main Camera", camTransform, Math.PI / 4, 800/600, 0.1, 100);
let scene = new Scene(camera);

window.addEventListener("keydown", function (event) {
  let speed = 0.4;
  let turnSpeed = 0.05;
  if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
    event.preventDefault();
  }
  if (event.which == 87) { //w, move forward
    scene.camera.goForward(speed);
  }
  if (event.which == 83) { //s, move backwards
    scene.camera.goBackward(speed);
  }
  if (event.which == 65) { //a or left arrow, move left
    scene.camera.goLeft(speed);
  }
  if (event.which == 68) { //d, move right
    scene.camera.goRight(speed);
  }
  if (event.which == 69) {
    scene.camera.goUp(speed);
  }
  if (event.which == 16) {
    scene.camera.goDown(speed);
  }
  if (event.which == 39) {
    scene.camera.turnRight(turnSpeed);
  }
  if (event.which == 37) {
    scene.camera.turnLeft(turnSpeed);
  }
  if (event.which == 40) {
    scene.camera.turnUp(turnSpeed);
  }
  if (event.which == 38) {
    scene.camera.turnDown(turnSpeed);
  }
  if (event.which == 84){
    if (toggle == true){
      toggle = false;
    }
    else if (toggle == false){
      toggle = true;
    }
  }

},false);



function logMouse (event){
  // console.log(event.movementX);
  // console.log(event.movementY);
  if (toggle){
    if(event.movementX > 0){
      scene.camera.turnRight(.05);
    }
    if(event.movementX < 0){
      scene.camera.turnLeft(.05);
    }
    if(event.movementY > 0){
      scene.camera.turnUp(.03);
    }
    if(event.movementY < 0){
      scene.camera.turnDown(.03);
    }
  }
}

 window.addEventListener("mousemove", logMouse);
//   let turnSpeed = 0.05;
  // mouseInfo.mouseX = event.clientX;
  // mouseInfo.mouseY = event.clientY;
//   while (x > downx) {
//     scene.camera.turnRight(turnSpeed);
//   }
//   while (x < downx) {
//     scene.camera.turnLeft(turnSpeed);
//   }
//
// },false);


let timeElapsed = 0;
let currently_moving = false;
let counter =0;

let mouseisDown = false;

// Start and Run WebGL
function startWebGL() {
    noise.seed(0);

    // get all images
    let queue = new createjs.LoadQueue(true);
    queue.loadFile({ id: "floor", src: "data/floor.jpg", type: "image" });
    queue.loadFile({ id: "wall", src: "data/wall.jpg", type: "image" });

    queue.loadFile({ id: "moss", src: "data/moss.jpg", type: "image" });

    let path = "data/field-skyboxes/Meadow/";

    queue.loadFile({ id: "skyPosX", src: (path + "posx.jpg"), type: "image" });
    queue.loadFile({ id: "skyNegX", src: (path + "negx.jpg"), type: "image" });
    queue.loadFile({ id: "skyPosY", src: (path + "posy.jpg"), type: "image" });
    queue.loadFile({ id: "skyNegY", src: (path + "negy.jpg"), type: "image" });
    queue.loadFile({ id: "skyPosZ", src: (path + "posz.jpg"), type: "image" });
    queue.loadFile({ id: "skyNegZ", src: (path + "negz.jpg"), type: "image" });

    queue.on("complete", function () {
        scene.images.floorImage = queue.getResult("floor");
        scene.images.wallImage = queue.getResult("wall");
        scene.images.mossImage = queue.getResult("moss");

        var objs = [];/* 
        var promise = new Promise(function(resolve, reject) {

            resolve = () => loadGeom("src/Objects/cube.obj");
            // loadGeom("src/Objects/cube.obj")
        });
*/
        $.ajax({
            url: "data/objects/mushroom.obj",
            dataType: 'text'
        }).done(function(data) {
            var res = makeGeom(data);
            console.log(res);
            runWebGL(queue, res);
        }).fail(function() {
            alert('Failed to retrieve [' + filename + "]");
        });
/*
        promise.then(function(data) {
            console.log(data);
            
        });*/
        
    }, this);
}

function runWebGL(queue, geom) {
    // BEGIN CUBE MARCHING
    doCubeMarchingStuff();
    // END CUBE MARCHING

    let gl = initializeWebGL($("#webglCanvas"));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // SET UP SHADERS

    let surfaceShader = new Shader(
        gl,
        "surfaceVertexShader",
        "surfaceFragmentShader"
    );

    let waterShader = new Shader(
        gl,
        "waterVertexShader",
        "waterFragmentShader",
        true, true, true,
        "vert_height"
    );

    let skyboxShader = new Shader(
        gl,
        "skyboxVertexShader",
        "skyboxFragmentShader"
    );

    let lightShader = new Shader(
        gl,
        "lightVertexShader",
        "lightFragmentShader"
    );

    let objShader = new Shader( 
        gl, 
        "objVertexShader",
        "objFragmentShader"
    );

    //Sky Box stuff
    // let box = createBox(gl, 100, 100);
    // let textures = [];
    // textures.push(queue.getResult("skyPosX", false));
    // textures.push(queue.getResult("skyNegX", false));
    // textures.push(queue.getResult("skyPosZ", false));
    // textures.push(queue.getResult("skyNegZ", false));
    // textures.push(queue.getResult("skyNegY", false)); // Switched order
    // textures.push(queue.getResult("skyPosY", false));

    // let cubeMap = createCubeMapTexture(gl, textures);
    // let skyBoxProgram = createGlslProgram(gl, "vertexShaderSkyBox", "fragmentShaderSkyBox");
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

    let floorImage = scene.images.floorImage;
    let mossImage = scene.images.mossImage;
    let floorTexture = loadTexture(gl, floorImage, gl.TEXTURE0);

    let mossTexture = loadTexture(gl, mossImage, gl.TEXTURE1);

    // make camera and add it to the scene
    let fov = Math.PI / 4;
    let aspectRatio = canvas.width / canvas.height;
    let near = 0.1;
    let far = 100;

    let camTransform = new Transform(vec3.create(), vec3.create(), vec3.fromValues(1, 1, 1));
    scene.camera = new Camera("Main Camera", camTransform, fov, aspectRatio, near, far);

    // ADD STUFF TO SCENE

    // let ambientLight = vec3.fromValues(0.05, 0.1, 0.2);
    // let dirLightDirection = vec3.fromValues(1.0, 1.0, 1.0);
    // let dirLightColor = vec3.fromValues(0.2, 0.25, 0.3);

    let ambientLight = vec3.fromValues(0.3, 0.2, 0.05);
    let dirLightDirection = vec3.fromValues(0.5, 1.0, 0.5);
    let dirLightColor = vec3.fromValues(0.45, 0.5, 0.6);

    // Set up lights
    let numLights = 0; // Currently, shader only allows for 8

    let lightColors = [];
    let lightPositions = [];

    function makeLight(colorR, colorG, colorB, posX, posY, posZ) {
        numLights++;
        lightColors.push(colorR, colorG, colorB);
        lightPositions.push(posX, posY, posZ)
    }

    //        Red   Green Blue   X     Y     Z
    // makeLight(50.0, 50.0, 50.0,  10.0, 0.0,  5.0);
    // makeLight( 0.0, 10.0, 20.0,  10.0, 10.0, 5.0);
    // makeLight( 0.0, 25.0, 50.0,  20.0, 0.0,  5.0);

    // let maxColor = 0;

    for(let i = 0; i < 5; i++) {
        let x = (Math.random() * WIDTH - (WIDTH / 2));
        let y = (Math.random() * WIDTH - (WIDTH / 2));
        let r = Math.random() * 25;
        let g = Math.random() * 50;
        let b = Math.random() * 75;
        // maxColor = Math.Math.max(Math.max(r, g), b);
        makeLight(
            r, g, b,
            x, y, 10 * Math.random() + getHeight(x, y) + 3
        );
    }

    // The following commented out loop will draw a cube for each point light

    for(let i = 0; i < numLights; i++) {
        // Make the max coordinate of the color equal to 1, and scale down the
        // others accordingly.
        color = vec3.fromValues(lightColors[(3 * i)], lightColors[(3 * i) + 1], lightColors[(3 * i) + 2]);

        let maxColorChannel = Math.max(Math.max(color[0], color[1]), color[2]);
        vec3.scale(color, color, 1.0 / maxColorChannel);
        // vec3.scale(color, color, 1.0 / maxColor);

        // scene.addSceneObject(makeBox(
        //     color,
        //     vec3.fromValues(lightPositions[(3 * i)], lightPositions[(3 * i) + 1], lightPositions[(3 * i) + 2]),
        //     1,
        //     lightShader
        // ));

        let obj = makeMesh(
            "cube",
            vec3.fromValues(lightPositions[(3 * i)], lightPositions[(3 * i) + 1], lightPositions[(3 * i) + 2]),
            vec3.create(),
            1,
            geom,
            lightShader,
            color
        );
        console.log(obj);

        scene.addSceneObject(obj);     
    }

    // let surface = makeSurface(WIDTH, 128, vec3.fromValues(0, 0, -0.5), surfaceShader);
    // surface.material.texture = floorTexture;
    // scene.addSceneObject(surface);

    let numMeshes = 5;

    // If numMeshes = 5, this makes it go from -2 to 2 instead of 0 to 4
    let firstMeshOffset = ((numMeshes - 1) / 2);

    let chunks = [];

    for(let x = 0; x < numMeshes; x++) {
        chunks.push([]);
        for(let y = 0; y < numMeshes; y++) {
            // chunks[x].push(undefined);
            // console.log("Initial: ", (x - firstMeshOffset) * WIDTH, (y - firstMeshOffset) * WIDTH);
            chunks[x].push(new Chunk(
                makeSurface((x - firstMeshOffset) * WIDTH, (y - firstMeshOffset) * WIDTH, surfaceShader, mossTexture)),
                // makeObjects((x - firstMeshOffset) * WIDTH, (y - firstMeshOffset) * WIDTH)
                );
            // if(chunks[x][y] == undefined) {
            //     console.log("undefined!");
            // }
        }
    }

    scene.meshObjects.push(makeWater(0, 0, waterShader));

    let textures = [];
    textures.push(queue.getResult("skyPosX", false));
    textures.push(queue.getResult("skyNegX", false));
    textures.push(queue.getResult("skyNegY", false)); // Switched order
    textures.push(queue.getResult("skyPosY", false));
    textures.push(queue.getResult("skyPosZ", false));
    textures.push(queue.getResult("skyNegZ", false));

    let cubeMapTexture = createCubeMapTexture(gl, textures);

    let skyboxMesh = makeBox(
        vec3.create(),
        vec3.create(),
        1,
        skyboxShader,
        vec3.fromValues(-Math.PI / 2.0, 0.0, 0.0)
    );

    centerCoord = Math.floor(numMeshes / 2.0);
    let surfaceCenter = [chunks[centerCoord][centerCoord].surface.transform.position[0], chunks[centerCoord][centerCoord].surface.transform.position[1]];

    // STOP ADDING STUFF TO THE SCENE

    // setup time stuff
    let lastTime = jQuery.now();
    let deltaTime = 0;

    function updateWebGl() {
        // Update time
        deltaTime = jQuery.now() - lastTime;
        lastTime = jQuery.now();

        // If the current position is out of the following bounds
        let xNegBound = scene.camera.transform.position[0] - surfaceCenter[0] < -WIDTH / 2;
        let xPosBound = scene.camera.transform.position[0] - surfaceCenter[0] > WIDTH / 2;

        let yNegBound = scene.camera.transform.position[1] - surfaceCenter[1] < -WIDTH / 2;
        let yPosBound = scene.camera.transform.position[1] - surfaceCenter[1] > WIDTH / 2;

        let newCenter = [surfaceCenter[0], surfaceCenter[1]];

        if(xNegBound) {
            newCenter[0] -= WIDTH;
        } else if(xPosBound) {
            newCenter[0] += WIDTH;
        }
        if(yNegBound) {
            newCenter[1] -= WIDTH;
        } else if(yPosBound) {
            newCenter[1] += WIDTH;
        }

        let updateSurfaces = false;

        // As the camera moves in a direction, shift everything in the other
        // direction. For example, as it moves forward, shift everything back

        // Spaces that must be created will be out of bounds, which will result in them
        // being undefined. They will have to be recalculated
        if(newCenter[0] < surfaceCenter[0]) {
            for(let x = numMeshes - 1; x >= 0; x--) { // Iterate down so x - 1 isn't already edited
                for(let y = 0; y < numMeshes; y++) {
                    // Have to manually assign undefined, because chunks[x - 1]
                    // is undefined and therefore has no property [y]
                    chunks[x][y] = (x - 1 < 0 ? undefined : chunks[x - 1][y]);
                }
            }
            updateSurfaces = true;
        } else if(newCenter[0] > surfaceCenter[0]) {
            for(let x = 0; x < numMeshes; x++) {
                for(let y = 0; y < numMeshes; y++) {
                    // Have to manually assign undefined, because chunks[x + 1]
                    // is undefined and therefore has no property [y]
                    chunks[x][y] = (x + 1 >= numMeshes ? undefined : chunks[x + 1][y]);
                }
            }
            updateSurfaces = true;
        }

        if(newCenter[1] < surfaceCenter[1]) {
            for(let x = 0; x < numMeshes; x++) {
                for(let y = numMeshes - 1; y >= 0; y--) { // Iterate down so y - 1 isn't already edited
                    chunks[x][y] = (y - 1 < 0 ? undefined : chunks[x][y - 1]);
                }
            }
            updateSurfaces = true;
        } else if(newCenter[1] > surfaceCenter[1]) {
            for(let x = 0; x < numMeshes; x++) {
                for(let y = 0; y < numMeshes; y++) {
                    chunks[x][y] = (y + 1 >= numMeshes ? undefined : chunks[x][y + 1]);
                }
            }
            updateSurfaces = true;
        }

        // Make new chunks for each space that is undefined
        if(updateSurfaces) {
            surfaceCenter = newCenter;

            // console.log(scene.camera.transform.position);
            for(let x = 0; x < numMeshes; x++) {
                for(let y = 0; y < numMeshes; y++) {
                    if(chunks[x][y] === undefined) {
                        chunks[x][y] = new Chunk(
                            makeSurface(
                            surfaceCenter[0] + ((x - firstMeshOffset) * WIDTH),
                            surfaceCenter[1] + ((y - firstMeshOffset) * WIDTH),
                            surfaceShader)
                        );
                    }
                }
            }
        }

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

        let drawMesh = function(mesh, shader = undefined) {
            if(shader == undefined) shader = mesh.material.shader;
            let program = shader.program;

            shader.use(gl);

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

                gl.uniform3f(gl.getUniformLocation(program, "ambientLight"), ambientLight[0], ambientLight[1], ambientLight[2]);
                gl.uniform3f(gl.getUniformLocation(program, "dirLightDirection"), dirLightDirection[0], dirLightDirection[1], dirLightDirection[2]);
                gl.uniform3f(gl.getUniformLocation(program, "dirLightColor"), dirLightColor[0], dirLightColor[1], dirLightColor[2]);

                gl.uniform3f(gl.getUniformLocation(program, "camPos"), scene.camera.transform.position[0], scene.camera.transform.position[1], scene.camera.transform.position[2]);

                // gl.uniform3f(gl.getUniformLocation(program, "ambientLight"), ambientLight[0], ambientLight[1], ambientLight[2]);
                // gl.uniform3f(gl.getUniformLocation(program, "directionalLightColor"), directionalLightColor[0], directionalLightColor[1], directionalLightColor[2]);
                // gl.uniform3f(gl.getUniformLocation(program, "directionalLightDir"), directionalLightDir[0], directionalLightDir[1], directionalLightDir[2]);

            } else if (shader == waterShader) {

                function updateWaterMVP(gl, program, transform, camera) {
                    let modelMatrix = getModel(transform);

                    let lookPoint = vec3.create();

                    let pos = camera.transform.position; //vec3.fromValues(0.0, 0.0, camera.transform.position[2]);
                    let dir = /* vec3.fromValues(1.0, 0.0, 0.0); */ camera.getCamDir();

                    vec3.add(lookPoint, pos, dir);

                    let viewMatrix = mat4.create();
                    mat4.lookAt(viewMatrix, pos, lookPoint, camera.camUp);

                    let rotateMatrix = mat4.create();

                    // mat4.fromRotation(rotateMatrix, Math.PI, vec3.fromValues(0.0, 0.0, 1.0));

                    // mat4.mul(viewMatrix, rotateMat, viewMatrix);

                    let projectionMatrix = getProjection(camera);
                    let normalMatrix = getNormalMatrix(modelMatrix, mat4.create());

                    let modelLocation = gl.getUniformLocation(program, "model");
                    let viewLocation = gl.getUniformLocation(program, "view");
                    let projectionLocation = gl.getUniformLocation(program, "projection");
                    let normalMatLocation = gl.getUniformLocation(program, "normalMat");

                    let rotateMatLocation = gl.getUniformLocation(program, "rotateMat");

                    // console.log(viewMatrix);

                    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
                    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
                    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
                    gl.uniformMatrix3fv(normalMatLocation, false, normalMatrix);

                    gl.uniformMatrix3fv(rotateMatLocation, false, rotateMatrix);
                }

                updateWaterMVP(gl, program, mesh.transform, scene.camera);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
                gl.uniform1i(gl.getUniformLocation(program, "skyBox"), 0);

                gl.uniform3f(gl.getUniformLocation(program, "camPos"), scene.camera.transform.position[0], scene.camera.transform.position[1], scene.camera.transform.position[2]);

                // gl.uniform3f(gl.getUniformLocation(program, "ambientLight"), ambientLight[0], ambientLight[1], ambientLight[2]);
                // gl.uniform3f(gl.getUniformLocation(program, "directionalLightColor"), directionalLightColor[0], directionalLightColor[1], directionalLightColor[2]);
                // gl.uniform3f(gl.getUniformLocation(program, "directionalLightDir"), directionalLightDir[0], directionalLightDir[1], directionalLightDir[2]);

            } else if(shader == skyboxShader) {
                function updateSkyboxMVP(gl, program, transform, camera) {
                    let modelMatrix = getModel(transform);

                    let viewMatrix = mat4.create();
                    mat4.lookAt(viewMatrix, vec3.create(), camera.getCamDir(), camera.camUp);

                    let projectionMatrix = getProjection(camera);
                    // let normalMatrix = getNormalMatrix(modelMatrix, viewMatrix);

                    let modelLocation = gl.getUniformLocation(program, "model");
                    let viewLocation = gl.getUniformLocation(program, "view");
                    let projectionLocation = gl.getUniformLocation(program, "projection");
                    // let normalMatLocation = gl.getUniformLocation(program, "normalMat");

                    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
                    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
                    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
                    // gl.uniformMatrix3fv(normalMatLocation, false, normalMatrix);
                }

                updateSkyboxMVP(gl, program, mesh.transform, scene.camera);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
                gl.uniform1i(gl.getUniformLocation(program, "skyBox"), 0);

            } else if(shader == lightShader) {
                updateMVP(gl, program, mesh.transform, scene.camera);

                gl.uniform3fv(gl.getUniformLocation(program, "lightColor"), mesh.material.color);
            }
            // } else if(shader == objShader) {

            //     gl.uniform3fv(gl.getUniformLocation(program, "lightColor"), mesh.material.color);
            // }

            draw(gl, program, shape, () => {});
        }

        // Draw skybox before depth testing
        gl.clearDepth(1.0);
        gl.clearColor(0.3, 0.7, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);

        drawMesh(skyboxMesh, skyboxShader);

        // skyboxShader.use(gl);

        // let shape = createShape(gl, skyboxMesh.geometry);

        // updateMVP(gl, skyboxShader.program, skyboxMesh.transform, scene.camera);

        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
        // gl.uniform1i(gl.getUniformLocation(skyboxShader.program, "skyBox"), 0);

        // drawMesh(gl, skyboxShader.program, shape, () => {});

        // Because the project uses coordinate system with Z going up/down
        // let skyBoxModel = mat4.create();
        // let rotationAxis = vec3.fromValues(1.0, 0.0, 0.0);
        // mat4.fromRotation(skyBoxModel, -Math.PI / 2.0, rotationAxis);
        //
        // let skyBoxView = mat4.create();
        // let skyBoxEye = vec3.fromValues(0.0, 0.0, 0.0);
        // mat4.lookAt(skyBoxView, skyBoxEye, scene.camera.transform.position, scene.camera.defaultCamDir);
        //
        // let skyBoxProj = getProjection(fov, aspectRatio, near, far);
        //
        // drawBox(box, cubeMap, skyBoxProj, skyBoxView, skyBoxModel);

        gl.enable(gl.DEPTH_TEST);

        // draw all scene objects
        // TODO: Don't assume a single texture for each object, don't assume it's stored in a letiable called "texture1"
        // TODO: Don't assume the same program for every mesh, use program defined by mesh material

        // if (gl.getUniformLocation(program, "texture1") != null) {
        for (let x = 0; x < numMeshes; x++) {
            for (let y = 0; y < numMeshes; y++) {
                drawMesh(chunks[x][y].surface);
            }
        }
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
