var CHUNK_LENGTH = 10;
var pointsPerAxis = 10;
let isoLevel = 3;

class MarchingCubes {
    constructor() {
        let points = this.getChunkPoints();
        this.pointNoiseValues = this.getPointNoiseValues(points);
        let includedPoints = this.getIncludedPoints(this.pointNoiseValues);

        this.geometry = this.getGeometry(points, includedPoints);
    }
    
    // gets the points from the single default chunk for now. a chunk is a cube of 100 uniformly distributed points
    getChunkPoints() {
        let points = [];

        for (let z = 0; z < pointsPerAxis; z++) {
            for (let y = 0; y < pointsPerAxis; y++) {
                for (let x = 0; x < pointsPerAxis; x++) {
                    let point = vec3.fromValues(x, y, z);
                    vec3.scale(point, point, pointsPerAxis / CHUNK_LENGTH);

                    points.push(point);
                }
            }
        }

        return points;
    }

    getPointNoiseValues(points) {
        noise.seed(Math.random());

        let pointNoiseValues = [];

        // how many gradients are we combining?
        let octaves = 3;
        // how much does each successive gradient contribute?
        let persistence = 0.5;
        // how much does the frequency multiply by each succcessive gradient?
        let lacunarity = 2;

        // How tall should the highest peaks be?
        let heightRange = 10;

        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pointNoiseValue = this.octaveSimplex(
                point[0], point[1], point[2], 
                octaves, persistence, lacunarity) * heightRange;
            pointNoiseValues.push(pointNoiseValue);
        }

        return pointNoiseValues;
    }
    
    getIncludedPoints() {
        let pointsIncluded = [];

        for (let i = 0; i < this.pointNoiseValues.length; i++) {
            if (this.pointNoiseValues[i] > isoLevel) {
                pointsIncluded.push(true);
            } else {
                pointsIncluded.push(false);
            }
        }

        return pointsIncluded;
    }

    indexFromCoord(x, y, z) {
        return z * pointsPerAxis * pointsPerAxis + y * pointsPerAxis + x;
    }

    interpolateVerts(v1, v2, v1NoiseValue, v2NoiseValue) {
        let t = (isoLevel - v1NoiseValue) / (v2NoiseValue - v1NoiseValue);
        // return v1.xyz + t * (v2.xyz - v1.xyz);
        let returnVec1 = vec3.create();
        let returnVec2 = vec3.create();
        vec3.sub(returnVec2, v2, v1);
        vec3.scale(returnVec2, returnVec2, t);
        vec3.add(returnVec1, v1, returnVec2);

        return returnVec1;
    }

    getGeometry(points, includedPoints) {
        let triangles = [];

        for(let i = 0; i < points.length; i++) {
            let point = points[i];
            let x = point[0];
            let y = point[1];
            let z = point[2];

            // stop one point before the end because voxel includes neighboring points
            if (x >= pointsPerAxis - 1 || y >= pointsPerAxis - 1 || z >= pointsPerAxis - 1) {
                continue;
            }

            // 8 corners of the current cube
            let cubeCorners = [
                points[this.indexFromCoord(x, y, z)],
                points[this.indexFromCoord(x + 1, y, z)],
                points[this.indexFromCoord(x + 1, y, z+1)],
                points[this.indexFromCoord(x, y, z + 1)],
                points[this.indexFromCoord(x, y + 1, z)],
                points[this.indexFromCoord(x + 1, y + 1, z)],
                points[this.indexFromCoord(x + 1, y + 1, z + 1)],
                points[this.indexFromCoord(x, y + 1, z + 1)]
            ];
            let cubeCornerIdxs = [
                this.indexFromCoord(x, y, z),
                this.indexFromCoord(x + 1, y, z),
                this.indexFromCoord(x + 1, y, z + 1),
                this.indexFromCoord(x, y, z +1),
                this.indexFromCoord(x, y + 1, z),
                this.indexFromCoord(x + 1, y + 1, z),
                this.indexFromCoord(x + 1, y +1, z + 1),
                this.indexFromCoord(x, y + 1, z + 1)
            ];

            // Calculate unique index for each cube configuration.
            // There are 256 possible values
            // A value of 0 means cube is entirely within surface; 255 entirely outside.
            // The value is used to look up the edge table, which indicates which edges of the cube are cut by the isosurface.
            let cubeIndex = 0;
            if (!includedPoints[cubeCornerIdxs[0]]) cubeIndex |= 1;
            if (!includedPoints[cubeCornerIdxs[1]]) cubeIndex |= 2;
            if (!includedPoints[cubeCornerIdxs[2]]) cubeIndex |= 4;
            if (!includedPoints[cubeCornerIdxs[3]]) cubeIndex |= 8;
            if (!includedPoints[cubeCornerIdxs[4]]) cubeIndex |= 16;
            if (!includedPoints[cubeCornerIdxs[5]]) cubeIndex |= 32;
            if (!includedPoints[cubeCornerIdxs[6]]) cubeIndex |= 64;
            if (!includedPoints[cubeCornerIdxs[7]]) cubeIndex |= 128;

            // Create triangles for current cube configuration
            for (let j = 0; triangulation[cubeIndex][j] != -1; j+=3) {
                // Get indices of corner points A and B for each of the three edges
                // of the cube that need to be joined to form the triangle.

                let a0 = cornerIndexAFromEdge[triangulation[cubeIndex][j]];
                let b0 = cornerIndexBFromEdge[triangulation[cubeIndex][j]];

                let a1 = cornerIndexAFromEdge[triangulation[cubeIndex][j+1]];
                let b1 = cornerIndexBFromEdge[triangulation[cubeIndex][j+1]];

                let a2 = cornerIndexAFromEdge[triangulation[cubeIndex][j+2]];
                let b2 = cornerIndexBFromEdge[triangulation[cubeIndex][j+2]];
                
                let a0Point = cubeCorners[a0];
                let a0Idx = cubeCornerIdxs[a0];
                let a0NoiseValue = this.pointNoiseValues[a0Idx];
                let b0Point = cubeCorners[b0];
                let b0Idx = cubeCornerIdxs[b0];
                let b0NoiseValue = this.pointNoiseValues[b0Idx];
                let a1Point = cubeCorners[a1];
                let a1Idx = cubeCornerIdxs[a1];
                let a1NoiseValue = this.pointNoiseValues[a1Idx];
                let b1Point = cubeCorners[b1];
                let b1Idx = cubeCornerIdxs[b1];
                let b1NoiseValue = this.pointNoiseValues[b1Idx];
                let a2Point = cubeCorners[a2];
                let a2Idx = cubeCornerIdxs[a2];
                let a2NoiseValue = this.pointNoiseValues[a2Idx];
                let b2Point = cubeCorners[b2];
                let b2Idx = cubeCornerIdxs[b2];
                let b2NoiseValue = this.pointNoiseValues[b2Idx];

                let triangle = [];
                triangle.push(this.interpolateVerts(a0Point, b0Point, a0NoiseValue, b0NoiseValue));
                triangle.push(this.interpolateVerts(a1Point, b1Point, a1NoiseValue, b1NoiseValue));
                triangle.push(this.interpolateVerts(a2Point, b2Point, a2NoiseValue, b2NoiseValue));

                triangles.push(triangle);
            }
        }

        // handle triangles and make a mesh
        // store vertices in mesh geometry
        // store indices for faces
        let geometry = new Geometry();
        let indices = [];
        for (let i = 0; i < triangles.length; i++) {
            for (let j = 0; j < 3; j++) {
                indices.push(i * 3 + j);
                let point = vec3.clone(triangles[i][j]);
                geometry.vertices.push(point);

                // TODO: Add real normals and uvs lmao
                geometry.uvs.push(vec2.create());
                geometry.normals.push(vec3.create());
            }
        }
        // create  faces from indices
        for (let i = 0; i < indices.length; i+=3) {
            let face = new Face(indices[i], indices[i+1], indices[i+2]);
            geometry.faces.push(face);
        }

        console.log(geometry);
        return geometry;
    }

    // source: https://flafla2.github.io/2014/08/09/perlinnoise.html 
    // x, y, z: world coordinates to pass into simplex noise
    // octaves: How many different simplex gradients do we want to combine?
    // persistence: How much the amplitude is multiplied each successive octave.
    // lacunarity: How much the frequency is increased each successive octave. 2 is a good value.
    octaveSimplex(x, y, z, octaves, persistence, lacunarity) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            x *= frequency;
            y *= frequency;
            z *= frequency;

            total += noise.simplex3(x, y, z);

            maxValue += amplitude;

            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return total / maxValue;
    }
}