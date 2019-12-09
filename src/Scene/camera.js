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
        this.currentHeading = 0.0;
    }

    getCamDir() {
        let camDir = vec3.fromValues(1,0,0);
        vec3.rotateX(camDir, camDir, vec3.create(), this.transform.rotation[0]);
        vec3.rotateY(camDir, camDir, vec3.create(), this.transform.rotation[1]);
        vec3.rotateZ(camDir, camDir, vec3.create(), this.transform.rotation[2]);
        return camDir;
    }

    turnRight(speed) {
      let moveAmount = vec3.create();
      let dir = vec3.create();
      vec3.copy(dir,scene.camera.defaultCamDir);
      console.log(dir);
      vec3.cross(dir, dir, scene.camera.camUp);
      vec3.scale(moveAmount, dir, speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }

    turnLeft(speed) {
      let moveAmount = vec3.create();
      let dir = vec3.create();
      vec3.copy(dir,scene.camera.defaultCamDir);
      vec3.cross(dir, dir, scene.camera.camUp);
      vec3.scale(moveAmount, dir, speed);
      vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);

    }

    goForward(speed) {
      let moveAmount = vec3.create();
      vec3.scale(moveAmount, scene.camera.defaultCamDir, speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }

    goBackward(speed) {
      let moveAmount = vec3.create();
      vec3.scale(moveAmount, scene.camera.defaultCamDir, speed);
      vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }
}
