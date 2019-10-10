// js 加法
export const add = function (arg1, arg2) {
    arg1 = arg1.toString(),
    arg2 = arg2.toString();
    let arg1Arr = arg1.split("."),
        arg2Arr = arg2.split("."),
        d1 = arg1Arr.length == 2 ? arg1Arr[1] : "",
        d2 = arg2Arr.length == 2 ? arg2Arr[1] : "";
        
    let maxLen = Math.max(d1.length, d2.length);
    let m = Math.pow(10, maxLen);
    let result = Number(((arg1 * m + arg2 * m) / m).toFixed(maxLen));
    let d = arguments[2];
    return typeof d === "number" ? Number((result).toFixed(d)) : result;
}
// js 减法
export const sub = function (arg1, arg2) {
    return add(arg1, -Number(arg2), arguments[2]);
}

// 乘法
export const mul = function (arg1, arg2) {
    let r1 = arg1.toString(),
        r2 = arg2.toString(),
        m,
        resultVal,
        d = arguments[2];

    m = (r1.split(".")[1] ? r1.split(".")[1].length : 0) + (r2.split(".")[1] ? r2.split(".")[1].length : 0);
    resultVal = Number(r1.replace(".", "")) * Number(r2.replace(".", "")) / Math.pow(10, m);
    return typeof d !== "number" ? Number(resultVal) : Number(resultVal.toFixed(parseInt(d)));
}

// 除法
export const div = function (arg1, arg2) {
   return arg1 / arg2;
}