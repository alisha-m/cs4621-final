class Geometry {
    constructor() {
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.faces = [];
    }

    getNormal(vertIdx1, vertIdx2, vertIdx3) {
        let a = this.vertices[vertIdx1];
        let b = this.vertices[vertIdx2];
        let c = this.vertices[vertIdx3];

        let AB = vec3.create();
        vec3.sub(AB, b, a);
        let AC = vec3.create();
        vec3.sub(AC, c, a);

        let N = vec3.create();
        vec3.cross(N, AB, AC);
        vec3.normalize(N, N);

        return N;
    }
}

class Face {
    // TODO: perhaps have more stuff here
    constructor(a, b, c) {
        this.indices = vec3.fromValues(a, b, c);
    }
}

/*
class Geometry {
    constructor() {
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.faces = [];
    }
}

class Face {
    // TODO: perhaps have more stuff here
    constructor() {
        this.vertices = [0, 0, 0];
        this.uvs = [0, 0, 0];
        this.normals = [0, 0, 0];
    }

    setVertex(vertexIndex, positionIndex, uvIndex, normalIndex) {
		this.vertices[vertexIndex] = positionIndex;
		this.uvs[vertexIndex] = uvIndex;
		this.normals[vertexIndex] = normalIndex;
	}
}
*/