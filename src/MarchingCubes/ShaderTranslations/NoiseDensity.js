class NoiseDensity{
    // offsets: list of vec3
    // octaves: int
    // lacunarity: float
    // persistence: float
    // noiseScale: float
    // noiseWeight: float
    // floorOffset: float
    // weightMultiplier: float
    // closeEdges: bool
    // hardFloor: float
    // hardFloorWeight: float

    constructor(offsets, octaves, lacunarity, persistence, noiseScale, noiseWeight, floorOffset, weightMultiplier, closeEdges, hardFloor, hardFloorWeight) {
        this.offsets = offsets;
        this.octaves = octaves;
        this.lacunarity = lacunarity;
        this.persistence = persistence;
        this.noiseScale = noiseScale;
        this.noiseWeight = noiseWeight;
        this.floorOffset = floorOffset;
        this.weightMultiplier = weightMultiplier;
        this.closeEdges = closeEdges;
        this.hardFloor = hardFloor;
        this.hardFloorWeight = hardFloorWeight;

        // this is a vec4 apparently lmao
        this.params = {

        };
    }

    // numPointsPerAxis: int
    // boundsSize: float
    // center: vec3
    // offset: vec3
    // spacing: float
    // worldSize: vec3
    setDensityParams(numPointsPerAxis, boundsSize, center, offset, spacing, worldSize) {
        this.numPointsPerAxis = numPointsPerAxis;
        this.boundsSize = boundsSize;
        this.center = center;
        this.offset = offset;
        this.spacing = spacing;
        this.worldSize = worldSize;
    }

    // x, y, and z are ints
    // returns an index based on the numPointsPerAxis and the x y and z coordinates of a point
    indexFromCoord(x, y, z) {
        return z * this.numPointsPerAxis * this.numPointsPerAxis + y * this.numPointsPerAxis + x;
    }

    // id: vec3 of ints
    density(id) {
        if (id.x >= this.numPointsPerAxis || id.y >= numPointsPerAxis || id.z >= numPointsPerAxis) {
            return;
        }

        // float3 pos = centre + id * spacing - boundsSize / 2;
        let halfBounds = vec3.create();
        vec3.scale(halfBounds, this.boundsSize, 1 / 2);
        let pos = vec3.create();
        vec3.mul(pos, id, this.spacing);
        vec3.sub(pos, pos, halfBounds);
        vec3.add(pos, this.center, pos);
        // float offsetNoise = 0;
        let offsetNoise = 0;

        // float noise = 0;
        let noise = 0;

        // float frequency = noiseScale / 100;
        let frequency = this.noiseScale / 100;
        // float amplitude = 1;
        let amplitude = 1;
        // float weight = 1;
        let weight = 1;
        // for (int j = 0; j < octaves; j++) {}
        for (let j = 0; j < this.octaves; j++) {
            // float n = snoise((pos + offsetNoise) * frequency + offsets[j] + offset);
            let snoiseInput = vec3.create();
            vec3.add(snoiseInput, pos, vec3.fromValues(offsetNoise, offsetNoise, offsetNoise));
            let n = Noise3D.snoise(snoiseInput) * frequency;

        }
        
    }
}