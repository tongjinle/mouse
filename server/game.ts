import * as _ from 'underscore';
import User from './user';
import CONFIG from './config';
import { Animal, Role, Position, Score, GameStatus, GameScore } from './types';

export default class Game {
    // id
    id: string;
    // 玩家列表
    userList: User[];
    // 当前roller玩家索引
    currUserIndex: number;
    // 比分列表
    // 记录猜测者的对错
    scoreList: number[][][];
    // 盘数
    gameCount: number = CONFIG.gameCount;
    // 已经经过的盘数
    roundCount: number;
    // 杯子数量
    cupCount: number = CONFIG.cupCount;
    // 老鼠所在的杯子序号
    cupIndex: number;
    // 猜测的杯子序号
    guessCupIndex: number;
    // 晃动的轨迹
    path: Position[];
    // 游戏状态
    status: GameStatus;

    private calScore(list: number[]) {
        return list.reduce((prev, num) => prev + num, 0);
    }

    public get isOver(): boolean {
        // if (this.gameCount == this.roundCount) {
        //     return true;
        // }
        let currIndex = this.scoreList.length - 1;
        if(currIndex<0){return false;}
        let currScoreList = this.scoreList[currIndex];
        let usScoreList = currScoreList.map(list=>this.calScore(list));
        let [u1sc,u2sc] = usScoreList;
        // 普通轮 bo3
        if (this.gameCount>this.roundCount) {
            // 如果有人已经3分
            // if(u1sc==3||u1sc==3){
            //     return true;
            // }

            if(this.endRoundCount==this.gameCount-1 && u1sc!=u2sc){
                console.log('3 ju jieshu !');
                return true;
            }
            
            // 或者有人现有分数已经超过对方可能得到的最大分数
            let lastU1Sc = [3,2,2,1,1,0][this.roundCount];
            let lastU2Sc = [3,3,2,2,1,1][this.roundCount];
            // console.log('START==******************');
            // console.log({
            //     roundCount:this.roundCount,
            //     u1sc,
            //     u2sc,
            //     lastU1Sc,
            //     lastU2Sc
            // });
            // console.log('END******************');
            if(u1sc>u2sc+lastU2Sc||u2sc>u1sc+lastU1Sc){
                return true;
            }
           
            
        }
        // 加赛轮 bo1
        else {
            if((this.endRoundCount+1)%2==0){
                if(u1sc+u2sc==1){

                    return true;
                }
            }
        }
        
        return false;

    }

    constructor(id: string, userList: User[]) {
        this.id = id;
        this.userList = userList;

        this.scoreList = [];



        this.roundCount = -1;

        this.round();
    }

    // 初始化比分
    private initScore() {
        let round = this.scoreList.length;
        console.log('**************score round', round);
        let currRound = this.scoreList[round] = [];
        this.userList.forEach(() => {
            currRound.push([]);
        });
    }

    // 放置mouse
    putMouse(userId: string, cupIndex: number): boolean {
        let us = this.getUserById(userId);
        if (!us || us.role != Role.roll) {
            return false;
        }
        if (cupIndex < 0 || cupIndex >= this.cupCount) {
            return false;
        }
        this.cupIndex = cupIndex;
        this.status = GameStatus.beforeRolling;
        return true;
    }

    // 晃动杯子
    rollCup(userId: string, posiList: Position[]): boolean {
        let us = this.getUserById(userId);
        if (!us || us.role != Role.roll) {
            return false;
        }
        this.path = posiList;
        this.status = GameStatus.beforeGuess;
        return true;
    }

    // 猜测mouse
    guessMouse(userId: string, cupIndex: number): boolean {
        let us = this.getUserById(userId);
        if (!us || us.role != Role.guess) {
            // console.log({'inner-user':us});
            return false;
        }
        if (cupIndex < 0 || cupIndex >= this.cupCount) {
            // console.log({'inner-cupIndex':cupIndex});
            return false;
        }

        this.guessCupIndex = cupIndex;
        // console.log('in guess mouse:', userId, cupIndex, this.roundCount);

        // 是否猜对
        let ret = true;
        // 如果猜错
        if (this.guessCupIndex != this.cupIndex) {
            let currScoreList = this.scoreList[this.scoreList.length - 1];
            let userIndex: number = _.findIndex(this.userList, us => us.role == Role.roll);
            currScoreList[userIndex].push(Score.win);
            // console.log({userIndex});
            ret = false;
        }
        this.endRoundCount = this.roundCount;

        this.status = GameStatus.roundEnd;
        this.round();
        return ret;
    }

    endRoundCount:number;
    // 回合
    // false表示已经整个游戏都已经结束了//
    round(): boolean {
        // console.log(this.roundCount);
        if (this.isOver) {
            this.status = GameStatus.gameEnd;
            return false;
        }
        this.roundCount++;
        this.endRoundCount = this.roundCount-1;
        this.currUserIndex = this.roundCount % this.userList.length;

        // 普通轮 roundCount == this.gameCount 切换
        // 加赛轮 roundCount > this.gameCount && (roundCount+1) % 2 ==0 切换
        if (this.roundCount ==0 ||
            this.roundCount == this.gameCount ||
            (this.roundCount > this.gameCount && (this.roundCount) % 2 == 0)) {
            this.initScore();
        }

        this.reset();
        this.status = GameStatus.beforePutMouse;
        return true;
    }

    // 分数统计
    countScore(): GameScore {
        let scoreRound = this.scoreList.length-1;
        let normalScoreList = this.scoreList[0];
        let addScoreList = [];
        let totalScoreList = [];
        let userIdList = this.userList.map(us=>us.id);
        this.scoreList.forEach((list, i) => {
            this.userList.forEach((u, ii) => {
                if (i != 0) {
                    addScoreList[ii] = addScoreList[ii] || 0;
                    addScoreList[ii] += list[ii].length;
                }
                totalScoreList[ii] = totalScoreList[ii] || 0;
                totalScoreList[ii] += list[ii].length;
            });
        });
        return { scoreRound,userIdList, normalScoreList, addScoreList, totalScoreList };
    }

    // 重新开始
    private reset() {
        // 交换猜测者和晃动者
        // console.log('RESET-----------------');
        // console.log(this.roundCount);
        this.userList.forEach((us, index) => {
            // console.log(index, this.roundCount, (index + this.roundCount) % 2);
            // console.log('before',us.name, us.role);    
            us.role = [Role.roll, Role.guess][(index + this.roundCount) % 2];
            // console.log('after',us.name, us.role);    
            // us.role = Role.roll+Role.guess-us.role;
        });

        // 清空一些记录数据,把他们初始化
        this.cupIndex = undefined;
        this.guessCupIndex = undefined;
        this.path = undefined;
    }


    // 通过userId获取user
    private getUserById(userId: string): User {
        return _.find(this.userList, us => us.id == userId);
    }


}