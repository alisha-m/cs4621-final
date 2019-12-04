var canavs = document.getElementById("webglCanvas");
var mazeChanged = false;

$("#fovSpinner").spinner({
    min: 10.0,
    max: 80.0,
    step: 0.1
});

$("#eyeHeightSpinner").spinner({
    min: 0.1,
    max: 1.0,
    step: 0.01
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
    return vec2.fomValues(Math.floor(worldPos[0]), Math.floor(worldPos[1]));
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

function getQuadMesh(center, rotation, width, height) {
    let bottomLeft = vec3.fromValues(-0.5, -0.5, 0);
    let bottomRight = vec3.fromValues(0.5, -0.5, 0);
    let topLeft = vec3.fromValues(-0.5, 0.5, 0);
    let topRight = vec3.fromValues(0.5, 0.5, 0);

    let origin = vec3.fromValues(0, 0, 0);

    let quadGeom = new Geometry();
    quadGeom.vertices.push(bottomLeft);
    quadGeom.vertices.push(bottomRight);
    quadGeom.vertices.push(topLeft);
    quadGeom.vertices.push(topRight);

    quadGeom.uvs.push(vec2.fromValues(0, 0));
    quadGeom.uvs.push(vec2.fromValues(1, 0));
    quadGeom.uvs.push(vec2.fromValues(0, 1));
    quadGeom.uvs.push(vec2.fromValues(1, 1));

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

    let quadMesh = new MeshObject("Quad", quadTransform, quadGeom, quadMat);

    return quadMesh;
}

const ANIMATION_DURATION = 250.0;

function getDirection(h) {
    return vec3.fromValues(Math.cos(h), Math.sin(h), 0);
}

function lerpf(a, b, t) {
    return a + (b - a) * t;
}

function isWalkable(targetMazePos) {
    if (targetMazePos[0] < 0 || targetMazePos[0] > maze.sizeX 
        || targetMazePos[1] < 0 || targetMazePos[1] > maze.sizeY) {
        
        return false;
    }

    return (maze.data[Math.ceil(targetMazePos[0])][Math.ceil(targetMazePos[1])] != 1);
}

var camera;
var scene;

var turning = false;
var moving = false;
var timeElapsed = 0;
function run() {
    // START SETUP
    var mazeMeshes = updateMaze();
    var wallMeshes = mazeMeshes.wallMeshes;
    var floorMeshes = mazeMeshes.floorMeshes;


    // make camera and scene
    let camPos = vec3.fromValues(maze.startPosition[0] + 0.5, maze.startPosition[1] + 0.5, getEyeHeight());
    let camDir = vec3.clone(scene.camera.defaultCamDir);
    vec3.rotateZ(camDir, camDir, vec3.create(), maze.startHeading);
    let camUp = vec3.fromValues(0, 0, 1);

    let fov = getFov();
    let aspectRatio = canvas.width / canvas.height;
    let near = 0.1;
    let far = 100;

    let camTransform = new Transform(mazeToWorld(maze.startPosition), vec3.fromValues(0, maze.startHeading, 0), vec3.fromValues(1, 1, 1));
    camera = new Camera("Maze Camera", camTransform, fov, aspectRatio, near, far);
    scene = new Scene(camera);

    for (let i = 0; i < wallMeshes.length; i++) {
        wallMeshes[i].material.textureSrc = "data/wall.jpg";
        scene.addSceneObject(wallMeshes[i]);
    }
    for (let i = 0; i < floorMeshes.length; i++) {
        floorMeshes[i].material.textureSrc = "data/floor.jpg";
        scene.addSceneObject(floorMeshes[i]);
    }

    // setup renderer
    let imageSources = ["data/wall.jpg", "data/floor.jpg"];
    var renderer = new Renderer(imageSources);

    // END SETUP
    
    // setup time stuff
    var lastTime = jQuery.now();
    var deltaTime = 0;
    function update() {
        // don't start the update loop until the renderer is done loading
        if (!renderer.loadingComplete) {
            requestAnimationFrame(update);
            return;
        }

        // Step 1: Update the scene
        // START MAZE UPDATE
        if (mazeChanged) {
            mazeChanged = false;
            // setup maze again
            mazeMeshes = updateMaze();
            wallMeshes = mazeMeshes.wallMeshes;
            floorMeshes = mazeMeshes.floorMeshes;

            scene.removeAllSceneObjects();

            for (let i = 0; i < wallMeshes.length; i++) {
                wallMeshes[i].textureSrc = "data/wall.jpg";
                scene.addSceneObject(wallMeshes[i]);
            }
            for (let i = 0; i < floorMeshes.length; i++) {
                floorMeshes[i].textuerSrc = "data/floor.jpg";
                scene.addSceneObject(floorMeshes[i]);
            }

            // put the camera in the default position
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
                scene.camera.transform.heading[1] = lerpf(scene.camera.transform.rotation[1], targetHeading, timeElapsed / ANIMATION_DURATION);
            }
        }
        // update camera positoin
        if (moving) {
            timeElapsed += deltaTime;
            if (timeElapsed > ANIMATION_DURATION) {
                moving = false;
                timeElapsed = 0;

                scene.camera.transform.position = targetPos;
            } else {
                scene.camera.transform.position[0] = lerpf(scene.camera.transform.postiion[0], targetPos[0], timeElapsed / ANIMATION_DURATION);
                scene.camera.transform.position[1] = lerpf(scene.camera.transform.position[1], targetPos[1], timeElapsed / ANIMATION_DURATION);
                scene.camera.transform.position[2] = lerpf(scene.camera.transform.position[2], targetPos[2], timeElapsed / ANIMATION_DURATION);
            }
        }
        // END CAMERA UPDATE STUFF

        // Step 2: Draw the scene
        renderer.drawScene(scene);

        // Step 3: request that dank animation frame to do it all over again
        // requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

run();