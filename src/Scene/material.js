class Material {
    constructor(vertexShaderId, fragmentShaderId) {
        this.vertexShaderId = vertexShaderId;
        this.fragmentShaderId = fragmentShaderId;
        this.shaderData = [];
    }

    addShaderData(varName, varData, isAttrib) {
        let shaderVar = new ShaderVar(varName, varData, isAttrib);
        this.shaderData.push(shaderVar);
    }
}

class ShaderVar {
    constructor(varName, varData, isAttrib) {
        this.isAttribute = isAttrib;
        this.isUniform = !isAttrib;

        this.varName = varName;
        this.varData = varData;
    }
}