import {vec3, quat} from "gl-matrix";

export class Transform {
    public position: vec3;
    // TODO: Use quaternions to avoid gimbal lock
    // rotation stored as euler angles in radians
    public rotation: vec3;
    public localScale: vec3;

    constructor(position: vec3, rotation: vec3, scale: vec3) {
        this.position = position;
        // TODO: Clamp rotation angles
        this.rotation = rotation;
        this.localScale = scale;
    }

    translate(translationAmount: vec3): void {
        vec3.add(this.position, this.position, translationAmount);
    }

    rotate(rotateAmount: vec3): vec3 {
        // TODO: clamp rotation angles
        vec3.add(this.rotation, this.rotation, rotateAmount);
        return this.rotation;
    }

    scale(scaleAmount: vec3): vec3 {
        vec3.mul(this.localScale, this.localScale, scaleAmount);
        return this.localScale;
    }

    clampRotationAngles(rotation: vec3) : vec3 {
        for (let i = 0; i < 3; i++) {
            let angle = rotation[i];
            if (angle < 0) {
                angle += 2 * Math.PI;
            } else if (angle >= 2 * Math.PI) {
                angle -= 2 * Math.PI;
            }

            rotation[i] = angle;
        }

        return rotation;
    }
}