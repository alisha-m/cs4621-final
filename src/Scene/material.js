class Material {
    constructor(vertexShaderId, fragmentShaderId) {
        this.vertexShaderId = vertexShaderId;
        this.fragmentShaderId = fragmentShaderId;
        this.shaderData = {};
        // TODO: Maybe don't assume one texture per object
        // TODO: Yeet this out actually, just have texture src
        this.texture = null;
        // TODO: Get rid of textureIdx from here
        this.textureIdx = -1;
        this.textureSrc = "";
    }

    addShaderData(varName, varData) {
        let shaderVar = new ShaderVar(varName, varData);
        this.shaderData.push(shaderVar);
    }

    addTexture(texture, textureIdx, textureSrc) {
        this.texture = texture;
        this.textureIdx = textureIdx;
    }
}

class ShaderVar {
    // TODO: Add parameter for type of data
    constructor(varName, varData) {
        this.varName = varName;
        this.varData = varData;
    }
}