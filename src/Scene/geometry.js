// contains list of triangles which make up the geometry. Defined in local space.
var Geometry = (function () {
    function Geometry() {
        this.triangles = [];
    }
    return Geometry;
})();
exports.Geometry = Geometry;
var Triangle = (function () {
    function Triangle(vertexA, vertexB, vertexC) {
        this.vertices = [vertexA, vertexB, vertexC];
    }
    return Triangle;
})();
exports.Triangle = Triangle;
