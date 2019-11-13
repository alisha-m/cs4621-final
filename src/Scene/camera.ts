import { SceneObject } from "./scene-object";
import { Transform } from "./transform";

export class Camera extends SceneObject {
    // the vertical fov in radians
    public fov: number;
    public aspectRatio: number;
    // near clipping plane distance
    public near: number;
    // far clipping plane distance
    public far: number;

    constructor(
        name: string, transform: Transform, 
        fov :number, aspectRatio: number, near : number, far: number
    ) {
        super(name, transform);

        this.fov = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;
    }
}