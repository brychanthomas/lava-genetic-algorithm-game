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
    var grassInFront = lavas.checkIfGrass(this.player.y-60) ? 1 : 0;
    var rockPos = lavas.getRockX(this.player.y-60) / 400;
    if (this.classifier.predict([grassInFront, rockPos])) {
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

  get y() {
    return this.player.sprite.y;
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
    this.game = game;
    setTimeout(this.update.bind(this), STEP_TIME);
  }

  crossoverWeights(weights1, weights2) {
    let crossoverIndex = Math.floor(Math.random()*(weights1.length+1));
    let newWeights = weights1.slice().splice(0, crossoverIndex);
    newWeights = newWeights.concat(weights2.slice().splice(crossoverIndex));
    return newWeights;
  }

  mutateWeights(weights) {
    if (Math.random() < this.mutationProb) {
      let mutationIndex = Math.floor(Math.random() * weights.length)
      weights[mutationIndex] = (Math.random()*2) - 1;
    }
    return weights;
  }

  update() {
    console.log(this.stepCount);
    this.stepCount++;
    var alive = false;
    for (var i=0; i<this.population.length; i++) {
      if (!this.population[i].dead) {
        alive = true;
        break;
      }
    }
    if (this.stepCount < (10000 / STEP_TIME) && alive) {
      this.makeDecisions();
      setTimeout(this.update.bind(this), STEP_TIME);
    } else {
      this.sortPopulationByFitness();
      this.normaliseFitnesses();
    }
  }

  makeDecisions() {
    var bestY = Infinity;
    for (let agent of this.population) {
      if (!agent.dead) {
        agent.decide(this.lavas);
        if (agent.y < bestY) {bestY = agent.y;}
      }
    }
    this.game.cameras.main.midPoint.y = bestY; //if I don't do this the
    //y coordinates of the lava streams get mucked up because they are based on the
    //camera position and the camera is at weird positions while it is panning
    this.game.cameras.main.pan(200, bestY, STEP_TIME);
  }

  //sort the population by fitness in descending order.
  sortPopulationByFitness() {
    this.population.sort((a, b) => (a.fitness <= b.fitness) ? 1 : -1);
  }

  //divide the fitnesses by the total so that they add up to 1.
  normaliseFitnesses() {
    var fitnessTotal = 0;
    for (let i=0; i<this.population.length; i++) {
      fitnessTotal += this.population[i].fitness;
    }
    for (let i=0; i<this.population.length; i++) {
      this.population[i].fitness /= fitnessTotal;
    }
  }

  //choose random agent with greater probability for greater fitnesses
  pickAgent() {
    let randNum = Math.random();
    let i=0;
    while (randNum >= 0 && i < this.population.length) {
      randNum -= this.population[i].fitness;
      i++;
    }
    return this.population[i-1];
  }
}
