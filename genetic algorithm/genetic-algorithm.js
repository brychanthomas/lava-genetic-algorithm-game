var STEP_TIME = 200;
var PERFECT_WEIGHTS = new Array((400/10) + 2).fill(-1);
PERFECT_WEIGHTS [1] = 10;
for (let i=15; i<25; i++) {
  PERFECT_WEIGHTS[i] = 10;
}

//logistic regression model for binary classification
class LogisticRegressionClassifier {
  constructor(noOfParams, threshold) {
    this.weights = [];
    for (let i=0; i<noOfParams+1; i++) {
      this.weights.push((Math.random()*2)-1);
    }
    //if no threshold specified set it to 0.5
    this.threshold = threshold || 0.5;
  }

  //calculate sigmoid function for value
  sigmoid(value) {
    return 1 / (1 + Math.pow(Math.E, -value));
  }

  //multiply the corresponding elements in two arrays
  //and add the results together to get the total
  elementWiseMultiply(array1, array2) {
    let result = 0;
    for (let i=0; i<array1.length; i++) {
      result += array1[i] * array2[i];
    }
    return result;
  }

  //return true or false by calculating output from input features
  //array and checking if it is greater than the threshold
  predict(params) {
    params = [1].concat(params);
    let output = this.sigmoid(this.elementWiseMultiply(this.weights, params));
    return (output >= this.threshold);
  }
}

//a player in the GA
class Agent {
  constructor(game) {
    this.player = new Player(game);
    this.player.sprite.alpha = 0.3; //sprite is opaque
    this.classifier = new LogisticRegressionClassifier((400/10) + 1);
    this.fitness = 0;
  }

  //given the LavaManager object, find the values of the input
  //features, feed them to the logistic regression classifier
  //and then jump forward or not depending on its output
  decide(lavas) {
    //if player is not safe in current position or already dead
    if (!lavas.checkIfPlayerSafe(this.player.y) || this.player.dead) {
      this.player.dead = true;
      this.player.sprite.visible = false; //hide sprite
      return;
    }
    //first feature - is there grass in front of current position?
    var grassInFront = lavas.checkIfGrass(this.player.y-60) ? 1 : 0;
    //position of rock on lava in front
    var rockPos = lavas.getRockX(this.player.y-60);
    //array with 40 zeroes, each representing a pixel 10
    //pixels apart from each other
    var rockPosArray = new Array(400 / 10).fill(0);
    //set nearest pixel to rock to one
    if (!grassInFront && rockPos > 0 && rockPos < 400) {
      rockPosArray[Math.round(rockPos/10)] = 1;
    }
    //if logistic regression classifier tells player to jump
    if (this.classifier.predict([grassInFront].concat(rockPosArray))) {
      //move forwards
      this.player.moveUp();
      //increment fitness (score counter)
      this.fitness++;
    }
  }

  //reset at the beginning of a new generation
  reset() {
    this.fitness = 0;
    this.player.dead = false;
    this.player.sprite.y = 420; //go back to start position
    this.player.sprite.visible = true;
  }

  //delete sprite if they did not make it to the next generation
  destroy() {
    this.player.sprite.destroy();
  }

  get dead() {
    return this.player.dead;
  }

  //get classifier weights
  get weights() {
    return this.classifier.weights;
  }

  //set classifier weights
  set weights(array) {
    this.classifier.weights = array;
  }

  get y() {
    return this.player.sprite.y;
  }
}

//class to execute the selection, crossover and mutation
//processes in order to make a genetic algorithm
class GeneticAlgorithm {
  constructor(populationSize, mutationProb, lavas, game) {
    this.population = []; //agents in current generation
    for (let i=0; i<populationSize; i++) {
      this.population.push(new Agent(game));
    }
    //probability new child will mutate
    this.mutationProb = mutationProb;
    //counter used to move on to next generation after 20 seconds
    this.stepCount = 0;
    this.lavas = lavas;
    this.game = game;
    this.generation = 1;
    this.bestFitness = 0;
    //after 200ms call the update method to let the agents make decisions
    setTimeout(this.update.bind(this), STEP_TIME);
  }

  //carry out single-point crossover on two arrays
  crossoverWeights(weights1, weights2) {
    let crossoverIndex = Math.floor(Math.random()*(weights1.length+1));
    let newWeights = weights1.slice().splice(0, crossoverIndex);
    newWeights = newWeights.concat(weights2.slice().splice(crossoverIndex));
    return newWeights;
  }

  //mutate an array by randomly changing an item with a probability
  //of mutationProb. Rest of the time just return the array unmodified
  mutateWeights(weights) {
    if (Math.random() < this.mutationProb) {
      let mutationIndex = Math.floor(Math.random() * weights.length)
      weights[mutationIndex] = (Math.random()*2) - 1;
    }
    return weights;
  }

  //called every STEP_TIME milliseconds by setTimeout
  update() {
    console.log(this.stepCount);
    this.stepCount++;
    var alive = false;
    //check if any agents are still alive
    for (var i=0; i<this.population.length; i++) {
      if (!this.population[i].dead) {
        alive = true;
        break;
      }
    }
    //if generation has been going on for less than 20 seconds
    //and there is at least 1 agent alive
    if (this.stepCount < (20000 / STEP_TIME) && alive) {
      //allows all of the agents to make a decision
      this.makeDecisions();
    } else { //if generation has gone on for more than 20 seconds
      //sort population array based on fitness of agents
      this.sortPopulationByFitness();
      this.normaliseFitnesses();
      this.createNewGeneration();
      this.resetAgents();
      //reset the stepCount to run for 20 seconds again
      this.stepCount = 0;
      this.generation++;
    }
    //call this function again in STEP_TIME milliseconds
    setTimeout(this.update.bind(this), STEP_TIME);
  }

  //allow all of the agents to make decisions
  makeDecisions() {
    var bestY = Infinity;
    for (let agent of this.population) {
      if (!agent.dead) {
        agent.decide(this.lavas);
        //track best agent's fitness and Y position
        if (agent.fitness > this.bestFitness) {this.bestFitness = agent.fitness;}
        if (agent.y < bestY) {bestY = agent.y;}
      }
    }
    //increase lava speed as best fitness increases
    this.lavas.setSpeed(4 + 0.2 * this.bestFitness);
    //this.game.cameras.main.midPoint.y = bestY; //if I don't do this the
    //y coordinates of the lava streams get mucked up because they are based on the
    //camera position and the camera is at weird positions while it is panning
    //move camera to see best agent
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

  //generate children via crossover and mutation, implement elitism
  //by keeping the top 20% of the previous generation
  createNewGeneration() {
    var newAgents = [];
    //create 80% of the new generation using crossover
    while (newAgents.length < this.population.length * 0.8) {
      //select two parents
      var parent1 = this.pickAgent();
      var parent2 = this.pickAgent();
      //create a child
      var child = new Agent(this.game);
      //set the child's weights using crossover of parents and mutate it
      child.weights = this.crossoverWeights(parent1.weights, parent2.weights);
      child.weights = this.mutateWeights(child.weights);
      //add child to new agents array
      newAgents.push(child);
    }
    //add top 20% of previous generation to new agents array
    newAgents = newAgents.concat(this.population.splice(0, this.population.length-newAgents.length));
    //destroy the rest of the previous generation
    for (let i=0; i<this.population.length; i++) {
      this.population[i].destroy();
    }
    this.population = newAgents;
  }

  //reset all agents
  resetAgents() {
    this.bestFitness = 0;
    this.population.forEach(function(agent) {
      agent.reset();
    });
    this.lavas.setSpeed(4);
  }

  //set the first agent in the population to have perfect weights
  //to prove a solution is possible
  createPerfection() {
    this.population[0].weights = PERFECT_WEIGHTS;
    this.population[0].fitness = 20;
  }
}
