class LogisticRegressionClassifier {
  constructor(noOfParams, threshold) {
    this.weights = [];
    for (let i=0; i<noOfParams+1; i++) {
      this.weights.push((Math.random()*2)-1);
    }
    this.threshold = threshold || 0.5;
  }

  sigmoid(value) {
    return 1 / (1 + Math.pow(Math.E, -value));
  }

  elementWiseMultiply(array1, array2) {
    let result = 0;
    for (let i=0; i<array1.length; i++) {
      result += array1[i] * array2[i];
    }
    return result;
  }

  predict(params) {
    params = [1].concat(params);
    let output = this.sigmoid(this.elementWiseMultiply(this.weights, params));
    return (output >= this.threshold ? true : false);
  }
}
