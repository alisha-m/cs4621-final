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

// New Functions
function getNormal(vert1, vert2, vert3) {
    var a = vec3.create(), b = vec3.create(), normal = vec3.create();

    vec3.subtract(a, vert1, vert2);
    vec3.subtract(b, vert1, vert3);
    vec3.cross(normal, a, b);
    vec3.normalize(normal, normal);
    return normal;
}

function getHeight(x, y) {
    return 10 * noise.simplex2(x / 100, y / 100) + 2.0 * noise.simplex2(x / 10, y / 10);
}

function makeSurface(width, numDivisions, center) {
    // var space = width / numDivisions;

    // var geom = new Geometry();

    // geom.uvs.push(vec2.fromValues(0.0, 0.0)); // bottom left
    // geom.uvs.push(vec2.fromValues(1.0, 0.0)); // bottom right
    // geom.uvs.push(vec2.fromValues(1.0, 1.0)); // top right
    // geom.uvs.push(vec2.fromValues(0.0, 1.0)); // top left

    // for(var x = 0; x < numDivisions; x++) {
    //     for(var y = 0; y < numDivisions; y++) {

    //         var xCoord = center.x + (x * space);
    //         var yCoord = center.y + (y * space);
    //         geom.vertices.push(vec3.fromValues(xCoord, yCoord, getHeight(x, y)));

    //         if(x != 0 && y != 0) {
    //             var bottomLeft = (x - 1) * numDivisions + (y - 1);
    //             var bottomRight = x * numDivisions + (y - 1);
    //             var topRight = x * numDivisions + y;
    //             var topLeft = (x - 1) * numDivisions + y;

    //             var firstNormal = 2 * ((x - 1) * numDivisions + (y - 1));
    //             var secondNormal = firstNormal + 1;

    //             geom.normals.push(getNormal(geom.vertices[bottomLeft],
    //                                         geom.vertices[bottomRight],
    //                                         geom.vertices[topRight]));
    //             geom.normals.push(getNormal(geom.vertices[bottomLeft],
    //                                         geom.vertices[topRight],
    //                                         geom.vertices[topLeft]));

    //             var lowerFace = new Face();
    //             lowerFace.setVertex(0, bottomLeft, 0, firstNormal);
    //             lowerFace.setVertex(1, bottomRight, 1, firstNormal);
    //             lowerFace.setVertex(2, topRight, 2, firstNormal);
    //             geom.faces.push(lowerFace);

    //             var upperFace = new Face();
    //             upperFace.setVertex(0, bottomLeft, 0, secondNormal);
    //             upperFace.setVertex(1, topRight, 2, secondNormal);
    //             upperFace.setVertex(2, topLeft, 3, secondNormal);
    //             geom.faces.push(upperFace);

    //             // vertexData.push(getNormal(vertices[i0], vertices[i1], vertices[i2]),
    //                             // getNormal(vertices[i0], vertices[i2], vertices[i3]));
    //             // indexData.push(i0, i1, i2,
    //                         //    i0, i2, i3);

    //             // normals.push(getNormal(vertices[i0], vertices[i1], vertices[i2]));
    //             // faces.push(makeFace(i0, i1, i2, 2 * (x * numDivisions + y)));

    //             // normals.push(getNormal(vertices[i0], vertices[i2], vertices[i3]));
    //             // faces.push(makeFace(i0, i2, i3, 2 * (x * numDivisions + y) + 1));
    //         }
    //     }
    // }

    // // Create material
    // let mat = new Material("vertexShader", "fragmentShader");

    // // Create transform:
    // let transform = new Transform(center, 0.0, vec3.fromValues(width, width, 1));

    // // Create mesh object
    // let mesh = new MeshObject("Surface", transform, geom, mat);

    // return mesh;

    let space = width / numDivisions;

    let geom = new Geometry();

    // Each point has an array of vec3's, where the vectors are the different
    // normals of all of the adjacent faces. These are averaged together to make
    // the smooth normal for that point
    let facetedNormals = [];

    for(let x = 0; x < numDivisions; x++) {
        facetedNormals.push([]);
        for(let y = 0; y < numDivisions; y++) {

            let xCoord = -(width / 2) + (x * space);
            let yCoord = -(width / 2) + (y * space);

            // console.log(xCoord, yCoord);

            geom.vertices.push(vec3.fromValues(xCoord, yCoord, getHeight(x, y)));
            // geom.normals.push(vec3.fromValues(0.0, 0.0, 1.0));
            geom.uvs.push(vec2.fromValues(x % 2, y % 2));
            facetedNormals[x].push([]);
            
            if(x != 0 && y != 0) {
                let bottomLeft = (x - 1) * numDivisions + (y - 1);
                let bottomRight = x * numDivisions + (y - 1);
                let topRight = x * numDivisions + y;
                let topLeft = (x - 1) * numDivisions + y;

                let normal1 = getNormal(geom.vertices[bottomLeft], geom.vertices[bottomRight], geom.vertices[topRight]);
                let normal2 = getNormal(geom.vertices[bottomLeft], geom.vertices[topRight], geom.vertices[topLeft]);

                // bottom left, bottom right, and top right have normal1
                facetedNormals[x - 1][y - 1].push(normal1); // Bottom left
                facetedNormals[x][y - 1].push(normal1); // Bottom right
                facetedNormals[x][y].push(normal1); // Top right

                // bottom left, top right, and top left have normal2
                facetedNormals[x - 1][y - 1].push(normal2); // Bottom left
                facetedNormals[x][y].push(normal2); // Top right
                facetedNormals[x - 1][y].push(normal2); // Top left

                // console.log(bottomLeft, bottomRight, topRight);
                // console.log(geom.vertices[bottomLeft], geom.vertices[bottomRight], geom.vertices[topRight]);
                // console.log(bottomLeft, topRight, topLeft);
                // console.log(geom.vertices[bottomLeft], geom.vertices[topRight], geom.vertices[topLeft]);

                geom.faces.push(new Face(bottomLeft, bottomRight, topRight));
                geom.faces.push(new Face(bottomLeft, topRight, topLeft));
            }
        }
    }

    // Average the faceted normals and add them, for each point
    for(let x = 0; x < numDivisions; x++) {
        for(let y = 0; y < numDivisions; y++) {
            let normal = vec3.create();

            // Calculate the average
            for(let i = 0; i < facetedNormals[x][y].length; i++) {
                vec3.add(normal, normal, facetedNormals[x][y][i]);
            }
            vec3.scale(normal, normal, 1 / facetedNormals[x][y].length);

            geom.normals.push(normal);
        }
    }

    // Create material
    let mat = new Material("vertexShader", "fragmentShader");

    // Create transform:
    let transform = new Transform(center, vec3.fromValues(0, 0, 0), vec3.fromValues(width, width, 1));

    // Create mesh object
    let mesh = new MeshObject("Surface", transform, geom, mat);

    return mesh;
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
    console.log(quadGeom.vertices[0], quadGeom.vertices[1], quadGeom.vertices[2]);
    let topFace = new Face(0, 2, 3);
    console.log(quadGeom.vertices[0], quadGeom.vertices[2], quadGeom.vertices[3]);
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
    shape.stride = 4 * (3 + 3 + 2);
    shape.positionOffset = 4 * 0;
    shape.normalOffset = 4 * 3;
    shape.texCoordOffset = 4 * (3 + 3);
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

function storeLocations(gl, program) {
    program.vert_position = gl.getAttribLocation(program, "vert_position");
    program.vert_texCoord = gl.getAttribLocation(program, "vert_texCoord");
    program.model = gl.getUniformLocation(program, "model");
    program.view = gl.getUniformLocation(program, "view");
    program.projection = gl.getUniformLocation(program, "projection");
    program.normalMat = gl.getUniformLocation(program, "normalMat");
}

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
    var program = createGlslProgram(gl, "vertexShader", "fragmentShader");

    storeLocations(gl, program);

    //Sky Box stuff
    var box = createBox(gl, 100, 100);
    var textures = [];
    textures.push(queue.getResult("skyPosX", false));
    textures.push(queue.getResult("skyNegX", false));
    textures.push(queue.getResult("skyPosZ", false));
    textures.push(queue.getResult("skyNegZ", false));
    textures.push(queue.getResult("skyNegY", false)); // Switched order
    textures.push(queue.getResult("skyPosY", false));

    var cubeMap = createCubeMapTexture(gl, textures);
    var skyBoxProgram = createGlslProgram(gl, "vertexShaderSkyBox", "fragmentShaderSkyBox");
    skyBoxProgram.texture = gl.getUniformLocation(skyBoxProgram, "texture");
    skyBoxProgram.vert_position = gl.getAttribLocation(skyBoxProgram, "vert_position");
    skyBoxProgram.xform_projMat = gl.getUniformLocation(skyBoxProgram, "xform_projMat");
    skyBoxProgram.xform_viewMat = gl.getUniformLocation(skyBoxProgram, "xform_viewMat");
    skyBoxProgram.xform_modelMat = gl.getUniformLocation(skyBoxProgram, "xform_modelMat");
    skyBoxProgram.vert_position = gl.getAttribLocation(skyBoxProgram, "vert_position");

    skyBoxProgram.draw = function (gl, shape, initialize) {
        gl.useProgram(skyBoxProgram);

        initialize();

        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.enableVertexAttribArray(skyBoxProgram.vert_position);
        gl.vertexAttribPointer(skyBoxProgram.vert_position, 3, gl.FLOAT, false, shape.stride, shape.positionOffset);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        gl.drawElements(gl.TRIANGLES, shape.size, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // gl.useProgram(null);
    };

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
    let surface = makeSurface(10, 100, vec3.fromValues(0, 0, -0.5));

    // quad.material.texture = floorTexture;
    // scene.addSceneObject(quad);

    surface.material.texture = floorTexture;
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
                let shape = createShape(gl, mesh.geometry);

                scene.camera.landHeight = getHeight(scene.camera.transform.position[0], scene.camera.transform.position[1]);
                updateMVP(
                    gl, program,
                    mesh.transform,
                    scene.camera
                );

                draw(gl, program, shape, () => {});
            }
        }

        requestAnimationFrame(updateWebGl);
    }

    requestAnimationFrame(updateWebGl);
}

startWebGL();

window.addEventListener("keydown", function (event) {
  let speed = 0.1;
  let currentPos = scene.camera.transform.position;
  let moveAmount = vec3.create();

  if (event.which == 87 || event.which == 38) { //w or up arrow, move forward
    vec3.scale(moveAmount, scene.camera.defaultCamDir, speed);
    vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
  }

if (event.which == 83 || event.which == 40) { //s or down arrow, move backwards
  vec3.scale(moveAmount, scene.camera.defaultCamDir, speed);
  vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
}
if (event.which == 65 || event.which == 37) { //a or left arrow, move left
  let dir = vec3.create();
  vec3.copy(dir,scene.camera.defaultCamDir);
  vec3.cross(dir, dir, scene.camera.camUp);
  vec3.scale(moveAmount, dir, speed);
//   vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
}
if (event.which == 68 || event.which == 39) { //d or right arrow, move right
  let dir = vec3.create();
  vec3.copy(dir,scene.camera.defaultCamDir);
  vec3.cross(dir, dir, scene.camera.camUp);
  vec3.scale(moveAmount, dir, speed);
//   vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
}
},false);
