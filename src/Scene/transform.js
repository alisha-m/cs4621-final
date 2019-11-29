class Transform {
    constructor(position, rotation, localScale) {
        this.position = position;
        this.rotation = rotation;
        this.localScale = localScale;
    }

    translate(translationAmount) {
        vec3.add(this.position, this.position, translationAmount);
    }

    rotate(rotateAmount) {
        vec3.add(this.rotation, this.rotation, rotateAmount);
    }

    scale(scaleAmount) {
        vec3.mul(this.localScale, this.localScale, scaleAmount);
    }

    clampRotationAngles(rotation) {
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