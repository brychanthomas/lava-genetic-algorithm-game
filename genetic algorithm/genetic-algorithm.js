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

class Agent {
  constructor() {
    this.player = new Player(game);
    //2 parameters - whether there is grass directly ahead and whether
    //there is a rock directly ahead
    this.classifier = new LogisticRegressionClassifier(2);
  }

  decide() {
    
  }
}

class GeneticAlgorithm {
  constructor(numOfAgents, mutationProb, fitnessFunction, game) {
    this.game = game;
    this.mutationProb = mutationProb;
    this.fitnessFunction = fitnessFunction;
    this.agents = [];
    for (let i=0; i<numOfAgents; i++) {
      this.agents.push(new Agent());
    }
  }

  crossover(agent1, agent2) {
    let crossoverIndex = Math.floor(Math.random() * agent1.classifier.weights.length);
    let weights = agent1.classifier.weights.splice(0, crossoverIndex);
    weights = weights.concat(agent2.classifier.weights.splice(crossoverIndex));
    agent1.weights = weights;
    return agent1;
  }

  mutate(agent) {
    if (Math.random() < this.mutationProb) {
      let replaceIndex = Math.floor(Math.random() * (agent1.classifier.weights.length+1));
      agent.classifier.weights[replaceIndex] = (Math.random()*2) - 1;
    }
    return agent;
  }

  findFitnesses() {

  }
}
