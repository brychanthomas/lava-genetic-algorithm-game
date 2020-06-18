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
  constructor(game) {
    this.player = new Player(game);
    //2 parameters - whether there is grass directly ahead and whether
    //there is a rock directly ahead
    this.classifier = new LogisticRegressionClassifier(2);
    this.fitness = 0;
  }

  decide(grassInFront, rockInFront) {
    if (!lavas.checkIfPlayerSafe(this.player.y)) {
      this.player.dead = true;
      return false;
    }
    if (this.classifier.predict([grassInFront, rockInFront])) {
      this.player.moveUp();
      return true;
    }
    return false;
  }

  get dead() {
    return this.player.dead;
  }
}

class GeneticAlgorithm {
  constructor(numOfAgents, mutationProb, game) {
    this.game = game;
    this.mutationProb = mutationProb;
    this.agentOffset = 0;
    this.clockOffset = 0;
    this.agents = [];
    for (let i=0; i<numOfAgents; i++) {
      this.agents.push(new Agent(game));
    }
  }

  crossover(agent1, agent2) {
    console.log(agent1.classifier.weights, agent2.classifier.weights);
    let crossoverIndex = Math.floor(Math.random() * agent1.classifier.weights.length);
    console.log(crossoverIndex);
    let weights = agent1.classifier.weights.splice(0, crossoverIndex);
    weights = weights.concat(agent2.classifier.weights.splice(crossoverIndex));
    agent1.classifier.weights = weights;
    agent1.fitness = 0;
    console.log(agent1.classifier.weights);
    return agent1;
  }

  mutate(agent) {
    if (Math.random() < this.mutationProb) {
      let replaceIndex = Math.floor(Math.random() * (agent.classifier.weights.length+1));
      agent.classifier.weights[replaceIndex] = (Math.random()*2) - 1;
    }
    return agent;
  }

  step(clock) {
    if (clock - this.clockOffset < 10000) {
      //console.log(clock);
      //console.log(this.agents.length);
      //console.log(this.agents[0].classifier.weights);
      for (let i=0; i<this.agents.length; i++) {
        if (!this.agents[i].dead) {
          var grass = lavas.checkIfGrass(this.agents[i].y-60);
          if (!grass) {var rock = lavas.checkIfPlayerSafe(this.agents[i].y-60);}
          else {var rock = false;}
          if (this.agents[i].decide(grass, rock)) {this.agents[i].fitness++}
        }
      }
    } else {
      this.agents = this.agents.sort((a, b) => (a.fitness >= b.fitness) ? 1 : -1);
      var newAgents = [];
      var parent1, parent2;
      while (newAgents.length <= this.agents.length) {
        while (!parent1) {
          let parent1Index = Math.floor(Math.random() * this.agents.length);
          let selectionProb = (parent1Index/this.agents.length) * 0.9 + 0.1;
          if (Math.random() < selectionProb) {
            parent1 = this.agents[parent1Index];
            this.agents.splice(parent1Index, 1);
          }
        }
        while (!parent2) {
          let parent2Index = Math.floor(Math.random() * this.agents.length);
          let selectionProb = (parent2Index/this.agents.length) * 0.9 + 0.1;
          if (Math.random() < selectionProb) {
            parent2 = this.agents[parent2Index];
            this.agents.splice(parent2Index, 1);
          }
        }
        let child = this.crossover(parent1, parent2);
        child = this.mutate(child);
        newAgents.push(child);
        newAgents.push(parent2);
        parent1 = undefined;
        parent2 = undefined;
      }
      this.agents = newAgents.concat(this.agents);
      this.clockOffset = clock;
    }
  }
}

//bug where the number of weights decreases to one on some agents
//and then decreases to 0 next generation
