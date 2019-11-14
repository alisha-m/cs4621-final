var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var scene_object_1 = require("./scene-object");
var gl_matrix_1 = require("gl-matrix");
var Camera = (function (_super) {
    __extends(Camera, _super);
    function Camera(name, transform, fov, aspectRatio, near, far) {
        _super.call(this, name, transform);
        this.fieldOfView = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;
        this.defaultCamDir = gl_matrix_1.vec3.fromValues(1, 0, 0);
        this.camUp = gl_matrix_1.vec3.fromValues(0, 0, 1);
    }
    Camera.prototype.getCamDir = function () {
        var camDir = gl_matrix_1.vec3.create();
        gl_matrix_1.vec3.rotateX(camDir, camDir, gl_matrix_1.vec3.create(), this.transform.rotation[0]);
        gl_matrix_1.vec3.rotateY(camDir, camDir, gl_matrix_1.vec3.create(), this.transform.rotation[1]);
        gl_matrix_1.vec3.rotateZ(camDir, camDir, gl_matrix_1.vec3.create(), this.transform.rotation[2]);
        return camDir;
    };
    Camera.prototype.getCamUp = function () {
        return this.camUp;
    };
    return Camera;
})(scene_object_1.SceneObject);
exports.Camera = Camera;
