import { SceneObject } from "./scene-object";
import { Transform } from "./transform";
import { vec3 } from "gl-matrix";

export class Camera extends SceneObject {
    // the vertical fov in radians
    public fieldOfView: number;
    public aspectRatio: number;
    // near clipping plane distance
    public near: number;
    // far clipping plane distance
    public far: number;

    private defaultCamDir;
    private camUp;

    constructor(
        name: string, transform: Transform, 
        fov :number, aspectRatio: number, near : number, far: number
    ) {
        super(name, transform);

        this.fieldOfView = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;

        this.defaultCamDir = vec3.fromValues(1, 0, 0);
        this.camUp = vec3.fromValues(0, 0, 1);
    }

    getCamDir() {
        let camDir = vec3.create();
        vec3.rotateX(camDir, camDir, vec3.create(), this.transform.rotation[0]);
        vec3.rotateY(camDir, camDir, vec3.create(), this.transform.rotation[1]);
        vec3.rotateZ(camDir, camDir, vec3.create(), this.transform.rotation[2]);

        return camDir;
    }

    getCamUp() {
        return this.camUp;
    }
}