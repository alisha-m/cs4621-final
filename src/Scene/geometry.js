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