import * as _ from 'underscore';
import User from './user';
import CONFIG from './config';
import { Animal, Role, Position, Score, GameStatus } from './types';

export default class Game {
    // id
    id: string;
    // 玩家列表
    userList: User[];
    // 比分列表
    // 记录猜测者的对错
    scoreList: number[];
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

    public get isOver(): boolean {
        return (this.gameCount == this.roundCount)
            || (this.scoreList.length == 2 && this.scoreList[0] != this.scoreList[1]);
    }

    constructor(id: string, userList: User[]) {
        this.id = id;
        this.userList = userList;
        this.scoreList = [];
        this.roundCount = -1;

        this.round();
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
            return false;
        }
        if (cupIndex < 0 || cupIndex >= this.cupCount) {
            return false;
        }

        this.guessCupIndex = cupIndex;
        console.log('in guess mouse:', userId, cupIndex, this.roundCount);

        this.scoreList.push(this.guessCupIndex == this.cupIndex ? Score.win : Score.lost);
        this.status = GameStatus.roundEnd;
        this.round();
        return true;
    }


    // 回合
    // false表示已经整个游戏都已经结束了//
    round(): boolean {
        this.roundCount++;
        if (this.isOver) {
            this.status = GameStatus.gameEnd;
            return false;
        }
        this.reset();
        this.status = GameStatus.beforePutMouse;
        return true;
    }

    // 重新开始
    private reset() {
        // 交换猜测者和晃动者
        this.userList.forEach((us, index) => {
            console.log(index,this.roundCount,(index + this.roundCount) % 2);
            us.role = [Role.roll, Role.guess][(index + this.roundCount) % 2];
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