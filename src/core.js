var canvas = document.getElementById("webglCanvas");
var mazeChanged = false;

$("#fovSpinner").spinner({
    min: 10.0,
    max: 80.0,
    step: 0.1
});
$("#eyeHeightSpinner").spinner({
    min: 0.1,
    max: 1.0,
    step:0.01
});

function getFov() {
    return $("#fovSpinner").spinner("value") * Math.PI / 180.0;
}

function getEyeHeight() {
    return $("#eyeHeightSpinner").spinner("value");
}

function getMazeStrings() {
    return $("#mazeTextArea").val().trim().split(/\s/);
}

function createMazeFromStrings(strings) {
    var sizeY = strings.length;
    var sizeX = strings[0].length;

    var x, y;
    for(y=0;y<sizeY;y++) {
        if (strings[y].length != sizeX) {
            throw new Error("Mesh is not a rectangle!");
        }
    }

    var data = [];
    for (x = 0; x < sizeX; x++) {
        var a = [];
        for (y = 0; y < sizeY; y++) {
            a.push(null);
        }
        data.push(a);
    }

    var startPosition = null;
    var startHeading = null;
    for (x = 0; x < sizeX; x++) {
        for (y = 0; y < sizeY; y++) {
            var c = strings[sizeY - y - 1][x];
            if (c == "#") {
                data[x][y] = 1;
            } else {
                data[x][y] = 0;
            }

            if (c == "N" || c == "E" || c == "W" || c == "S") {
                if (startPosition == null) {
                    if (c == "N") {
                        startHeading = Math.PI / 2;
                    } else if (c == "E") {
                        startHeading = 0.0;
                    } else if (c == "W") {
                        startHeading = Math.PI;
                    } else if (c == "S") {
                        startHeading = 3 * Math.PI / 2;
                    }
                    startPosition = [x, y];
                } else {
                    throw new Error("There are more than one starting point!");
                }
            }
        }
    }

    if (startPosition == null) {
        throw new Error("There is no starting point!");
    }

    for(x=0;x<sizeX;x++) {
        if (data[x][0] != 1) {
            throw new Error("Boundary is not complete!");
        }
        if (data[x][sizeY-1] != 1) {
            throw new Error("Boundary is not complete!");
        }
    }
    for(y=0;y<sizeY;y++) {
        if (data[0][y] != 1) {
            throw new Error("Boundary is not complete!");
        }
        if (data[sizeX-1][y] != 1) {
            throw new Error("Boundary is not complete!");
        }
    }

    return {
        sizeX: sizeX,
        sizeY: sizeY,
        data: data,
        startHeading: startHeading,
        startPosition: startPosition
    };
}

function mazeToWorld(mazePos) {
    return vec3.fromValues(mazePos[0] + 0.5, mazePos[1] + 0.5, getEyeHeight());
}

function worldToMaze(worldPos) {
    return vec2.fromValues(Math.floor(worldPos[0]), Math.floor(worldPos[1]));
}

var maze = null;
var targetPos = null;
var targetHeading = 0;
function updateMaze() {
    maze = createMazeFromStrings(getMazeStrings());
    targetPos = mazeToWorld(maze.startPosition);
    targetHeading = maze.startHeading;
    return constructMaze();
}

// construct the 3D meshes of the maze
function constructMaze() {
    let wallMeshes = [];
    let floorMeshes = [];

    let width = 1;
    let height = 1;

    // rotations to get floor to wall orientation
    let leftRotation = vec3.fromValues(0, Math.PI / 2, 0);
    let rightRotation = vec3.fromValues(0, -Math.PI / 2, 0);
    let topRotation = vec3.fromValues(-Math.PI / 2, 0, 0);
    let bottomRotation = vec3.fromValues(Math.PI / 2, 0,  0);

    // floor rotation is just not rotating at all
    let floorRotation = vec3.fromValues(0, 0, 0);

    for (let i = 0; i < maze.sizeX; i++) {
        for (let j = 0; j < maze.sizeY; j++) {
            let isWall = maze.data[i][j] == 1;
            
            let left = i;
            let right = i + 1;
            let top = j + 1;
            let bottom = j;

            let centerX = i + 0.5;
            let centerY = j + 0.5;

            let floorZ = 0;
            let wallZ = 0.5;

            if (isWall) {
                // construct wall tile(s) here
                // contstruct a wall in every direction that has a free tile in it
                let drawLeft = i != 0 && maze.data[i-1][j] == 0;
                let drawRight = i != maze.sizeX - 1 && maze.data[i+1][j] == 0;
                let drawBottom = j != 0 && maze.data[i][j-1] == 0;
                let drawTop = j != maze.sizeY - 1 && maze.data[i][j+1] == 0;

                if (drawLeft) {
                    let leftWallCenter = vec3.fromValues(left, centerY, wallZ); 
                    let leftWallShapeData = getQuadMesh(leftWallCenter, leftRotation, width, height);
                    wallMeshes.push(leftWallShapeData);
                }
                if (drawRight) {
                    let rightWallCenter = vec3.fromValues(right, centerY, wallZ);
                    let rightWallShapeData = getQuadMesh(rightWallCenter, rightRotation, width, height);
                    wallMeshes.push(rightWallShapeData);
                }
                if (drawBottom) {
                    let bottomWallCenter = vec3.fromValues(centerX, bottom, wallZ);
                    let bottomWallShapeData = getQuadMesh(bottomWallCenter, bottomRotation, width, height);
                    wallMeshes.push(bottomWallShapeData);
                }
                if (drawTop) {
                    let topWallCenter = vec3.fromValues(centerX, top, wallZ);
                    let topWallShapeData = getQuadMesh(topWallCenter, topRotation, width, height);
                    wallMeshes.push(topWallShapeData);
                }
            } else {
                let floorCenter = vec3.fromValues(centerX, centerY, floorZ);
                let floorShapeData = getQuadMesh(floorCenter, floorRotation, width, height);
                floorMeshes.push(floorShapeData);
            }
        }
    }

    return {
        wallMeshes: wallMeshes,
        floorMeshes: floorMeshes
    };
}

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

function getQuadMesh(center, rotation, width, height) {
    // Create geometry
    let halfWidth = width/2;
    let halfHeight = height/2;

    let topLeft = vec3.fromValues(-0.5, 0.5, 0);
    let topRight = vec3.fromValues(0.5, 0.5, 0);
    let bottomLeft = vec3.fromValues(-0.5, -0.5, 0);
    let bottomRight = vec3.fromValues(0.5, -0.5, 0);

    let origin = vec3.fromValues(0, 0, 0);

    let quadGeom = new Geometry();
    quadGeom.vertices.push(bottomLeft);
    quadGeom.vertices.push(bottomRight);
    quadGeom.vertices.push(topRight);
    quadGeom.vertices.push(topLeft);

    // TODO: Figure out why uvs are multiplied by 3/2
    quadGeom.uvs.push(vec2.fromValues(0, 0));
    quadGeom.uvs.push(vec2.fromValues(1, 0));
    quadGeom.uvs.push(vec2.fromValues(1, 1));
    quadGeom.uvs.push(vec2.fromValues(0, 1));

    for (let i = 0; i < 4; i++) {
        quadGeom.normals.push(vec3.fromValues(0, 0, 1));
    }

    let bottomFace = new Face(0, 1, 2);
    let topFace = new Face(0, 2, 3);
    quadGeom.faces.push(bottomFace);
    quadGeom.faces.push(topFace);

    // Create material
    let quadMat = new Material("vertexShader", "fragmentShader");

    // Create transform:
    let quadTransform = new Transform(center, rotation, vec3.fromValues(width, height, 1));

    // Create mesh object
    let quadMesh = new MeshObject("Quad", quadTransform, quadGeom, quadMat);

    return quadMesh;
}

function createShape(gl, geometry) {
    let shape = {};

    let vertexData = [];
    let vertexCount = geometry.vertices.length;
    for (let i = 0; i < vertexCount; i++) {
        vertexData.push(geometry.vertices[i][0], geometry.vertices[i][1], geometry.vertices[i][2]);
        vertexData.push(geometry.normals[i][0], geometry.normals[i][1], geometry.normals[i][2]);
        vertexData.push(geometry.uvs[i][0], geometry.uvs[i][1]);
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
    shape.stride = vertexCount * (3 + 3 + 2);
    shape.positionOffset = vertexCount * 0;
    shape.normalOffset = vertexCount * 3;
    shape.texCoordOffset = vertexCount * (3 + 3);
    return shape;
}

function draw(gl, program, shape, initialize) {
    gl.useProgram(program);

    initialize();

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.enableVertexAttribArray(program.vert_position);
    gl.vertexAttribPointer(program.vert_position, 3, gl.FLOAT, false, shape.stride, shape.positionOffset);
    gl.enableVertexAttribArray(program.vert_texCoord);
    gl.vertexAttribPointer(program.vert_texCoord, 2, gl.FLOAT, false, shape.stride, shape.texCoordOffset);
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

function getView(camPos, camDir, camUp) {
    let lookPoint = vec3.create();
    vec3.add(lookPoint, camPos, camDir);

    let viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, camPos, lookPoint, camUp);

    return viewMatrix;
}

function getProjection(fieldOfView, aspectRatio, near, far) {
    let projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, near, far);

    return projectionMatrix;
}

function getMVP(modelMatrix, viewMatrix, projectionMatrix) {
    let mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, mvpMatrix, projectionMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);

    return mvpMatrix;
}

function updateMVP(gl, program, transform, camPos, camDir, camUp, fieldOfView, aspectRatio, near, far) {
    let modelMatrix = getModel(transform);
    let viewMatrix = getView(camPos, camDir, camUp);
    let projectionMatrix = getProjection(fieldOfView, aspectRatio, near, far);

    var mvpMatrix = getMVP(modelMatrix, viewMatrix, projectionMatrix);

    var mvpLocation = gl.getUniformLocation(program, "modelViewProjection");

    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
}

function storeLocations(gl, program) {
    program.vert_position = gl.getAttribLocation(program, "vert_position");
    program.vert_texCoord = gl.getAttribLocation(program, "vert_texCoord");
    program.mvp = gl.getUniformLocation(program, "modelViewProjection");
}

// 0.25 sec = 250 ms
const ANIMATION_DURATION = 250.0;

function getDirection(h){
    return vec3.fromValues(Math.cos(h), Math.sin(h), 0);
}

function lerpf(a, b, t) {
    return a + (b -a) * t;
}

function isWalkable(targetMazePos) {
    if (targetMazePos[0] < 0 || targetMazePos[0] > maze.sizeX 
        || targetMazePos[1] < 0 || targetMazePos[1] > maze.sizeY) {
        
        return false;
    }

    return (maze.data[Math.ceil(targetMazePos[0])][Math.ceil(targetMazePos[1])] != 1);
}

function limitAngle(h){
    while(h < 0){
        h += 2 * Math.PI;
    }
    while(h >= 2 * Math.PI){
        h -= 2 * Math.PI;
    }

    return h;
}

// give camera default values for now
var camTransform = new Transform(vec3.create(), vec3.create(), vec3.fromValues(1, 1, 1));
var camera = new Camera("Maze Camera", camTransform, getFov(), 800/600, 0.1, 100);
var scene = new Scene(camera);

function startWebGL() {
    // create image data structures

    var floorImage = new Image();
    floorImage.crossOrigin = "anonymous";
    floorImage.src = "data/floor.jpg";

    var wallImage = new Image();
    wallImage.crossOrigin = "anonymous";

    wallImage.onload = () => {
        scene.images.floorImage = floorImage;
        scene.images.wallImage = wallImage;


        runWebGL();
    }

    wallImage.src = "data/wall.jpg";
}

var turning = false;
var moving = false;
var timeElapsed = 0;
function runWebGL() {
    var gl = initializeWebGL($("#webglCanvas"));
    var program = createGlslProgram(gl, "vertexShader", "fragmentShader");

    storeLocations(gl, program);

    gl.useProgram(program);

    // Tell WebGL to test hte depth when drawing
    gl.enable(gl.DEPTH_TEST);
    // cull back-facing triangles
    gl.disable(gl.CULL_FACE);

    // setup shaders
    let floorImage = scene.images.floorImage;
    let wallImage = scene.images.wallImage;
    var floorTexture = loadTexture(gl, floorImage, gl.TEXTURE0);
    var wallTexture = loadTexture(gl, wallImage, gl.TEXTURE1);

    // get the vertex datas for the maze
    var mazeMeshes = updateMaze();
    var wallMeshes = mazeMeshes.wallMeshes;
    var floorMeshes = mazeMeshes.floorMeshes;
    
    // make scene objects for walls and floors
    for (let i = 0; i < wallMeshes.length; i++) {
        wallMeshes[i].material.texture = wallTexture;
        scene.addSceneObject(wallMeshes[i]);
    }
    for (let i = 0; i < floorMeshes.length; i++) {
        floorMeshes[i].material.texture = floorTexture;
        scene.addSceneObject(floorMeshes[i]);
    }

    
    // make camera and add it to the scene
    let camPos = vec3.fromValues(maze.startPosition[0] + 0.5, maze.startPosition[1] + 0.5, getEyeHeight());
    let camDir = vec3.fromValues(1, 0, 0);
    vec3.rotateZ(camDir, camDir, vec3.create(), maze.startHeading);
    let testCamUp = vec3.fromValues(0, 0, 1);

    let fov = getFov();
    let aspectRatio = canvas.width / canvas.height;
    let near = 0.1;
    let far = 100;

    let camTransform = new Transform(mazeToWorld(maze.startPosition), vec3.fromValues(0, maze.startHeading, 0));
    scene.camera = new Camera("Maze Camera", camTransform, fov, aspectRatio, near, far);
    
    // setup time stuff
    var lastTime = jQuery.now();
    var deltaTime = 0;
    function updateWebGl() {
        gl.clearColor(0.53, 0.81, 0.92, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        scene.camera.transform.position[2] = getEyeHeight();

        fov = getFov();

        if (mazeChanged) {
            mazeChanged = false;
            // setup maze again
            meshData = updateMaze();
            wallMeshes = meshData.wallMeshes;
            floorMeshes = meshData.floorMeshes;

            scene.removeAllSceneObjects();

            for (let i = 0; i < wallMeshes.length; i++) {
                wallMeshes[i].material.texture = wallTexture;
                scene.addSceneObject(wallMeshes[i]);
            }
            for (let i = 0; i < floorMeshes.length; i++) {
                floorMeshes[i].material.texture = floorTexture;
                scene.addSceneObject(floorMeshes[i]);
            }

            // put the camera in the default pos
            scene.camera.transform.position = targetPos;
            scene.camera.transform.rotation = vec3.fromValues(0, targetHeading, 0);
        }
        
        // START CAMERA UPDATE STUFF
        deltaTime = jQuery.now() - lastTime;
        lastTime = jQuery.now();

        // update camera heading
        if (turning) {
            timeElapsed += deltaTime;
            if (timeElapsed > ANIMATION_DURATION) {
                turning = false;
                timeElapsed = 0;

                scene.camera.transform.rotation[1] = targetHeading;
            } else {
                scene.camera.transform.rotation[1] = lerpf(scene.camera.transform.rotation[1], targetHeading, timeElapsed / ANIMATION_DURATION);
            }
        }
        // update camera position
        if (moving) {
            timeElapsed += deltaTime;
            if (timeElapsed > ANIMATION_DURATION) {
                moving = false;
                timeElapsed = 0;

                scene.camera.transform.position = targetPos;
            } else {
                // vec3.lerp(camera.position, camera.position, targetPos, timeElapsed / ANIMATION_DURATION);
                scene.camera.transform.position[0] = lerpf(scene.camera.transform.position[0], targetPos[0], timeElapsed / ANIMATION_DURATION);
                
            }
        }
        // STOP CAMERA UPDATE STUFF

        // draw all scene objects
        // TODO: Don't assume a single texture for each object, don't assume it's stored in a variable called "texture1"
        // TODO: Don't assume the same program for every mesh, use program defined by mesh material
        if (gl.getUniformLocation(program, "texture1") != null) {
            for (let i = 0; i < scene.meshObjects.length; i++) {
                let mesh = scene.meshObjects[i];

                if (mesh.material.textureIdx > -1) {
                    setupTexture(gl, program, mesh.material.texture, mesh.material.textureIdx + gl.TEXTURE0, mesh.material.textureIdx);
                }

                // TODO: Don't assume that you're drawing a quad
                let quad = createShape(gl, mesh.geometry);

                updateMVP(
                    gl, program,
                    mesh.transform,
                    scene.camera.transform.position, getDirection(scene.camera.transform.rotation[1]), testCamUp,
                    fov, aspectRatio, near, far
                );

                draw(gl, program, quad, () => {});
            }
        }

        requestAnimationFrame(updateWebGl);
    }

    requestAnimationFrame(updateWebGl);
}

startWebGL();

// "MAIN" CODE HERE
$("#updateMazeButton").click(() => {
    mazeChanged = true;
});

$("#webglCanvas").keydown(function (event) {
    // TODO: Edit this so that the crawler responds to the arrow keys.
    if(turning) {
        return;
    }

    if (event.which == 37 && !turning && !turning) { //arrow left, turn left
        turning = true;
        targetHeading += Math.PI / 2;
    }
    else if (event.which == 38 && !moving && !turning) { //arrow up, move up
        let currentMazePos = worldToMaze(scene.camera.transform.position);
        let moveAmount = vec2.fromValues(Math.cos(scene.camera.transform.rotation[1]), Math.sin(scene.camera.transform.rotation[1]));        

        let targetMazePos = vec2.fromValues(currentMazePos[0], currentMazePos[1]);
        vec2.add(targetMazePos, targetMazePos, moveAmount);

        if (isWalkable(targetMazePos)) {
            moving = true;
            targetPos = mazeToWorld(targetMazePos);
        }
    }
    else if (event.which == 39 && !turning && !moving){ //arrow right
        turning = true;
        targetHeading -= Math.PI / 2;
    }
    else if (event.which == 40 && !moving && !turning){ //arrow down
        let currentMazePos = worldToMaze(scene.camera.transform.position);
        let moveAmount = vec2.fromValues(Math.cos(scene.camera.transform.rotation[1] + Math.PI), Math.sin(scene.camera.transform.rotation[1] + Math.PI));        

        let targetMazePos = vec2.fromValues(currentMazePos[0], currentMazePos[1]);
        vec2.add(targetMazePos, targetMazePos, moveAmount);

        if (isWalkable(targetMazePos)) {
            moving = true;
            targetPos = mazeToWorld(targetMazePos);
        }
    } 
});
// TODO: Your code here.
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);