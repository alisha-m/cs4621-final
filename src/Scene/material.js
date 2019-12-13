class Material {
    constructor(shader) {
        this.shader = shader;

        this.color = vec3.fromValues(1.0, 1.0, 1.0);

        // TODO: Maybe don't assume one texture per object
        // TODO: Yeet this out actually, just have texture src
        this.texture = null;
        
        // TODO: Get rid of textureIdx from here
        this.textureIdx = -1;
    }

    setTexture(texture, textureIdx) {
        this.texture = texture;
        this.textureIdx = textureIdx;

        this.color = vec3.fromValues(1.0, 1.0, 1.0);
    }

    setColor(color) {
        this.color = color;

        this.texture = null;
        this.textureIdx = -1;
    }
}