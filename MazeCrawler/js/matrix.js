function TranslationMatrix(x, y, z) {
    return [
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    ];
}

function RotationXMatrix(angleX) {
    return [
        1, 0, 0, 0,
        0, Math.cos(angleX), -Math.sin(angleX), 0,
        0, Math.sin(angleX), Math.cos(angleX), 0,
        0, 0, 0, 1
    ]
}

function RotationYMatrix(angleY) {
    return [
        Math.cos(angleY), 0, Math.sin(angleY), 0,
        0, 1, 0, 0,
        -Math.sin(angleY), 0, Math.cos(angleY), 0,
        0, 0, 0, 1
    ];
}

function RotationZMatrix(angleZ) {
    return [
        Math.cos(angleZ), -Math.sin(angleZ), 0, 0,
        Math.sin(angleZ), Math.cos(angleZ), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

function ScaleMatrix(scaleX, scaleY, scaleZ) {
    return [
        scaleX, 0, 0, 0,
        0, scaleY, 0, 0,
        0, 0, scaleZ, 0,
        0, 0, 0, 1
    ];
}

function multiplyPoint(matrix, point) {
    var x = point[0], y = point[1], z = point[2], w = point[3];

    var c1r1 = matrix[ 0], c2r1 = matrix[ 1], c3r1 = matrix[ 2], c4r1 = matrix[ 3],
        c1r2 = matrix[ 4], c2r2 = matrix[ 5], c3r2 = matrix[ 6], c4r2 = matrix[ 7],
        c1r3 = matrix[ 8], c2r3 = matrix[ 9], c3r3 = matrix[10], c4r3 = matrix[11],
        c1r4 = matrix[12], c2r4 = matrix[13], c3r4 = matrix[14], c4r4 = matrix[15];

    return [
        x*c1r1 + y*c1r2 + z*c1r3 + w*c1r4,
        x*c2r1 + y*c2r2 + z*c2r3 + w*c2r4,
        x*c3r1 + y*c3r2 + z*c3r3 + w*c3r4,
        x*c4r1 + y*c4r2 + z*c4r3 + w*c4r4
    ];
}

function multiplyMatrices(a, b) {
    var result = [];
  
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    result[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31; 
    result[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    result[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    result[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    result[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    return result;
}

function multiplyArrayOfMatrices(matrices) {
    var inputMatrix = matrices[0];

    for (let i = 1; i < matrices.length; i++){
        inputMatrix = multiplyMatrices(inputMatrix, matrices[i]);
    }

    // let inputMatrix = matrices[matrices.length-1];

    // for (let i = matrices.length - 2; i >= 0; i++) {
    //     inputMatrix = multiplyMatrices(inputMatrix, matrices[i]);
    // }

    return inputMatrix;
}

function PerspectiveMatrix(fieldOfView, aspectRatio, near, far) {
    // var f = 1.0 / Math.tan(fieldOfView / 2);
    var f = 1.0 / Math.tan(fieldOfView / 2);
    var rangeInv = 1 / (near - far);

    return [
        f / aspectRatio, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
}

function OrthographicMatrix(left, right, bottom, top, near, far) {
    // Each of the parameters represent the plane of the bounding box
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);

    var row4col1 = (left + right) * lr;
    var row4col2 = (top + bottom) * bt;
    var row4col3 = (far + near) * nf;

    return [
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        row4col1, row4col2, row4col3, 1
    ];
}

// using FPS camera dervied from here https://www.3dgep.com/understanding-the-view-matrix/ 
function InverseViewMatrix(camPos, camDir, camUp) {
    // change of basis matrix should be calculated here
    let vz = camDir;
    let vx = normalize(cross(camUp, vz));
    // vy doesn't need to be normalized because it's a cross product of 2 normalized vectors
    let vy = cross(vz, vx);

    let inverseViewMatrix = [
        vx[0], vy[0], vz[0], camPos[0],
        vx[1], vy[1], vz[1], camPos[1],
        vx[2], vy[2], vz[1], camPos[2],
        0,      0,      0,      1
    ]

    return inverseViewMatrix;
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function normalize(a) {
    let magnitude = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
    return [a[0] / magnitude, a[1]/magnitude, a[2]/magnitude];
}