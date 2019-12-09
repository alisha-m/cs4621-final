class MarchingCubes {
    constructor() {
        let points = this.getChunkPoints();
        let pointNoiseValues = this.getPointNoiseValues(points);
        let includedPoints = this.getIncludedPoints(pointNoiseValues);

        let geometry = this.getGeometry(points, includedPoints);

        console.log(pointNoiseValues);
    }
    
    // gets the points from the single default chunk for now. a chunk is a cube of 100 uniformly distributed points
    getChunkPoints() {
        let points = [];

        // length of a side of the cube in world units
        let CHUNK_LENGTH = 10;
        // bottom left corner of the chunk
        let startPoint = vec3.fromValues(-CHUNK_LENGTH / 2, -CHUNK_LENGTH / 2, -CHUNK_LENGTH / 2);
        vec3.add(startPoint, startPoint, vec3.fromValues(0.5, 0.5, 0.5));

        let POINTS_PER_VOXEL = 10;
        for (let z = 0; z < POINTS_PER_VOXEL; z++) {
            for (let y = 0; y < POINTS_PER_VOXEL; y++) {
                for (let x = 0; x < POINTS_PER_VOXEL; x++) {
                    let point = vec3.fromValues(x, y, z);
                    vec3.scale(point, point, POINTS_PER_VOXEL / CHUNK_LENGTH);
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

        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pointNoiseValue = Math.floor(noise.simplex3(point[0], point[1], point[2]) * 50);
            pointNoiseValues.push(pointNoiseValue);
        }

        return pointNoiseValues;
    }
    
    getIncludedPoints(pointNoiseValues) {
        let pointsIncluded = [];

        let CUTOFF = 16;
        for (let i = 0; i < pointNoiseValues.length; i++) {
            if (pointNoiseValues[i] > 16) {
                pointsIncluded.push(true);
            } else {
                pointsIncluded.push(false);
            }
        }

        return pointsIncluded;
    }

    getGeometry(points, includedPoints) {
        
    }
}