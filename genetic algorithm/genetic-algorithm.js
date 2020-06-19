var STEP_TIME = 200;

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
    return (output >= this.threshold);
  }
}

class Agent {
  constructor(game) {
    this.player = new Player(game);
    //2 parameters - whether there is grass directly ahead and whether
    //there is a rock directly ahead
    this.classifier = new LogisticRegressionClassifier(2);
    this.fitness = 0;
  }

  decide(lavas) {
    if (!lavas.checkIfPlayerSafe(this.player.y)) {
      this.player.dead = true;
      return;
    }
    let grassInFront = lavas.checkIfGrass(agent.y-60) ? 1 : 0;
    if (grassInFront) {let rockInFront = 0;}
    else {let rockInFront = lavas.checkIfSafe() ? 1: 0;}
    this.classifier.predict([grassInFront, rockInFront]);
    this.player.moveUp();
    this.fitness++;
    }
  }

  reset() {
    this.fitness = 0;
    this.player.dead = false;
  }

  get dead() {
    return this.player.dead;
  }

  get weights() {
    return this.classifier.weights;
  }

  set weights(array) {
    this.classifier.weights = array;
  }
}

class GeneticAlgorithm {
  constructor(populationSize, mutationProb, lavas, game) {
    this.population = [];
    for (let i=0; i<populationSize; i++) {
      this.population.push(new Agent(game));
    }
    this.mutationProb = mutationProb;
    this.stepCount = 0;
    this.lavas = lavas;
  }

  crossover(weights1, weights2) {
    let crossoverIndex = Math.floor(Math.random()*(weights1.length+1));
    let newWeights = weights1.slice().splice(0, crossoverIndex);
    newWeights = newWeights.concat(weights2.slice().splice(crossoverIndex));
    return newWeights;
  }

  mutate(weights) {
    if (Math.random() < this.mutationProb) {
      let mutationIndex = Math.floor(Math.random() * weights.length)
      weights[mutationIndex] = (Math.random()*2) - 1;
    }
    return weights;
  }

  update() {
    this.stepCount++;
    if (this.stepCount < 10000 / STEP_TIME) {
      makeDecisions();
    }
  }

  makeDecisions() {
    for (agent of this.population) {
      if (!agent.dead) {
        agent.decide(this.lavas);
      }
    }
  }
}
