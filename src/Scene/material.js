var Material = (function () {
    function Material(shaderId) {
        this.shaderId = shaderId;
        this.shaderData = [];
    }
    Material.prototype.addShaderData = function (varName, varData, isAttrib) {
        var shaderVar = new ShaderVar(varName, varData, isAttrib);
        this.shaderData.push(shaderVar);
    };
    return Material;
})();
exports.Material = Material;
;
var ShaderVar = (function () {
    function ShaderVar(varName, varData, isAttrib) {
        this.isAttribute = isAttrib;
        this.isUniform = !isAttrib;
        this.variableName = varName;
        this.variableData = varData;
    }
    return ShaderVar;
})();
