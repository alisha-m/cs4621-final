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
        this.offsetZ = 2.0;

        this.defaultCamDir = vec3.fromValues(1, 0, 0);
        this.camUp = vec3.fromValues(0, 0, 1);
        this.currentHeadingX = 0.0;
        this.currentHeadingY = 0.0;

        this.landHeight = 0.3;
    }

    getCamDir() {
        let camDir = vec3.fromValues(1,0,0);
        vec3.rotateX(camDir, camDir, vec3.create(), this.transform.rotation[0]);
        vec3.rotateY(camDir, camDir, vec3.create(), this.transform.rotation[1]);
        vec3.rotateZ(camDir, camDir, vec3.create(), this.transform.rotation[2]);
        return camDir;
    }

    turnRight(turnSpeed) {
      this.currentHeadingX -= turnSpeed;
      // Bound the angle
      if(this.currentHeadingX >= Math.PI * 2.0) {
        this.currentHeadingX -= Math.PI * 2.0;
      } else if(this.currentHeadingX <= 0) {
        this.currentHeadingX += Math.PI * 2.0;
      }

      this.transform.rotation[2] = this.currentHeadingX;
    }

    turnUp(turnSpeed) {
      this.currentHeadingY += turnSpeed;
      // Bound the angle
      if(this.currentHeadingY >= Math.PI * 2.0) {
        this.currentHeadingY -= Math.PI * 2.0;
      } else if(this.currentHeadingY <= 0) {
        this.currentHeadingY += Math.PI * 2.0;
      }

      this.transform.rotation[1] = this.currentHeadingY;
    }

    turnDown(turnSpeed) {
      this.currentHeadingY -= turnSpeed;
      // Bound the angle
      if(this.currentHeadingY >= Math.PI * 2.0) {
        this.currentHeadingY -= Math.PI * 2.0;
      } else if(this.currentHeadingY <= 0) {
        this.currentHeadingY += Math.PI * 2.0;
      }

      this.transform.rotation[1] = this.currentHeadingY;
    }

    turnLeft(turnSpeed) {
      this.currentHeadingX += turnSpeed;
      // Bound the angle
      if(this.currentHeadingX >= Math.PI * 2.0) {
        this.currentHeadingX -= Math.PI * 2.0;
      } else if(this.currentHeadingX <= 0) {
        this.currentHeadingX += Math.PI * 2.0;
      }
      this.transform.rotation[2] = this.currentHeadingX;
    }

    goForward(speed) {
      let moveAmount = vec3.create();
      vec3.scale(moveAmount, scene.camera.getCamDir(), speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);

      //New height
      //scene.camera.transform.position[2] = this.landHeight + this.offsetZ;
    }
    goLeft(speed) {
      let moveAmount = vec3.create();
      let left = vec3.create();
      vec3.cross(left, scene.camera.getCamDir(), scene.camera.camUp);
      vec3.negate(left, left);
      vec3.scale(moveAmount, left, speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }

    goUp(speed) {
      let moveAmount = vec3.create();
      vec3.scale(moveAmount, scene.camera.camUp, speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }
    goDown(speed) {
      let moveAmount = vec3.create();
      let down = vec3.create();
      vec3.negate(down, scene.camera.camUp);
      vec3.scale(moveAmount, down, speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }

    goRight(speed) {
      let moveAmount = vec3.create();
      let right = vec3.create();
      vec3.cross(right, scene.camera.getCamDir(), scene.camera.camUp);
      vec3.scale(moveAmount, right, speed);
      vec3.add(scene.camera.transform.position, scene.camera.transform.position, moveAmount);
    }

    goBackward(speed) {
      let moveAmount = vec3.create();
      vec3.scale(moveAmount, scene.camera.getCamDir(), speed);
      vec3.sub(scene.camera.transform.position, scene.camera.transform.position, moveAmount);

      //New height
      //scene.camera.transform.position[2] = this.landHeight + this.offsetZ;
    }
}
