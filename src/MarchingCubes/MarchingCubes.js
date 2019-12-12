var CHUNK_LENGTH = 10;
var pointsPerAxis = 10;
let isoLevel = 0;

class MarchingCubes {
    constructor() {
        let points = this.getChunkPoints();
        this.pointNoiseValues = this.getPointNoiseValues(points);
        let includedPoints = this.getIncludedPoints(this.pointNoiseValues);

        let geometry = this.getGeometry(points, includedPoints);

        // what percentage of points am i including
        let includedCount = 0;
        for (let i = 0; i < this.pointNoiseValues.length; i++) {
            if (this.pointNoiseValues[i] > isoLevel) includedCount += 1;
        }

        console.log("% of points included: " + includedCount / this.pointNoiseValues.length);
    }
    
    // gets the points from the single default chunk for now. a chunk is a cube of 100 uniformly distributed points
    getChunkPoints() {
        let points = [];

        // bottom left corner of the chunk
        let startPoint = vec3.fromValues(1, 1, 1);
        vec3.scale(startPoint, startPoint, CHUNK_LENGTH);

        for (let z = 0; z < pointsPerAxis; z++) {
            for (let y = 0; y < pointsPerAxis; y++) {
                for (let x = 0; x < pointsPerAxis; x++) {
                    let point = vec3.fromValues(x, y, z);
                    vec3.scale(point, point, pointsPerAxis / CHUNK_LENGTH);
                    vec3.add(point, point, startPoint);

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
        let persistence = 0.85;
        // how much does the frequency multiply by each succcessive gradient?
        let lacunarity = 1.5;

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
    
    getIncludedPoints(pointNoiseValues) {
        let pointsIncluded = [];

        let CUTOFF = 16;
        for (let i = 0; i < pointNoiseValues.length; i++) {
            if (pointNoiseValues[i] > CUTOFF) {
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
                return;
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

            console.log(this.indexFromCoord(x, y, z));
            console.log("Num Points: " + points.length);

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
            for (let j = 0; triangulation[cubeIndex][i] != -1; j+=3) {
                // Get indices of corner points A and B for each of the three edges
                // of the cube that need to be joined to form the triangle.
                let a0 = cornerIndexAFromEdge[triangulation[cubeIndex][i]];
                let b0 = cornerIndexBFromEdge[triangulation[cubeIndex][i]];

                let a1 = cornerIndexAFromEdge[triangulation[cubeIndex][i+1]];
                let b1 = cornerIndexBFromEdge[triangulation[cubeIndex][i+1]];

                let a2 = cornerIndexAFromEdge[triangulation[cubeIndex][i+2]];
                let b2 = cornerIndexBFromEdge[triangulation[cubeIndex][i+2]];
                
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

                let triangle = {};
                triangle.vertexA = this.interpolateVerts(a0Point, b0Point, a0NoiseValue, b0NoiseValue);
                triangle.vertexB = this.interpolateVerts(a1Point, b1Point, a1NoiseValue, b1NoiseValue);
                triangle.vertexC = this.interpolateVerts(a2Point, b2Point, a2NoiseValue, b2NoiseValue);

                triangles.push(triangle);
            }
        }

        // handle triangles and make a mesh

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