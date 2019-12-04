// just a translation of the webgl noise shader to javascript
class Noise3D {
    constructor() {
    }

    // x is a glMatrix vec3
    // returns a vec3
    mod289_vec3(x) {
        let xScaled = vec3.clone(x);
        vec3.scale(xScaled, xScaled, 1 / 289.0);
        vec3.floor(xScaled, xScaled);
        vec3.scale(xScaled, xScaled, 289);

        let xClone = vec3.clone(x);

        let result = vec3.create();
        vec3.sub(result, xClone, xScaled);

        return result;
    }

    // x is a glMatrix vec4
    // returns a vec4
    mod289_vec4(x) {
        let xScaled = vec4.clone(x);
        vec4.scale(xScaled, xScaled, 1 / 289.0);
        vec4.floor(xScaled, xScaled);
        vec4.scale(xScaled, xScaled, 289);

        let xClone = vec4.clone(x);

        let result = vec4.create();
        vec4.sub(result, xClone, xScaled);
    }

    // x is a glMatrix vec4
    // returns a vec4
    permute(x) {
        let xModified = vec4.clone(x);
        vec4.scale(xModified, xModified, 34);
        vec4.add(xModified, xModified, vec4.fromValues(1, 1, 1, 1));

        let xClone = vec4.clone(x);

        let xProduct = vec4.create();
        vec4.mul(xProduct, xModified, xClone);

        let xMod289 = this.mod289_vec4(xProduct);

        return xMod289;
    }

    // r is a glMatrix vec4
    // returns a vec4
    taylorInvSqrt(r) {
        let funkyNumVec1 = vec4.fromValues(1.79284291400159, 1.79284291400159, 1.79284291400159, 1.79284291400159);
        let funkyNumVec2 = vec4.fromVlaues(0.85373472095314, 0.85373472095314, 0.85373472095314, 0.85373472095314);

        let rModified = vec4.clone(r);
        vec4.mul(rModified, rModified, funkyNumVec2);

        vec4.sub(rModified, funkyNumVec1, rModified);

        return rModified;
    }

    // edge and v are glMatrix vec3
    // returns a vec3
    // see here for an explanation https://github.com/ashima/webgl-noise/blob/master/src/noise3Dgrad.glsl
    step_vec3(edge, v) {
        let stepVec = vec3.create();

        if (v.x < edge.x) stepVec.x = 0.0;
        else stepVec.x = 1.0;

        if (v.y < edge.y) stepVec.y = 0.0;
        else stepVec.y = 1.0;

        if (v.z < edge.z) stepVec.z = 0.0;
        else stepVec.z = 1.0;

        return stepVec;
    }

    // like step_vec3 but with vec4s
    step_vec4(edge, v) {
        let stepVec = vec4.create();

        if (v.x < edge.x) stepVec.x = 0.0;
        else stepVec.x = 0.0;

        if (v.y < edge.y) stepVec.y = 0.0;
        else stepVec.y = 1.0;
        
        if (v.z < edge.z) stepVec.z = 0.0;
        else stepVec.z = 1.0;

        if (v.w < edge.w) stepVec.w = 0.0;
        else stepVec.w = 1.0;

        return stepVec;
    }

    // v1 and v2 are glMatrix vec3
    // returns a vec3 that contains the min components of each
    // for example, if v1 = (1, 3, 4), and v2 = (-2, 5, 2), then this function
    // will return (-2, 3, 2).
    min_vec3(v1, v2) {
        let minVec = vec3.create();

        minVec.x = Math.min(v1.x, v2.x);
        minVec.y = Math.min(v1.y, v2.y);
        minVec.z = Math.min(v1.z, v2.z);

        return minVec;
    }

    // works like min_vec3 but max
    max_vec3(v1, v2) {
        let maxVec = vec3.create();

        maxVec.x = Math.max(v1.x, v2.x);
        maxVec.y = Math.max(v1.y, v2.y);
        maxVec.z = Math.max(v1.z, v2.z);

        return maxVec;
    }

    // works like max_vec3 but with vec4's
    max_vec4(v1, v2) {
        let maxVec = vec3.create();

        maxVec.x = Math.max(v1.x, v2.x);
        maxVec.y = Math.max(v1.y, v2.y);
        maxVec.z = Math.max(v1.z, v2.z);
        maxVec.w = Math.max(v1.w, v2.w);

        return maxVec;
    }

    // v is a vec4
    // returns a vector which has the components of v, but the absolute values
    abs_vec4(v) {
        let absVec = vec4.create();

        absVec.x = Math.abs(v.x);
        absVec.y = Math.abs(v.y);
        absVec.z = Math.abs(v.z);
        absVec.w = Math.abs(v.w);

        return absVec;
    }

    // v is a glMatrix vec3
    // returns a float
    // this is the main simplex noise function thing
    snoise(v) {
        let C = vec2.fromValues(1 / 6.0, 1 / 3.0);
        let D = vec4.fromValues(0, 0.5, 1, 2);

        // First corner
        let CY = vec3.fromValues(C.y, C.y, C.y);
        let vDotCY = vec3.dot(v, CY);
        let vDotCYVec = vec3.fromValues(vDotCY, vDotCY, vDotCY);
        let vPlusVDotCY = vec3.create();
        vec3.add(vPlusVDotCY, v, vDotCYVec);

        // vec3 i = floor(v + dot(v, C.yyy));
        let i = vec3.create();
        vec3.floor(i, vPlusVDotCY);

        let CX = vec3.fromValues(C.x, C.x, C.x);
        let iDotCX = vec3.dot(i, CX);
        let iDotCXVec = vec3.fromValues(iDotCX, iDotCX, iDotCX);
        let iPlusIDotCX = vec3.create();
        vec3.add(iPlusIDotCX, i, iDotCXVec);

        // vec3 x0 = v - i + dot(i, C.xxx);
        let x0 = vec3.create();
        vec3.sub(x0, v, iPlusIDotCX);

        // Other corners
        let x0YZX = vec3.fromValues(x0.y, x0.z, x0.x);
        let x0XYZ = vec3.fromValues(x0,x, x0.y, x0.z);
        // vec3 g = step(x0.yzx, x0.xyz);
        let g = this.step_vec3(x0YZX, x0XYZ);

        let l = vec3.create();
        // vec3 l = 1.0 - g;
        vec3.sub(l, vec3.fromValues(1, 1, 1), g);

        let gXYZ = vec3.fromValues(g.x, g.y, g.z);
        let lZXY = vec3.fromValues(l.z, l.x, l.y);
        // vec3 i1 = min(g.xyz, l.zxy);
        let i1 = this.min_vec3(gXYZ, lZXY);
        // vec3 i2 = max(g.xyz, l.zxy);
        let i2 = this.max_vec3(gXYZ, lZXY);

        // x0 = x0 - 0.0 + 0.0 * C.xxx
        // x1 = x0 - i1 + 1.0 * C.xxx
        // x2 = x0 - i2 + 2.0 * C.xxx
        // x3 = x0 - 1.0 + 3.0 * C.xxx

        // vec3 x1 = x0 - i1 + C.xxx;
        let i1PlusCX = vec3.create();
        vec3.add(iPlusCX, i, CX);
        let x1 = vec3.create();
        vec3.sub(x1, x0, i1PlusCX);

        // vec3 x2 = x0 - i2 + C.yyy
        let i2PlusCY = vec3.create();
        vec3.add(i2PlusCY, i2, CY);
        let x2 = vec3.create();
        vec3.sub(x2, x0, i2PlusCY);

        // vec3 x3 = x0 - D.yyy
        let DY = vec3.fromValues(D.y, D.y, D.y);
        let x3 = vec.create();
        vec3.sub(x3, x0, DY);

        // Permutations
        // i = mod289(i);
        i = mod289_vec3(i);
        
        // i.z + vec4(0.0, i1.z, i2.z, 1.0))
        let iZ = vec4.fromValues(i.z, i.z, i.z, i.z);
        let pHelpVec1 = vec4.fromValues(0.0, i1.z, i2.z, 1.0);
        let pVec1 = vec4.create();
        vec4.add(pVec1, iZ, pHelpVec1);

        // i.y + vec4(0.0, i1.x, i2.x,  1.0);
        let iY = vec4.fromValues(i.y, i.y, i.y, i.y);
        let pHelpVec2 = vec4.fromValues(0, i1.y, i2.y, 1.0);
        let pVec2 = vec4.create();
        vec4.add(pVec2, iY, pHelpVec2);

        let iX = vec4.fromValues(i.x, i.x, i.x, i.x);
        let pHelpVec3 = vec4.fromValues(0, i1.x, i2.x, 1);
        let pVec3 = vec4.create();
        vec4.add(pVec3, iX, pHelpVec3);

        let permute1 = permute(pVec1);
        let permute2 = vec4.create();
        vec4.add(permute2, permute1, pVec2);
        let permute3 = vec4.create();
        vec4.add(permute3, permute2, pVec3);

        let p = vec3.clone(permute3);

        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size is 17*17 = 289 is close to a multiple of 49 (49 * 6) = 294
        let n_ = 0.142857142857; // 1.0 / 7.0

        // vec3 ns = n_ * D.wyz - D.xzx;
        let n_Vec = vec4.fromValues(n_, n_, n_, n_);
        let DWYZ = vec4.fromValues(D.w, D.y, D.z);
        let DXZX = vec4.fromValues(D.x, D.z, D.x);
        let ns = vec4.create();
        vec4.mul(ns, n_Vec, DWYZ);
        vec4.sub(ns, ns, DXZX);

        // vec4 j = p - 49.0 * floor(p * ns.z * ns.z); // mod (p, 7 *7)
        let nsZ = vec4.fromValues(ns.z, ns.z, ns.z, ns.z);
        let j = vec4.create();
        vec4.mul(j, p, nsZ);
        vec4.mul(j, j, nsZ);
        vec4.floor(j, j);
        vec4.mul(j, vec4.fromValues(49, 49, 49, 49), j);
        vec4.sub(j, p, j);

        // vec4 x_ = floor(j * ns.z);
        let x_Prodcut = vec4.create();
        vec4.mul(x_Prodcut, j, nsZ);
        let x_ = vec4.create();
        vec4.floor(x_, jTImesNSZ);
        // vec4 y_ = floor(j - 7.0 * x_); // mod(j, N);
        let y_Product = vec4.create();
        vec4.mul(y_Product, vec4.fromValues(7, 7, 7, 7), x_);
        vec4.sub(y_Product, j, y_Product);
        let y_ = vec4.create();
        vec4.floor(y_, y_Product);

        // vec4 x = x_ * ns.x + ns.yyyy;
        let nsY = vec4.fromValues(ns.y, ns.y, ns.y, ns.y);
        let X = vec4.create();
        vec4.scale(X, x_, ns.x);
        vec4.add(X, X, nsY);
        // vec4 y = y_ * ns.x + ns.yyyy;
        let Y = vec4.create();
        vec4.scale(Y, y_, ns.x);
        vec4.add(Y, Y, nsY);
        // vec4 h = 1.0 - abs(x) - abs(y)
        let absX = this.abs_vec4(X);
        let absY = this.abs_vec4(Y);
        let h = vec4.fromValues(1, 1, 1, 1);
        vec4.sub(h, h, absX);
        vec4.sub(h, h, absY);

        // vec4 b0 = vec4(x.xy, y.xy);
        let b0 = vec4.fromValues(X.x, X.y, Y.x, Y.y);
        // vec4 b1 = vec4(x.zw, y.zw);
        let b1 = vec4.fromValues(X.z, X.w, Y.z, Y.w);

        // vec4 s0 = floor(b0) * 2.0 + 1.0;
        let s0 = vec4.create();
        vec4.floor(s0, b0);
        vec4.scale(s0, s0, 2);
        vec4.add(s0, s0, vec4.fromValues(1, 1, 1, 1));
        // vec4 s1 = floor(b1) * 2.0 + 1.0;
        let s1 = vec4.create();
        vec4.floor(s1, b1);
        vec4.scale(s1, s1, 2);
        vec4.add(s1, s1, vec4.fromValues(1, 1, 1, 1));
        // vec4 sh = -step(h, vec4(0.0));
        let sh = this.step_vec4(h, vec4.create());
        vec4.scale(sh, sh, -1);

        // vec4 a0 = b0.xzyw + s0xzyw*sh.xxyy;
        let b0XZYW = vec4.fromValues(b0.x, b0.z, b0.y, b0.w);
        let s0XZYW = vec4.fromValues(s0.x, s0.z, s0.y, s0.w);
        let shXXYY = vec4.fromValues(sh.x, sh.x, sh.y, sh.y);
        let a0 = vec4.create();
        vec4.mul(a0, s0XZYW, shXXYY);
        vec4.add(a0, b0XZYW, a0);
        // vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        let b1XZYW = vec4.fromValues(b1.x, b1.z, b1.y, b1.w);
        let s1XZYW = vec4.fromValues(s1.x, s1.z, s1.y, s1.w);
        let shZZWW = vec4.fromValues(sh.z, sh.z, sh.w, sh.w);
        let a1 = vec4.create();
        vec4.mul(a1, s1XZYW, shZZWW);
        vec4.add(b1XZYW, a1);

        // vec3 p0 = vec3(a0.xy, h.x);
        let p0 = vec3.fromValues(a0.x, a0.y, h.x);
        // vec3 p1 = vec3(a0.zw, h.y);
        let p1 = vec3.fromValues(a0.z, a0.w, h.y);
        // vec3 p2 = vec3(a1.xy, h.z);
        let p2 = vec3.fromValues(a1.x, a1.y, h.z);
        // vec3 p3 = vec3(a1.zw, h.w);
        let p3 = vec3.fromValues(a1.z, a1.w, h.w);

        // Normalize gradiants
        // vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        let pDotVec = vec4.create();
        pDotVec.x = vec4.dot(p0, p0);
        pDotVec.y = vec4.dot(p1, p1);
        pDotVec.z = vec4.dot(p2, p2);
        pDotVec.w = vec4.dot(p3, p3);
        let norm = this.taylorInvSqrt(pDotVec);
        // p0 *= norm.x;
        vec3.scale(p0, p0, norm.x);
        // p1 *= norm.y;
        vec3.scale(p1, p1, norm.y);
        // p2 *= norm.z;
        vec3.scale(p2, p2, norm.z);
        // p3 *= norm.w;
        vec3.scale(p3, p3, norm.w);

        // Mix final noise value
        // vec4 m = max(0.6 - vec4(dot(x0, x0), dot (x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        let xDotVec = vec4.create();
        xDotVec.x = vec4.dot(x0, x0);
        xDotVec.y = vec4.dot(x1, x1);
        xDotVec.z = vec4.dot(x2, x2);
        xDotVec.w = vec4.dot(x3, x3);
        let mLeft = vec4.create();
        vec4.sub(mLeft, vec4.fromValues(0.6, 0.6, 0.6, 0.6), xDotVec);
        let m = this.max_vec4(mLeft, vec4.create());
        // vec4 m2 = m * m;
        let m2 = vec4.create();
        vec4.mul(m2, m, m);
        // vec4 m4 = m2 * m2;
        let m4 = vec4.create();
        vec4.mul(m4, m2, m2);
        // pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
        let pdotx = vec4.create();
        pdotx.x = vec4.dot(p0, x0);
        pdotx.y = vec4.dot(p1, x1);
        pdotx.z = vec4.dot(p2, x2);
        pdotx.w = vec4.dot(p3, x3);

        // Determine noise gradient
        // vec4 temp = m2 * m * pdotx;
        let temp = vec4.create();
        vec4.mul(temp, m2, m);
        vec4.mul(temp, temp, pdotx);
        // gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
        let tempX3 = vec4.create();
        vec4.mul(tempX3, temp.w, x3);
        let tempX2 = vec4.create();
        vec4.mul(tempX2, temp.x, x2);
        let tempX1 = vec4.create();
        vec4.mul(tempX1, temp.y, x1);
        let tempX0 = vec4.create();
        vec4.mul(tempX0, temp.x, x0);
        let gradient = vec4.create();
        vec4.add(gradient, tempX0, tempX1);
        vec4.add(gradient, gradient, tempX2);
        vec4.add(gradient, gradient, tempX3);
        vec4.mul(gradient, vec4.fromValues(-8, -8, -8, -8), gradient);
        // gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
        let m4p0 = vec4.create();
        vec4.scale(m4p0, p0, m4.x);
        let m4p1 = vec4.create();
        vec4.scale(m4p1, p1, m4.y);
        let m4p2 = vec4.create();
        vec4.scale(m4p2, p2, m4.z);
        let m4p3 = vec4.create();
        vec4.scale(m4p3, p3, m4.w);
        vec4.add(gradient, gradient, m4p0);
        vec4.add(gradient, gradient, m4p1);
        vec4.add(gradient, gradient, m4p2);
        vec4.add(gradient, gradient, m4p2);
        // gradient *= 42.0;
        vec4.scale(gradient, gradient, 42);

        // return 42.0 * dot(m4, pdotx);
        let m4DotPdotx = vec4.dot(m4, pdotx);
        let returnVec = vec4.create();
        vec4.mul(returnVec, vec4.fromValues(42, 42, 42, 42), m4DotPdotx);
        return returnVec;
    }
}