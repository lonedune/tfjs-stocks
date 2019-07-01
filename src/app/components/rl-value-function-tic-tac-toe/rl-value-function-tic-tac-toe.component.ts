import { Component, OnInit } from '@angular/core';
import { GlobalService } from "../../services/global.service";
import { TicTacToeAgent } from "./tic-tac-toe-agent";
import { TicTacToeEnvironment } from "./tic-tac-toe-environment";

@Component({
  selector: 'app-tic-tac-toe',
  templateUrl: './rl-value-function-tic-tac-toe.component.html',
  styleUrls: ['./rl-value-function-tic-tac-toe.component.css']
})
export class RLValueFunctionTicTacToeComponent implements OnInit {

  constructor(private service: GlobalService) {
    this.service.changePageTitle('Tic Tac Toe');
  }

  agent: TicTacToeAgent;
  environment: TicTacToeEnvironment;

  agentA: TicTacToeAgent;
  agentB: TicTacToeAgent;

  input_episodes: number;
  input_agent1_explore_probability = 0;
  input_agent1_learning_rate = 0;
  input_agent2_explore_probability = 0;
  input_agent2_learning_rate = 0;

  strategy: String;
  agent_probability = [];

  ngOnInit() {
    this.environment = new TicTacToeEnvironment(3);
    this.agentA = new TicTacToeAgent(1);
    this.agentB = new TicTacToeAgent(-1);
    this.input_episodes = 1;
    this.input_agent1_explore_probability = 0.1;
    this.input_agent1_learning_rate = 0.5;
    this.input_agent2_explore_probability = 0.1;
    this.input_agent2_learning_rate = 0.5;

    this.input_episodes = 10000;
    this.train_agents();
  }

  play_again(){
    this.environment.reset_game();
    this.play_with_agent();
  }

  async play_game(p1, p2, simulation=false){

    let current_agent = p1;

    for(let i=0;i<9;i++){
      let action = current_agent.take_action(this.environment);

      // console.log(current_agent.name, action, this.environment.get_state());
      this.environment.grid_select(action);

      p1.update_state_history(this.environment.get_state());
      p2.update_state_history(this.environment.get_state());

      if(this.environment.ended){
        break;
      }

      if(current_agent == p1){
        current_agent = p2;
      }else{
        current_agent = p1;
      }

      if(simulation){
        await this.sleep(1000);
      }
    }

    p1.update(this.environment);
    p2.update(this.environment);

  }

  train_agents(){

    this.agentA = new TicTacToeAgent(1, this.input_agent1_explore_probability, this.input_agent1_learning_rate);
    this.agentB = new TicTacToeAgent(-1, this.input_agent2_explore_probability, this.input_agent2_learning_rate);

    let episode = this.input_episodes;

    let state_winner_triples = this.get_state_hash_and_winner(this.environment);

    let V_list = this.initial_values(this.environment, state_winner_triples, this.agentA.name, this.agentB.name);
    this.agentA.set_v(V_list[0]);
    this.agentB.set_v(V_list[1]);

    for(let i=0;i<episode;i++){
      this.play_game(this.agentA, this.agentB);
      this.environment.reset_game();
    }

    this.agentA.skill_level = episode;
    this.agentB.skill_level = episode;

    console.log('train_agents completed');

    this.play_with_agent();
  }

  agent_simulation(){
    this.environment.reset_game();
    this.play_game(this.agentA, this.agentB, true);
  }

  play_with_agent(){

    this.agentA.set_eps(0);

    let action = this.agentA.take_action(this.environment, true);
    let next_move = action[0];
    this.strategy = action[1];

    this.agent_probability = [0,0,0,0,0,0,0,0,0];
    for(let i=0;i<action[2].length;i++){
      this.agent_probability[action[2][i][0]] = (action[2][i][2] * 100).toFixed(1) + "%";
    }

    this.environment.grid_select(next_move);

    this.agentA.update_state_history(this.environment.get_state());

    if(this.environment.ended){
      this.agentA.update(this.environment);
      console.log('ended');
    }

  }

  human_player_move(i){

    this.environment.grid_select(i);

    if(this.environment.ended){
      this.agentA.update(this.environment);
      console.log('ended');
    }else{
      this.play_with_agent();
    }
  }

  get_state_hash_and_winner(env, i=0, j=0){
    let results = [];

    let options = [0,-1,1];//[0, 1, -1];

    for (var vi=0; vi<options.length; vi++) {
      let v = options[vi];
      env.set_cell(i, j, v);
      // console.log(i, j, v, env.board);

      if (j == 2){
        if (i == 2){
          let state = env.get_state();
          let ended = env.is_game_over(env.board);
          let winner = env.winner;
          results.push([state, winner, ended])
        }
        else{
          results = results.concat(this.get_state_hash_and_winner(env, (i+1), 0));
        }
      }
      else{
        results = results.concat(this.get_state_hash_and_winner(env, i, (j+1)));
      }

    }
    return results;
    // env.reset_game();
  }

  initial_values(env, state_winner_triples, p1, p2){

    let V1 = [];
    let V2 = [];

    let V = [];
    for(let i=0;i<state_winner_triples.length;i++){
      V.push(0);
    }

    for(let i=0; i<state_winner_triples.length;i++){
      let v1 = 0.5;
      let v2 = 0.5;
      let state_winner_triple = state_winner_triples[i];
      let state = state_winner_triple[0];
      let winner = state_winner_triple[1];
      let ended = state_winner_triple[2];

      if(ended == true){
        if(winner == p1){
          v1 = 1;
          v2 = 0;
        }else{
          v1 = 0;
          v2 = 1;
        }
      }
      V1[state] = v1;
      V2[state] = v2;
    }
    // console.log('initialV',counter);
    return [V1,V2]
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
