precision highp float;

uniform sampler2D texture1;

varying vec2 geom_texCoord;

void main() {
    gl_FragColor = texture2D(texture1, geom_texCoord);
}