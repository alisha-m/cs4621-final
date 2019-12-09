class Camera extends SceneObject {
    constructor(
        name, transform,
        fieldOfView, aspectRatio, near, far
    ) {
        super(name, transform);

        this.fieldOfView = fieldOfView;
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
    }
}
