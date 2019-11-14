class Geometry {
    constructor() {
        this.triangles = [];
    }
}

class Triangle {
    constructor(vertexA, vertexB, vertexC) {
        this.vertices = [vertexA, vertexB, vertexC];
        this.uvs = [];
        this.normals = [];
    }
}