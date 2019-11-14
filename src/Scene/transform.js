var gl_matrix_1 = require("gl-matrix");
var Transform = (function () {
    function Transform(position, rotation, scale) {
        this.position = position;
        // TODO: Clamp rotation angles
        this.rotation = rotation;
        this.localScale = scale;
    }
    Transform.prototype.translate = function (translationAmount) {
        gl_matrix_1.vec3.add(this.position, this.position, translationAmount);
    };
    Transform.prototype.rotate = function (rotateAmount) {
        // TODO: clamp rotation angles
        gl_matrix_1.vec3.add(this.rotation, this.rotation, rotateAmount);
        return this.rotation;
    };
    Transform.prototype.scale = function (scaleAmount) {
        gl_matrix_1.vec3.mul(this.localScale, this.localScale, scaleAmount);
        return this.localScale;
    };
    Transform.prototype.clampRotationAngles = function (rotation) {
        for (var i = 0; i < 3; i++) {
            var angle = rotation[i];
            if (angle < 0) {
                angle += 2 * Math.PI;
            }
            else if (angle >= 2 * Math.PI) {
                angle -= 2 * Math.PI;
            }
            rotation[i] = angle;
        }
        return rotation;
    };
    return Transform;
})();
exports.Transform = Transform;
