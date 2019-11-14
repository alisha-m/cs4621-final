var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var scene_object_1 = require('./scene-object');
var MeshObject = (function (_super) {
    __extends(MeshObject, _super);
    function MeshObject(name, transform, geometry, material) {
        _super.call(this, name, transform);
        this.geometry = geometry;
        this.material = material;
    }
    return MeshObject;
})(scene_object_1.SceneObject);
exports.MeshObject = MeshObject;
