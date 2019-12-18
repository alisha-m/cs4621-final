const WIDTH = 40;
const NUM_DIVISIONS = 48;

function getHeight(x, y) {
    let inputFactor = 0.05;
    let outputFactor = 2.0;

    // The factor by which each subsequent "octive" or added perlin noise level
    // is squished by (to produce added granularity of the bumps)
    let lacunarity = 2.5;

    // The factor by which each subsequent octive is reduced in height
    let persistance = 0.4

    let height = 0;
    for(let i = 0; i < 3; i++) {
        let coeff = inputFactor * Math.pow(lacunarity, i);
        height += Math.pow(persistance, i) * noise.simplex2(coeff * x, coeff * y);
    }
    return outputFactor * height;
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

/**
 * Creates a square hilly terrain surface mesh object
 * 
 * @param width         The sidelength of the square
 * @param numDivisions  The number of points per side of the mesh. This cannot be
 *                      greater than 256 (because indices are stored as unsigned
 *                      shorts)
 * @param center        The location of the center of the mesh
 * @param getHeightFunc A function that returns a height. It should take in 2 
 *                      2 parameters, an x and y coordinate.
 * @param surfaceShader The shader to be used for rendering the surface
 * @param otherFunc     An optional function that returns an additional
 *                      coordinate, given an x and y coordinate. If not entered,
 *                      then no additional coordinate will be present
 */
function makeSurfaceAdvanced(width, numDivisions, center, getHeightFunc, surfaceShader, texture, otherFunc = undefined) {
    let space = width / numDivisions;

    // To account for the fact that n squares requires n + 1 points. Note that 
    // the first row of points does not create any squares
    numDivisions += 1;

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

            geom.vertices.push(vec3.fromValues(
                xCoord,
                yCoord,
                getHeightFunc(center[0] + xCoord, center[1] + yCoord)
            ));

            if(otherFunc != undefined) {
                geom.otherCoords.push(otherFunc(center[0] + xCoord, center[1] + yCoord));
            }

            // geom.normals.push(vec3.fromValues(0.0, 0.0, 1.0));
            geom.uvs.push(vec2.fromValues(x % 4 / 4, y % 4 / 4));

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
    let material = new Material(surfaceShader);
    material.setTexture(texture,1);



    // Create transform:
    let transform = new Transform(center, vec3.fromValues(0, 0, 0), vec3.fromValues(1, 1, 1));

    // Create mesh object
    let mesh = new MeshObject("Surface", transform, geom, material);

    return mesh;
}

function makeSurface(x, y, shader,texture) {
    return makeSurfaceAdvanced(
        WIDTH,
        NUM_DIVISIONS,
        vec3.fromValues(x, y, 0.0),
        getHeight,
        shader,
        texture
    );
}

function makeWater(x, y, shader) {
    return getQuadMesh(vec3.fromValues(x, y, 0.0), vec3.create(), 3 * WIDTH, 3 * WIDTH, shader);

    // return makeSurfaceAdvanced(
    //     WIDTH,
    //     NUM_DIVISIONS,
    //     vec3.fromValues(x, y, -0.5),
    //     function(x, y) { return 0.0; },
    //     shader,
    //     getHeight
    // );
}

function makeBox(color, position, size, shader, rotation = vec3.create()) {
    // Create cube vertices

    let geom = new Geometry();

    geom.vertices.push(vec3.fromValues(-0.5, -0.5, -0.5)); // bottomLeftBack
    geom.vertices.push(vec3.fromValues( 0.5, -0.5, -0.5)); // bottomRightBack
    geom.vertices.push(vec3.fromValues( 0.5, -0.5,  0.5)); // bottomRightFront
    geom.vertices.push(vec3.fromValues(-0.5, -0.5,  0.5)); // bottomLeftFront

    geom.vertices.push(vec3.fromValues(-0.5, 0.5, -0.5)); // topLeftBack
    geom.vertices.push(vec3.fromValues( 0.5, 0.5, -0.5)); // topRightBack
    geom.vertices.push(vec3.fromValues( 0.5, 0.5,  0.5)); // topRightFront
    geom.vertices.push(vec3.fromValues(-0.5, 0.5,  0.5)); // topLeftFront

    // Bottom face
    geom.faces.push(new Face(0, 1, 2));
    geom.faces.push(new Face(0, 2, 3));

    // Back face
    geom.faces.push(new Face(0, 4, 1));
    geom.faces.push(new Face(4, 5, 1));

    // Right face
    geom.faces.push(new Face(1, 5, 2));
    geom.faces.push(new Face(2, 5, 6));

    // Front face
    geom.faces.push(new Face(2, 6, 3));
    geom.faces.push(new Face(3, 6, 7));

    // Left face
    geom.faces.push(new Face(0, 3, 7));
    geom.faces.push(new Face(0, 7, 4));

    // Top face
    geom.faces.push(new Face(4, 6, 5));
    geom.faces.push(new Face(4, 7, 6));

    // Create material
    let material = new Material(shader);
    material.setColor(color);

    // Create transform:
    let transform = new Transform(position, rotation, vec3.fromValues(size, size, size));

    // Create mesh object
    let mesh = new MeshObject("Box", transform, geom, material);

    return mesh;
}

function getQuadMesh(center, rotation, width, height, shader) {
    // Create geometry
    let halfWidth = width/2;
    let halfHeight = height/2;

    let topLeft = vec3.fromValues(-1.0, 1.0, 0);
    let topRight = vec3.fromValues(1.0, 1.0, 0);
    let bottomLeft = vec3.fromValues(-1.0, -1.0, 0);
    let bottomRight = vec3.fromValues(1.0, -1.0, 0);

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
    // console.log(quadGeom.vertices[0], quadGeom.vertices[1], quadGeom.vertices[2]);
    let topFace = new Face(0, 2, 3);
    // console.log(quadGeom.vertices[0], quadGeom.vertices[2], quadGeom.vertices[3]);
    quadGeom.faces.push(bottomFace);
    quadGeom.faces.push(topFace);

    // Create material
    let quadMat = new Material(shader);

    // Create transform:
    let quadTransform = new Transform(center, rotation, vec3.fromValues(width, height, 1));

    // Create mesh object
    let quadMesh = new MeshObject("Quad", quadTransform, quadGeom, quadMat);

    return quadMesh;
}




// OLD FACETED (LOW-POLY) SURFACE MAKER

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