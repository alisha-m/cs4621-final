export class Material {
    public shaderId: string;
    public shaderData: ShaderVar[];

    constructor(shaderId: string) {
        this.shaderId = shaderId;
        this.shaderData = [];
    }

    addShaderData(varName, varData, isAttrib) {
        let shaderVar = new ShaderVar(varName, varData, isAttrib);
        this.shaderData.push(shaderVar);
    }
};

class ShaderVar {
    // is either an attribute or a uniform
    public isAttribute: boolean;
    public isUniform: boolean;

    public variableName: string;
    // TODO: Use the type of this to determine gl calls
    public variableData: any;

    constructor(varName: string, varData: any, isAttrib: boolean) {
        this.isAttribute = isAttrib;
        this.isUniform = !isAttrib;

        this.variableName = varName;
        this.variableData = varData;
    }
}