import { vec2, vec3 } from "gl-matrix";

// contains list of triangles which make up the geometry. Defined in local space.
export class Geometry {
    public triangles: Triangle[];

    constructor() {
        this.triangles = [];
    }
}

export class Triangle {
    public vertices: vec3[];
    public uvs: vec2[];
    public normals: vec3[];

    constructor(vertexA: any, vertexB: any, vertexC: any) {
        this.vertices = [vertexA, vertexB, vertexC];
    }
}