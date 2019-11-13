import { vec2, vec3 } from "gl-matrix";

// contains list of triangles which make up the geometry. Defined in local space.
export class Geometry {
    public triangles: Triangle[];

    constructor() {
        this.triangles = [];
    }
}

export class Triangle {
    // This should be a list of gl-matrix vec3's, but I can't get their typing lmao
    public vertices: vec3[];
    public uvs: vec2[];
    public normals: vec3[];

    constructor(vertexA: any, vertexB: any, vertexC: any) {
        this.vertices = [vertexA, vertexB, vertexC];
    }
}