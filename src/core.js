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
    if(hasOtherCoords) shape.numOtherCoords = 1;

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
    gl.useProgram(program);

    // Step 1: Activate texture unit associated with this texture
    gl.activeTexture(activeTexture);
    // Step 2: Bind the texture you want to use:
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Step 3: Set the texture uniform to the "index" of the texture unit you just activated
    let textureLocation = gl.getUniformLocation(program, "texture1");
    gl.uniform1i(textureLocation, textureIdx);

    gl.useProgram(null);
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

    gl.uniform1i(numLightsLocation, numLights);
    gl.uniform3fv(lightColorsLocation, lightColors);
    gl.uniform3fv(lightPositionsLocation, lightPositions);

    gl.uniform3f(ambientLightLocation, ambientLight[0], ambientLight[1], ambientLight[2]);
}

function lerpf(a, b, t) {
    return a + (b -a) * t;
}

function doCubeMarchingStuff(shader, texture) {
    let material = new Material(shader);
    material.setTexture(texture, 1);

    let cubeMarcher = new MarchingCubes(material);

    for (let i = 0; i < cubeMarcher.chunkMeshes.length; i++) {
        let mesh = cubeMarcher.chunkMeshes[i];
        scene.addSceneObject(mesh);
    }
}

// Give camera default values for now
let camTransform = new Transform(
    vec3.fromValues(0, 0, Math.max(getHeight(0.0, 0.0), 0.0) + 0.5),
    vec3.create(),
    vec3.fromValues(1, 1, 1)
);
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

function logMouse (event) {
  if (toggle) {
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
let counter = 0;

let mouseisDown = false;

// Start and Run WebGL
function startWebGL() {
    noise.seed(0);

    // get all images
    let queue = new createjs.LoadQueue(true);
    queue.loadFile({ id: "floor", src: "data/floor.jpg", type: "image" });
    queue.loadFile({ id: "wall", src: "data/wall.jpg", type: "image" });

    queue.loadFile({ id: "moss", src: "data/moss.jpg", type: "image" });

    let path = "data/night-sky/";

    queue.loadFile({ id: "skyPosX", src: (path + "corona_ft.png"), type: "image" });
    queue.loadFile({ id: "skyNegX", src: (path + "corona_bk.png"), type: "image" });
    queue.loadFile({ id: "skyPosY", src: (path + "corona_up.png"), type: "image" });
    queue.loadFile({ id: "skyNegY", src: (path + "corona_dn.png"), type: "image" });
    queue.loadFile({ id: "skyPosZ", src: (path + "corona_rt.png"), type: "image" });
    queue.loadFile({ id: "skyNegZ", src: (path + "corona_lf.png"), type: "image" });

    queue.on("complete", function () {
        scene.images.floorImage = queue.getResult("floor");
        scene.images.wallImage = queue.getResult("wall");
        scene.images.mossImage = queue.getResult("moss");
        $.ajax({
            url: "data/objects/mushroom.obj",
            dataType: 'text'
        }).done(function(data) {
            var res = makeGeom(data);
            //console.log(res);
            runWebGL(queue, res);
        }).fail(function() {
            alert('Failed to retrieve [' + filename + "]");
        });
        
    }, this);
}

function runWebGL(queue, geom) {
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
    
    let noTexShader = new Shader(
        gl,
        "noTexVertexShader",
        "noTexFragmentShader"
    );
    
    let floorImage = scene.images.floorImage;
    let mossImage = scene.images.mossImage;
    let floorTexture = loadTexture(gl, floorImage, gl.TEXTURE0);

    let mossTexture = loadTexture(gl, mossImage, gl.TEXTURE1);

    // make camera and add it to the scene
    let fov = Math.PI / 4;
    let aspectRatio = canvas.width / canvas.height;
    let near = 0.1;
    let far = 100;

    // ADD STUFF TO SCENE

    let ambientLight = vec3.fromValues(0.4, 0.4, 0.4);
    let dirLightDirection = vec3.fromValues(0.5, 1.0, 0.5);
    let dirLightColor = vec3.fromValues(0.4, 0.4, 0.4);

    // BEGIN CUBE MARCHING
    doCubeMarchingStuff(surfaceShader, mossTexture);
    // END CUBE MARCHING

    let numMeshes = 5;

    // If numMeshes = 5, this makes it go from -2 to 2 instead of 0 to 4
    let firstMeshOffset = ((numMeshes - 1) / 2);

    let chunks = [];

    // let surfaceCenter = [0, 0];
    // console.log(surfaceCenter);

    for(let x = 0; x < numMeshes; x++) {
        chunks.push([]);
        for(let y = 0; y < numMeshes; y++) {
            chunks[x].push(new Chunk(
                makeSurface((x - firstMeshOffset) * WIDTH, (y - firstMeshOffset) * WIDTH, surfaceShader, mossTexture),
                makeObjects(
                    WIDTH,
                    [(x - firstMeshOffset) * WIDTH, (y - firstMeshOffset) * WIDTH],
                    geom,
                    noTexShader))
            );
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
    // surfaceCenter = [chunks[centerCoord][centerCoord].transform.position[0], chunks[centerCoord][centerCoord].transform.position[1]];

    console.log(surfaceCenter);

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

            for(let x = 0; x < numMeshes; x++) {
                for(let y = 0; y < numMeshes; y++) {
                    if(chunks[x][y] === undefined) {
                        chunks[x][y] = new Chunk(
                            makeSurface(
                                surfaceCenter[0] + ((x - firstMeshOffset) * WIDTH),
                                surfaceCenter[1] + ((y - firstMeshOffset) * WIDTH),
                                surfaceShader,
                                mossTexture),
                            makeObjects(
                                WIDTH,
                                [surfaceCenter[0] + ((x - firstMeshOffset) * WIDTH), surfaceCenter[1] + ((y - firstMeshOffset) * WIDTH)],
                                geom,
                                noTexShader)
                        );
                    }
                }
            }
        }

        // Set up lights
        let numLights = 0;

        let lightColors = [];
        let lightPositions = [];

        function makeLight(colorR, colorG, colorB, posX, posY, posZ) {
            numLights++;
            lightColors.push(colorR, colorG, colorB);
            lightPositions.push(posX, posY, posZ)
        }

        for(let x = 0; x < chunks.length; x++) {
            for(let y = 0; y < chunks[x].length; y++) {
                for(let i = 0; i < chunks[x][y].objects.length; i++) {
                    let obj = chunks[x][y].objects[i];
                    let power = 80 * obj.transform.localScale[0];
                    makeLight(
                        power * obj.material.color[0],
                        power * obj.material.color[1],
                        power * obj.material.color[2],
                        obj.transform.position[0],
                        obj.transform.position[1],
                        obj.transform.position[2],
                    );
                }
            }
        }

        let drawMesh = function(mesh, shader = undefined) {
            if(shader == undefined) shader = mesh.material.shader;
            let program = shader.program;

            if (mesh.material.textureIdx > -1) {
                setupTexture(gl, program, mesh.material.texture, mesh.material.textureIdx + gl.TEXTURE0, mesh.material.textureIdx);
            }

            let shape = createShape(gl, mesh.geometry);

            scene.camera.landHeight = 0.0;

            gl.useProgram(shader.program);

            if(shader == surfaceShader) {
                updateMVP(gl, program, mesh.transform, scene.camera);

                gl.uniform1i(gl.getUniformLocation(program, "numLights"), numLights);
                gl.uniform3fv(gl.getUniformLocation(program, "lightColors"), lightColors);
                gl.uniform3fv(gl.getUniformLocation(program, "lightPositions"), lightPositions);

                gl.uniform3f(gl.getUniformLocation(program, "ambientLight"), ambientLight[0], ambientLight[1], ambientLight[2]);
                gl.uniform3f(gl.getUniformLocation(program, "dirLightDirection"), dirLightDirection[0], dirLightDirection[1], dirLightDirection[2]);
                gl.uniform3f(gl.getUniformLocation(program, "dirLightColor"), dirLightColor[0], dirLightColor[1], dirLightColor[2]);

                gl.uniform3f(gl.getUniformLocation(program, "camPos"), scene.camera.transform.position[0], scene.camera.transform.position[1], scene.camera.transform.position[2]);

            } else if (shader == waterShader) {

                function updateWaterMVP(gl, program, transform, camera) {
                    let transformNew = new Transform(
                        vec3.fromValues(camera.transform.position[0], camera.transform.position[1], 0.0),
                        transform.rotation, 
                        transform.localScale);

                    let modelMatrix = getModel(transformNew);
                    let viewMatrix = getView(camera);
                    let projectionMatrix = getProjection(camera);
                    let normalMatrix = getNormalMatrix(modelMatrix, mat4.create());

                    let modelLocation = gl.getUniformLocation(program, "model");
                    let viewLocation = gl.getUniformLocation(program, "view");
                    let projectionLocation = gl.getUniformLocation(program, "projection");
                    let normalMatLocation = gl.getUniformLocation(program, "normalMat");

                    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
                    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
                    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
                    gl.uniformMatrix3fv(normalMatLocation, false, normalMatrix);
                }

                updateWaterMVP(gl, program, mesh.transform, scene.camera);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
                gl.uniform1i(gl.getUniformLocation(program, "skyBox"), 0);

                gl.uniform3f(gl.getUniformLocation(program, "camPos"), scene.camera.transform.position[0], scene.camera.transform.position[1], scene.camera.transform.position[2]);

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

            } else if (shader == noTexShader) {
                updateMVP(gl, program, mesh.transform, scene.camera);

                // gl.uniform1i(gl.getUniformLocation(program, "numLights"), 0);
                // gl.uniform3fv(gl.getUniformLocation(program, "lightColors"), []);
                // gl.uniform3fv(gl.getUniformLocation(program, "lightPositions"), []);

                gl.uniform3f(gl.getUniformLocation(program, "ambientLight"), ambientLight[0], ambientLight[1], ambientLight[2]);
                gl.uniform3f(gl.getUniformLocation(program, "dirLightDirection"), dirLightDirection[0], dirLightDirection[1], dirLightDirection[2]);
                gl.uniform3f(gl.getUniformLocation(program, "dirLightColor"), dirLightColor[0], dirLightColor[1], dirLightColor[2]);

                gl.uniform3fv(gl.getUniformLocation(program, "surfaceColor"), mesh.material.color);
            }

            draw(gl, program, shape, () => {});
        }

        // Draw skybox before depth testing
        gl.clearDepth(1.0);
        gl.clearColor(0.3, 0.7, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);

        drawMesh(skyboxMesh, skyboxShader);

        gl.enable(gl.DEPTH_TEST);

        for (let x = 0; x < numMeshes; x++) {
            for (let y = 0; y < numMeshes; y++) {
                drawMesh(chunks[x][y].surface);

                for(let k = 0; k < chunks[x][y].objects.length; k++) {
                    drawMesh(chunks[x][y].objects[k]);
                }
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