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