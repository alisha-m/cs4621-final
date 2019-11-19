class Material {
    constructor(vertexShaderId, fragmentShaderId) {
        this.vertexShaderId = vertexShaderId;
        this.fragmentShaderId = fragmentShaderId;
        this.shaderData = {};
        // TODO: Maybe don't assume one texture per object
        this.texture = null;
        this.textureIdx = -1;
    }

    addShaderData(varName, varData) {
        let shaderVar = new ShaderVar(varName, varData);
        this.shaderData.push(shaderVar);
    }
}

class ShaderVar {
    // TODO: Add parameter for type of data
    constructor(varName, varData) {
        this.varName = varName;
        this.varData = varData;
    }
}